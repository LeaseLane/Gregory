-- Lot G11.7 — fait passer un secret partagé aux appels internes.
--
-- ⚠️  NON APPLIQUÉE. Écrite le 2026-09-09, à relire avant exécution.
--     LIRE L'ORDRE DE DÉPLOIEMENT PLUS BAS — l'inverser coupe
--     l'automatisation (paiements, dispatch, rappels).
--
-- POURQUOI. Dix fonctions edge étaient appelables par n'importe qui.
-- Constaté en production le 2026-09-09, sans aucune clé :
--
--   POST /functions/v1/dispatch-work-order  → HTTP 400 « action inconnue »
--
-- Un 400 et non un 401 : la requête traversait jusqu'à la logique. Ces
-- fonctions ont `verify_jwt = false` (nécessaire : elles sont appelées
-- d'ici, pas par un usager connecté) mais ne vérifiaient ensuite aucun
-- secret. Elles envoient de vrais courriels à de vrais locataires et
-- entrepreneurs, et appellent l'API Anthropic — la facture et la
-- réputation étaient exposées.
--
-- CE QUE FAIT CE FICHIER. Ajoute l'en-tête `x-internal-call-key` à chaque
-- appel sortant des sept fonctions concernées. Le code des fonctions edge
-- (_shared/appel-interne.ts) compare cet en-tête à INTERNAL_CALL_SECRET.
--
-- ============================================================
-- ORDRE DE DÉPLOIEMENT — NE PAS INVERSER
-- ============================================================
--
--   1. Déployer les fonctions edge. La vérification reste INACTIVE tant
--      qu'INTERNAL_CALL_SECRET n'existe pas : rien ne change.
--
--   2. Appliquer CE FICHIER. Les appels portent le secret; les fonctions
--      ne le vérifient pas encore. Rien ne change non plus.
--
--   3. Définir le secret des DEUX côtés, dans cet ordre :
--        a) alter database postgres set app.internal_call_secret = '<secret>';
--        b) INTERNAL_CALL_SECRET = '<le même>' dans le tableau de bord
--           Supabase (Edge Functions → Secrets).
--
--      La protection s'active à l'étape 3b. Faire 3b avant 3a coupe
--      l'automatisation : les fonctions exigeraient un secret que le SQL
--      n'envoie pas encore.
--
-- Générer le secret avec : openssl rand -hex 32
--
-- ⚠️  C'est exactement le scénario qui a tué l'alerte de santé le
-- 2026-08-17 : HEALTH_ALERT_SECRET a divergé du vault et la livraison
-- s'est arrêtée en silence pendant des semaines, parce qu'un refus
-- ressemble à « rien à envoyer ». D'où la vérification qui dort par
-- défaut côté edge, et l'ordre ci-dessus.
--
-- POUR VÉRIFIER APRÈS COUP que la protection est bien active :
--
--   curl -s -o /dev/null -w '%{http_code}\n' -X POST \
--     https://<ref>.supabase.co/functions/v1/dispatch-work-order \
--     -H 'Content-Type: application/json' -d '{}'
--   → doit répondre 403 (et non 400).

-- ============================================================
-- 1. Le secret et les en-têtes standard
-- ============================================================
-- Une seule fonction construit les en-têtes : les sept appelants s'en
-- servent au lieu de répéter le bloc jsonb_build_object. Sans ça, ajouter
-- l'en-tête à 12 endroits à la main invite la faute de frappe qui casse
-- un paiement en silence.

create or replace function internal_call_headers()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  cle text := current_setting('app.internal_call_secret', true);
  anon text := 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR';
  entetes jsonb := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || anon,
    'apikey', anon
  );
begin
  -- Tant que le réglage n'existe pas, on n'ajoute rien : les appels
  -- restent identiques à aujourd'hui (étape 2 de l'ordre ci-dessus).
  if cle is not null and cle <> '' then
    entetes := entetes || jsonb_build_object('x-internal-call-key', cle);
  end if;
  return entetes;
end;
$$;

comment on function internal_call_headers() is
  'En-têtes des appels internes vers les fonctions edge, incluant le secret partagé app.internal_call_secret quand il est défini (lot G11.7).';

-- ============================================================
-- 2. Les sept fonctions appelantes
-- ============================================================
-- Chaque définition est reprise telle qu'elle tourne en production au
-- 2026-09-09; seul le bloc headers change. Toute autre différence serait
-- une régression — comparer avec pg_get_functiondef() en cas de doute.

create or replace function trigger_dispatch_advance()
returns void language plpgsql as $$
begin
  perform net.http_post(
    url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/dispatch-work-order',
    body := jsonb_build_object('action', 'advance'),
    headers := internal_call_headers()
  );
end;
$$;

create or replace function trigger_analyze_owner_message()
returns trigger language plpgsql as $$
begin
  if new.sender = 'owner' then
    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/analyze-satisfaction-signal',
      body := jsonb_build_object(
        'source', 'owner_message', 'subject_type', 'owner', 'subject_id', new.owner_id,
        'related_entity_type', 'messages', 'related_entity_id', new.id, 'content', new.body
      ),
      headers := internal_call_headers()
    );
  end if;
  return new;
end;
$$;

create or replace function notify_listing_needed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('available','soon_available')
     and (
       TG_OP = 'INSERT'
       or old.status is distinct from new.status
       or old.rent is distinct from new.rent
     )
  then
    if TG_OP = 'UPDATE' and old.status is distinct from new.status then
      new.status_changed_at := now();
    end if;
    new.listing_published_at := now();
    new.listing_low_interest := false;
    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/generate-listing',
      body := jsonb_build_object('unit_id', new.id),
      headers := internal_call_headers()
    );
  end if;
  return new;
end;
$$;

create or replace function trigger_monthly_owner_reports()
returns void language plpgsql security definer set search_path = public as $$
declare
  o record;
  v_period_start date := date_trunc('month', current_date - interval '1 month')::date;
  v_period_end date := (date_trunc('month', current_date) - interval '1 day')::date;
begin
  for o in select id from owners loop
    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/generate-owner-report',
      body := jsonb_build_object(
        'owner_id', o.id,
        'period_start', v_period_start,
        'period_end', v_period_end
      ),
      headers := internal_call_headers()
    );
  end loop;
end;
$$;

create or replace function flag_incomplete_onboarding()
returns void language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  update owners o
  set onboarding_completed_at = now()
  from owner_onboarding_checklist c
  where c.owner_id = o.id
    and o.onboarding_completed_at is null
    and not c.missing_phone
    and not c.missing_buildings
    and not c.missing_units
    and c.units_missing_rent_count = 0
    and c.occupied_units_missing_lease_count = 0
    and c.active_leases_missing_tenant_contact_count = 0
    and c.active_leases_missing_bail_doc_count = 0;

  for r in
    select c.owner_id
    from owner_onboarding_checklist c
    join owners o on o.id = c.owner_id
    where o.onboarding_completed_at is null
      and o.created_at <= now() - interval '3 days'
      and (o.onboarding_reminder_sent_at is null or o.onboarding_reminder_sent_at <= now() - interval '5 days')
      and (
        c.missing_phone or c.missing_buildings or c.missing_units
        or c.units_missing_rent_count > 0
        or c.occupied_units_missing_lease_count > 0
        or c.active_leases_missing_tenant_contact_count > 0
        or c.active_leases_missing_bail_doc_count > 0
      )
  loop
    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/send-onboarding-reminder',
      body := jsonb_build_object('owner_id', r.owner_id),
      headers := internal_call_headers()
    );
  end loop;
end;
$$;

create or replace function trigger_payment_reminders()
returns void language plpgsql security definer set search_path = public as $$
declare
  p record;
begin
  update payments set status = 'late'
  where status = 'pending' and due_date < current_date;

  for p in
    select id from payments
    where status = 'pending'
    and due_date between current_date and current_date + interval '3 days'
    and reminder_upcoming_sent = false
    and coalesce(reminder_paused, false) = false
  loop
    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-payment-reminder',
      body := jsonb_build_object('payment_id', p.id, 'reminder_type', 'upcoming'),
      headers := internal_call_headers()
    );
    update payments set reminder_upcoming_sent = true where id = p.id;
  end loop;

  for p in
    select id, due_date, late_reminder_count from payments
    where status = 'late'
    and coalesce(reminder_paused, false) = false
    and coalesce(escalated_to_human, false) = false
    and coalesce(late_reminder_count, 0) < 3
    and (current_date - due_date) >= (array[1,3,5])[coalesce(late_reminder_count, 0) + 1]
  loop
    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-payment-reminder',
      body := jsonb_build_object('payment_id', p.id, 'reminder_type', 'late'),
      headers := internal_call_headers()
    );
    update payments set late_reminder_count = coalesce(late_reminder_count, 0) + 1, last_late_reminder_at = now() where id = p.id;
  end loop;

  for p in
    select id from payments
    where status = 'late'
    and coalesce(reminder_paused, false) = false
    and coalesce(escalated_to_human, false) = false
    and (current_date - due_date) >= 8
  loop
    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-payment-reminder',
      body := jsonb_build_object('payment_id', p.id, 'reminder_type', 'escalate'),
      headers := internal_call_headers()
    );
    update payments set escalated_to_human = true where id = p.id;
  end loop;
end;
$$;

create or replace function handle_approval_decision()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_token uuid;
  v_service_request_id uuid;
  v_urgent boolean;
  v_days int;
begin
  if old.status = 'pending' and new.status = 'approved' then
    v_token := gen_random_uuid();
    update work_orders set
      worker_notified = true,
      worker_notified_at = now(),
      worker_response = 'pending',
      worker_response_token = v_token,
      worker_response_note = null,
      response_reminder_sent = false,
      response_escalated = false
    where id = new.work_order_id;

    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-worker-job-assigned',
      body := jsonb_build_object('work_order_id', new.work_order_id, 'response_token', v_token, 'notification_type', 'assigned'),
      headers := internal_call_headers()
    );

    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-approval-decision',
      body := jsonb_build_object('approval_id', new.id, 'decision', 'approved'),
      headers := internal_call_headers()
    );
    insert into audit_log (actor_type, actor_id, action, entity_type, entity_id, details)
    values ('owner', auth.uid(), 'approval.approved', 'approvals', new.id,
      jsonb_build_object('work_order_id', new.work_order_id, 'requested_amount', new.requested_amount));
  elsif old.status = 'pending' and new.status = 'rejected' then
    update work_orders set status = 'cancelled' where id = new.work_order_id;

    select wo.service_request_id,
           coalesce(sr.safety_override, false) or coalesce(sr.ai_urgency in ('urgence', 'élevé'), false)
      into v_service_request_id, v_urgent
    from work_orders wo
    left join service_requests sr on sr.id = wo.service_request_id
    where wo.id = new.work_order_id;

    v_days := case when v_urgent then 1 else 3 end;

    if v_service_request_id is not null then
      update service_requests set
        status = 'open',
        pending_reassessment = true,
        reassessment_due = current_date + v_days
      where id = v_service_request_id;
    end if;

    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-approval-decision',
      body := jsonb_build_object('approval_id', new.id, 'decision', 'rejected'),
      headers := internal_call_headers()
    );
    insert into audit_log (actor_type, actor_id, action, entity_type, entity_id, details)
    values ('owner', auth.uid(), 'approval.rejected', 'approvals', new.id,
      jsonb_build_object('work_order_id', new.work_order_id, 'requested_amount', new.requested_amount, 'reassessment_due', current_date + v_days));
  end if;
  return new;
end;
$$;

-- ============================================================
-- Vérification après exécution
-- ============================================================
-- Plus aucun bloc d'en-têtes en dur parmi les sept fonctions :
--
--   select proname from pg_proc p
--   join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public'
--     and proname in ('trigger_dispatch_advance','trigger_analyze_owner_message',
--                     'notify_listing_needed','trigger_monthly_owner_reports',
--                     'flag_incomplete_onboarding','trigger_payment_reminders',
--                     'handle_approval_decision')
--     and pg_get_functiondef(p.oid) not like '%internal_call_headers()%';
--   → doit ne rien retourner.
--
-- Une fois le secret défini des deux côtés, l'en-tête doit apparaître :
--
--   select internal_call_headers() ? 'x-internal-call-key';
--   → doit retourner true.
--
-- RESTE HORS DE CE FICHIER. Les fonctions edge suivantes sont encore
-- publiques et non couvertes ici, faute d'appelant SQL correspondant ou
-- parce qu'elles sont légitimement publiques (formulaires locataire,
-- réponses travailleur par lien, FAQ publique) :
-- handle-inquiry, handle-mandat-inquiry, handle-public-faq,
-- handle-public-inquiry, handle-service-request, handle-tenant-confirmation,
-- handle-visit-response, handle-worker-registration, handle-worker-response,
-- health-check. Celles qui portent déjà un jeton signé dans l'URL sont
-- protégées autrement; les autres restent à examiner.
