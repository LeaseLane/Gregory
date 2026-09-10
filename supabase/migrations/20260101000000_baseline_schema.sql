-- ============================================================
-- RÉFÉRENCE DE SCHÉMA (baseline) — lot P1
-- ============================================================
--
-- POURQUOI CE FICHIER. Jusqu'ici, l'historique de migrations de Supabase
-- était VIDE : les 49 tables, 87 policies, 50 fonctions, 20 triggers et
-- 15 index de la production avaient été collés à la main dans le SQL
-- Editor au fil des mois (procédure décrite dans
-- supabase/migrations/README.md). Conséquence : `supabase branches create`
-- rejouait un historique vide et produisait une base sans aucune table —
-- ce qui rendait impossible tout environnement de préproduction, donc les
-- lots P1 (chaîne de déploiement + retour arrière), P10 (test de
-- restauration) et P11 (parcours complet en préproduction).
--
-- Ce fichier est la photo de la production au 2026-09-07, obtenue par
-- `supabase db dump` (pg_dump 17, via la CLI). Il est horodaté AVANT les
-- migrations du 2026-09-07 pour que l'ordre de rejeu soit correct :
-- référence d'abord, correctifs P6/P8 ensuite.
--
-- CE FICHIER N'A PAS ÉTÉ EXÉCUTÉ CONTRE LA PRODUCTION et ne doit pas
-- l'être. Il est enregistré comme « déjà appliqué » dans l'historique.
-- Son seul usage réel est la reconstruction d'une base vide (branche,
-- préproduction, restauration).
--
-- CE QU'IL CONTIENT
--   - 6 extensions, 49 tables, 133 contraintes, 15 index explicites
--   - 87 policies RLS + RLS activé sur les 49 tables
--   - 50 fonctions, 3 vues, 20 triggers
--
-- CE QU'IL NE CONTIENT PAS, ET QUI DEVRA ÊTRE REFAIT SUR UNE BRANCHE
--   1. Les 18 tâches cron (schéma `cron`). À recréer avec cron.schedule().
--   2. Les secrets du vault (`flinks_sync_secret`, `health_alert_secret`)
--      et les secrets des edge functions. Par construction non exportables.
--   3. Les données. Une branche naît vide : voir seed.sql.
--   4. Le trigger auth.on_auth_user_created (hors schéma public).
-- Une préproduction sans ces éléments ne reproduit PAS le comportement de
-- la production — à retenir pour P11, dont le parcours complet dépend des
-- tâches cron et des secrets.
--
-- AVERTISSEMENT SUR L'IDEMPOTENCE. Le dump utilise CREATE TABLE et
-- CREATE TRIGGER sans garde « if not exists » : rejoué sur une base qui
-- contient déjà ces objets, il échoue. C'est voulu — un échec bruyant vaut
-- mieux qu'un écrasement silencieux d'une base peuplée. Ne l'exécuter que
-- sur une base vide.
-- ============================================================





SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."accept_job_offer"("p_offer_id" "uuid", "p_worker_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_offer record;
  v_wo record;
begin
  select * into v_offer from job_offers where id = p_offer_id and worker_id = p_worker_id for update;
  if v_offer is null then
    return jsonb_build_object('ok', false, 'error', 'Offre introuvable');
  end if;
  if v_offer.status <> 'sent' then
    return jsonb_build_object('ok', false, 'error', 'Cette offre n''est plus disponible');
  end if;

  select * into v_wo from work_orders where id = v_offer.work_order_id for update;
  if v_wo.worker_id is not null and v_wo.worker_response = 'accepted' then
    update job_offers set status = 'expired', responded_at = now() where id = p_offer_id;
    return jsonb_build_object('ok', false, 'error', 'Ce mandat a déjà été accepté par quelqu''un d''autre');
  end if;

  update job_offers set status = 'accepted', responded_at = now() where id = p_offer_id;
  update job_offers set status = 'expired', responded_at = now()
    where work_order_id = v_offer.work_order_id and id <> p_offer_id and status in ('sent', 'queued');

  update work_orders set
    worker_id = p_worker_id,
    worker_notified = true,
    worker_notified_at = coalesce(worker_notified_at, now()),
    worker_response = 'accepted',
    worker_response_at = now(),
    status = case when status = 'open' then 'assigned' else status end
  where id = v_offer.work_order_id;

  return jsonb_build_object('ok', true, 'work_order_id', v_offer.work_order_id);
end;
$$;


ALTER FUNCTION "public"."accept_job_offer"("p_offer_id" "uuid", "p_worker_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_caller_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$ select id from cold_callers where user_id = auth.uid() $$;


ALTER FUNCTION "public"."auth_caller_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$ select coalesce((select is_admin from users where id = auth.uid()), false) $$;


ALTER FUNCTION "public"."auth_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_owner_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
  select id from owners where user_id = auth.uid()
$$;


ALTER FUNCTION "public"."auth_owner_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_tenant_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
  select id from tenants where user_id = auth.uid()
$$;


ALTER FUNCTION "public"."auth_tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_lease_renewal_windows"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  r record;
begin
  for r in
    select * from lease_renewal_tracking
    where renewal_notice_sent_at is null
    and current_date = notice_window_start
  loop
    insert into audit_log (actor_type, action, entity_type, entity_id, details)
    values ('system', 'lease_renewal.window_open', 'leases', r.lease_id,
      jsonb_build_object('notice_window_end', r.notice_window_end, 'term_type', r.term_type));
  end loop;

  for r in
    select * from lease_renewal_tracking
    where renewal_notice_sent_at is null
    and coalesce(renewal_deadline_missed, false) = false
    and current_date > notice_window_end
  loop
    update leases set renewal_deadline_missed = true where id = r.lease_id;
    insert into audit_log (actor_type, action, entity_type, entity_id, details)
    values ('system', 'lease_renewal.deadline_missed', 'leases', r.lease_id,
      jsonb_build_object('notice_window_end', r.notice_window_end, 'end_date', r.end_date));
  end loop;

  for r in
    select l.id as lease_id, l.unit_id
    from leases l
    where l.status = 'active' and l.end_date is not null
    and l.end_date - current_date <= 30
    and (l.renewal_response = 'refused' or l.renewal_notice_type = 'non_renouvellement')
    and coalesce(l.relocation_prep_needed, false) = false
  loop
    update leases set relocation_prep_needed = true where id = r.lease_id;
    update units set status = 'soon_available' where id = r.unit_id and status = 'occupied';
    insert into audit_log (actor_type, action, entity_type, entity_id, details)
    values ('system', 'lease_renewal.relocation_prep_started', 'leases', r.lease_id, jsonb_build_object('unit_id', r.unit_id));
  end loop;
end;
$$;


ALTER FUNCTION "public"."check_lease_renewal_windows"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_recent_http_failures"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row record;
begin
  -- Fenêtre de 15 min avec chevauchement volontaire sur la tâche (10 min) :
  -- une réponse arrivée juste après le passage précédent est quand même vue.
  -- La garde anti-doublon ci-dessous empêche de journaliser deux fois.
  for v_row in
    select r.id, r.status_code, left(coalesce(r.content, ''), 500) as content,
           r.error_msg, r.created
    from net._http_response r
    where r.created > now() - interval '15 minutes'
      and (r.status_code is null or r.status_code >= 400)
  loop
    insert into audit_log (actor_type, action, entity_type, entity_id, details)
    select 'system', 'cron.http_call_failed', 'net_http_response', null,
           jsonb_build_object(
             'response_id', v_row.id,
             'status_code', v_row.status_code,
             'error_msg', v_row.error_msg,
             'content', v_row.content,
             'occurred_at', v_row.created)
    where not exists (
      select 1 from audit_log a
      where a.action = 'cron.http_call_failed'
        and a.details->>'response_id' = v_row.id::text
    );
  end loop;
end;
$$;


ALTER FUNCTION "public"."check_recent_http_failures"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_recent_http_failures"() IS 'Lot P8 : relit net._http_response et journalise les échecs HTTP des tâches cron, que net.http_post() ne peut pas signaler (appel asynchrone).';



CREATE OR REPLACE FUNCTION "public"."check_system_health"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  v_issues jsonb := '[]'::jsonb;
  v_stale_cron_count int := 0;
  v_stale_flinks_count int;
  v_ai_error_count int;
  v_stuck_privacy_count int;
  v_http_fail_count int;
  v_http_fail_detail text;
begin
  -- 1. Tâches cron actives sans exécution réussie depuis DEUX fois leur
  --    propre intervalle de planification.
  begin
    select count(*) into v_stale_cron_count
    from cron.job j
    cross join lateral (
      select case
        when split_part(j.schedule, ' ', 3) ~ '^[0-9]+$' then interval '35 days'
        when split_part(j.schedule, ' ', 2) ~ '^[0-9]+$' then interval '26 hours'
        when split_part(j.schedule, ' ', 1) ~ '^[0-9]+$' then interval '3 hours'
        when split_part(j.schedule, ' ', 1) like '*/%' then interval '1 hour'
        else interval '26 hours'
      end as tolerance
    ) t
    where j.active
      and not exists (
        select 1 from cron.job_run_details d
        where d.jobid = j.jobid and d.status = 'succeeded' and d.end_time > now() - t.tolerance
      );
  exception when others then
    v_stale_cron_count := -1;
  end;
  if v_stale_cron_count > 0 then
    v_issues := v_issues || jsonb_build_object('type', 'cron_stale', 'severity', 'critical', 'detail', v_stale_cron_count || ' tâche(s) cron sans exécution réussie dans leur fenêtre de planification');
  elsif v_stale_cron_count < 0 then
    v_issues := v_issues || jsonb_build_object('type', 'cron_check_unavailable', 'severity', 'warning', 'detail', 'Impossible de lire cron.job_run_details depuis cette fonction — à vérifier manuellement');
  end if;

  -- 2. Appels HTTP de tâches cron en échec dans les dernières 24h.
  --    net.http_post() étant asynchrone, la fonction appelante ne peut pas
  --    voir ce statut : il est journalisé par check_recent_http_failures().
  select count(*),
         string_agg(distinct 'HTTP ' || coalesce(details->>'status_code', 'nul'), ', ')
    into v_http_fail_count, v_http_fail_detail
  from audit_log
  where action = 'cron.http_call_failed' and created_at > now() - interval '24 hours';
  if v_http_fail_count > 0 then
    v_issues := v_issues || jsonb_build_object('type', 'cron_http_failed', 'severity', 'critical',
      'detail', v_http_fail_count || ' appel(s) HTTP de tâche planifiée en échec sur 24h (' || coalesce(v_http_fail_detail, '') || ') — une automatisation n''a pas eu lieu');
  end if;

  -- 3. Connexions bancaires actives non synchronisées depuis 48h.
  select count(*) into v_stale_flinks_count
  from bank_connections
  where status = 'active' and (last_synced_at is null or last_synced_at < now() - interval '48 hours');
  if v_stale_flinks_count > 0 then
    v_issues := v_issues || jsonb_build_object('type', 'flinks_stale', 'severity', 'warning', 'detail', v_stale_flinks_count || ' connexion(s) bancaire(s) non synchronisée(s) depuis 48h');
  end if;

  -- 4. Taux d'erreur IA élevé dans les dernières 24h.
  select count(*) into v_ai_error_count
  from ai_run_log
  where created_at > now() - interval '24 hours' and error is not null;
  if v_ai_error_count > 10 then
    v_issues := v_issues || jsonb_build_object('type', 'ai_errors_high', 'severity', 'warning', 'detail', v_ai_error_count || ' erreurs IA dans les dernières 24h');
  end if;

  -- 5. Demandes Loi 25 approchant le délai légal de 30 jours.
  select count(*) into v_stuck_privacy_count
  from personal_data_requests
  where status = 'pending' and created_at < now() - interval '25 days';
  if v_stuck_privacy_count > 0 then
    v_issues := v_issues || jsonb_build_object('type', 'privacy_deadline_risk', 'severity', 'critical', 'detail', v_stuck_privacy_count || ' demande(s) Loi 25 approchant le délai légal de 30 jours');
  end if;

  return jsonb_build_object('checked_at', now(), 'healthy', jsonb_array_length(v_issues) = 0, 'issues', v_issues);
end;
$_$;


ALTER FUNCTION "public"."check_system_health"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_work_order_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_owner_id uuid;
  v_cap numeric;
begin
  select o.id, o.spending_cap into v_owner_id, v_cap
  from owners o
  join buildings b on b.owner_id = o.id
  join units u on u.building_id = b.id
  where u.id = NEW.unit_id;

  if NEW.estimated_cost is not null and NEW.estimated_cost > v_cap then
    insert into approvals (work_order_id, owner_id, requested_amount, spending_cap_at_request, status)
    values (NEW.id, v_owner_id, NEW.estimated_cost, v_cap, 'pending');

    insert into automated_decisions (decision_type, subject_type, subject_id, entity_type, entity_id, summary, factors)
    values ('work_order_approval_required', 'owner', v_owner_id, 'work_orders', NEW.id,
      'Réparation soumise à votre approbation car son coût estimé dépasse votre plafond.',
      jsonb_build_object('estimated_cost', NEW.estimated_cost, 'spending_cap', v_cap, 'regle', 'estimated_cost > spending_cap'));
  elsif v_owner_id is not null then
    insert into automated_decisions (decision_type, subject_type, subject_id, entity_type, entity_id, summary, factors)
    values ('work_order_auto_proceed', 'owner', v_owner_id, 'work_orders', NEW.id,
      'Réparation lancée automatiquement, sans votre approbation, car son coût estimé respecte votre plafond.',
      jsonb_build_object('estimated_cost', NEW.estimated_cost, 'spending_cap', v_cap, 'regle', 'estimated_cost <= spending_cap ou non estime'));
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."check_work_order_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compute_prospect_derived_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_filled int := 0;
  v_total int := 6;
begin
  if new.full_name is not null and new.full_name <> '' then v_filled := v_filled + 1; end if;
  if new.email is not null and new.email <> '' then v_filled := v_filled + 1; end if;
  if new.phone is not null and new.phone <> '' then v_filled := v_filled + 1; end if;
  if new.company_name is not null and new.company_name <> '' then v_filled := v_filled + 1; end if;
  if new.num_doors is not null then v_filled := v_filled + 1; end if;
  if new.avg_rent is not null then v_filled := v_filled + 1; end if;
  new.completeness_score := round((v_filled::numeric / v_total) * 100);

  new.signing_probability := case new.stage
    when 'signed' then 100
    when 'lost' then 0
    when 'proposal_sent' then case new.interest_level when 'chaud' then 70 when 'tiede' then 45 when 'froid' then 20 else 50 end
    when 'interested' then case new.interest_level when 'chaud' then 55 when 'tiede' then 30 when 'froid' then 10 else 35 end
    when 'contacted' then case new.interest_level when 'chaud' then 35 when 'tiede' then 20 when 'froid' then 5 else 20 end
    else 10
  end;

  new.next_action := case new.stage
    when 'new' then 'Premier contact à effectuer'
    when 'contacted' then 'Qualifier l''intérêt (appel de suivi)'
    when 'interested' then 'Envoyer une proposition/soumission'
    when 'proposal_sent' then 'Relancer pour obtenir la décision'
    when 'signed' then 'Amorcer l''onboarding du nouveau client'
    when 'lost' then 'Aucune action — dossier fermé'
    else null
  end;

  if new.potential_monthly_revenue is not null then
    new.vendor_commission_estimate := round(new.potential_monthly_revenue * 0.10 * 100) / 100;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."compute_prospect_derived_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."detect_financial_anomalies"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
begin
  insert into financial_anomalies (type, severity, description, owner_id, related_expense_id)
  select 'facture_dupliquee', 'eleve',
    'Deux dépenses similaires (' || e1.amount || ' $) pour le même immeuble à ' || abs(e1.expense_date - e2.expense_date) || ' jour(s) d''écart.',
    b.owner_id, e1.id
  from expenses e1
  join expenses e2 on e2.building_id = e1.building_id
    and e2.amount = e1.amount
    and e2.id <> e1.id
    and abs(e1.expense_date - e2.expense_date) <= 3
  join buildings b on b.id = e1.building_id
  where e1.id < e2.id
    and not exists (
      select 1 from financial_anomalies fa
      where fa.type = 'facture_dupliquee' and fa.related_expense_id = e1.id and fa.status <> 'dismissed'
    );

  insert into automated_decisions (decision_type, subject_type, subject_id, entity_type, entity_id, summary, factors)
  select 'financial_anomaly_facture_dupliquee', 'owner', b.owner_id, 'expenses', e1.id,
    'Anomalie signalée automatiquement : deux dépenses similaires pour le même immeuble à peu de jours d''écart.',
    jsonb_build_object('amount', e1.amount, 'other_expense_id', e2.id, 'jours_ecart', abs(e1.expense_date - e2.expense_date))
  from expenses e1
  join expenses e2 on e2.building_id = e1.building_id
    and e2.amount = e1.amount and e2.id <> e1.id
    and abs(e1.expense_date - e2.expense_date) <= 3
  join buildings b on b.id = e1.building_id
  where e1.id < e2.id
    and exists (select 1 from financial_anomalies fa where fa.type = 'facture_dupliquee' and fa.related_expense_id = e1.id and fa.status <> 'dismissed')
    and not exists (select 1 from automated_decisions ad where ad.decision_type = 'financial_anomaly_facture_dupliquee' and ad.entity_id = e1.id);

  insert into financial_anomalies (type, severity, description, owner_id, related_expense_id, related_work_order_id)
  select 'depassement_cout', 'moyen',
    'Coût final (' || e.amount || ' $) supérieur de plus de 20% à l''estimation (' || wo.estimated_cost || ' $).',
    b.owner_id, e.id, wo.id
  from expenses e
  join work_orders wo on wo.id = e.work_order_id
  join buildings b on b.id = e.building_id
  where wo.estimated_cost is not null
    and e.amount > wo.estimated_cost * 1.2
    and not exists (
      select 1 from financial_anomalies fa
      where fa.type = 'depassement_cout' and fa.related_expense_id = e.id and fa.status <> 'dismissed'
    );

  insert into automated_decisions (decision_type, subject_type, subject_id, entity_type, entity_id, summary, factors)
  select 'financial_anomaly_depassement_cout', 'owner', b.owner_id, 'expenses', e.id,
    'Anomalie signalée automatiquement : coût final supérieur de plus de 20% à l''estimation.',
    jsonb_build_object('amount', e.amount, 'estimated_cost', wo.estimated_cost, 'work_order_id', wo.id)
  from expenses e
  join work_orders wo on wo.id = e.work_order_id
  join buildings b on b.id = e.building_id
  where wo.estimated_cost is not null and e.amount > wo.estimated_cost * 1.2
    and exists (select 1 from financial_anomalies fa where fa.type = 'depassement_cout' and fa.related_expense_id = e.id and fa.status <> 'dismissed')
    and not exists (select 1 from automated_decisions ad where ad.decision_type = 'financial_anomaly_depassement_cout' and ad.entity_id = e.id);

  insert into financial_anomalies (type, severity, description, owner_id, related_payment_id)
  select 'loyer_montant_incorrect', 'moyen',
    'Paiement de ' || p.amount || ' $ reçu alors que le loyer du bail est de ' || l.monthly_rent || ' $.',
    b.owner_id, p.id
  from payments p
  join leases l on l.id = p.lease_id
  join units u on u.id = l.unit_id
  join buildings b on b.id = u.building_id
  where p.status = 'paid'
    and p.amount <> l.monthly_rent
    and not exists (
      select 1 from financial_anomalies fa
      where fa.type = 'loyer_montant_incorrect' and fa.related_payment_id = p.id and fa.status <> 'dismissed'
    );

  insert into automated_decisions (decision_type, subject_type, subject_id, entity_type, entity_id, summary, factors)
  select 'financial_anomaly_loyer_montant_incorrect', 'owner', b.owner_id, 'payments', p.id,
    'Anomalie signalée automatiquement : montant du paiement différent du loyer prévu au bail.',
    jsonb_build_object('amount', p.amount, 'monthly_rent', l.monthly_rent, 'lease_id', l.id)
  from payments p
  join leases l on l.id = p.lease_id
  join units u on u.id = l.unit_id
  join buildings b on b.id = u.building_id
  where p.status = 'paid' and p.amount <> l.monthly_rent
    and exists (select 1 from financial_anomalies fa where fa.type = 'loyer_montant_incorrect' and fa.related_payment_id = p.id and fa.status <> 'dismissed')
    and not exists (select 1 from automated_decisions ad where ad.decision_type = 'financial_anomaly_loyer_montant_incorrect' and ad.entity_id = p.id);

  insert into financial_anomalies (type, severity, description, owner_id, related_expense_id)
  select 'recu_manquant', 'moyen',
    'Dépense de ' || e.amount || ' $ enregistrée sans facture/reçu joint.',
    b.owner_id, e.id
  from expenses e
  join buildings b on b.id = e.building_id
  where e.receipt_document_id is null
    and e.amount > 50
    and not exists (
      select 1 from financial_anomalies fa
      where fa.type = 'recu_manquant' and fa.related_expense_id = e.id and fa.status <> 'dismissed'
    );

  insert into automated_decisions (decision_type, subject_type, subject_id, entity_type, entity_id, summary, factors)
  select 'financial_anomaly_recu_manquant', 'owner', b.owner_id, 'expenses', e.id,
    'Anomalie signalée automatiquement : dépense enregistrée sans facture/reçu joint.',
    jsonb_build_object('amount', e.amount)
  from expenses e
  join buildings b on b.id = e.building_id
  where e.receipt_document_id is null and e.amount > 50
    and exists (select 1 from financial_anomalies fa where fa.type = 'recu_manquant' and fa.related_expense_id = e.id and fa.status <> 'dismissed')
    and not exists (select 1 from automated_decisions ad where ad.decision_type = 'financial_anomaly_recu_manquant' and ad.entity_id = e.id);
end;
$_$;


ALTER FUNCTION "public"."detect_financial_anomalies"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_data_retention"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update prospects
  set full_name = 'Prospect anonymisé', email = null, phone = null, company_name = null,
      notes = null, call_history = '[]'::jsonb, anonymized_at = now()
  where stage = 'lost'
    and stage_changed_at < now() - interval '2 years'
    and anonymized_at is null;

  update inquiries
  set full_name = 'Anonymisé', email = 'anonymise@portail.local', phone = null, message = null,
      anonymized_at = now()
  where status = 'closed'
    and created_at < now() - interval '2 years'
    and anonymized_at is null;

  update tenants t
  set full_name = 'Locataire anonymisé', email = null, phone = null, anonymized_at = now()
  where t.anonymized_at is null
    and exists (select 1 from leases l where l.tenant_id = t.id)
    and not exists (select 1 from leases l where l.tenant_id = t.id and (l.status = 'active' or l.end_date is null or l.end_date >= now() - interval '3 years'))
    and not exists (select 1 from service_requests sr where sr.tenant_id = t.id and sr.status <> 'closed');

  delete from ai_run_log where created_at < now() - interval '1 year';
  delete from audit_log where created_at < now() - interval '5 years';
end;
$$;


ALTER FUNCTION "public"."enforce_data_retention"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."flag_incomplete_onboarding"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
        'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
      )
    );
  end loop;
end;
$$;


ALTER FUNCTION "public"."flag_incomplete_onboarding"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."flag_stale_listings"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update units u set listing_low_interest = true
  where u.status in ('available', 'soon_available')
    and u.listing_published_at is not null
    and u.listing_published_at <= now() - interval '5 days'
    and coalesce(u.listing_low_interest, false) = false
    and (
      select count(*) from inquiries i
      where i.unit_id = u.id and i.type = 'visite' and i.created_at >= u.listing_published_at
    ) < 2;
end;
$$;


ALTER FUNCTION "public"."flag_stale_listings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."flag_stuck_repair_cases"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  r record;
begin
  for r in
    select id, description from service_requests
    where status = 'open' and ai_category is null
    and created_at <= now() - interval '2 days'
  loop
    insert into audit_log (actor_type, action, entity_type, entity_id, details)
    select 'system', 'repair_case.stuck_no_diagnosis', 'service_requests', r.id, jsonb_build_object('description', r.description)
    where not exists (
      select 1 from audit_log where entity_type = 'service_requests' and entity_id = r.id
      and action = 'repair_case.stuck_no_diagnosis' and created_at >= now() - interval '2 days'
    );
  end loop;

  for r in
    select sr.id, sr.description
    from service_requests sr
    where sr.status = 'open' and sr.ai_category is not null
    and not exists (select 1 from work_orders wo where wo.service_request_id = sr.id and wo.status <> 'cancelled')
    and sr.created_at <= now() - (case when coalesce(sr.safety_override, false) or sr.ai_urgency = 'urgence' then interval '1 day' else interval '3 days' end)
  loop
    insert into audit_log (actor_type, action, entity_type, entity_id, details)
    select 'system', 'repair_case.stuck_no_worker_assigned', 'service_requests', r.id, jsonb_build_object('description', r.description)
    where not exists (
      select 1 from audit_log where entity_type = 'service_requests' and entity_id = r.id
      and action = 'repair_case.stuck_no_worker_assigned' and created_at >= now() - interval '1 day'
    );
  end loop;

  for r in
    select id, description from work_orders
    where status = 'in_progress' and worker_response = 'accepted'
    and worker_response_at <= now() - interval '5 days'
  loop
    insert into audit_log (actor_type, action, entity_type, entity_id, details)
    select 'system', 'repair_case.stuck_not_started', 'work_orders', r.id, jsonb_build_object('description', r.description)
    where not exists (
      select 1 from audit_log where entity_type = 'work_orders' and entity_id = r.id
      and action = 'repair_case.stuck_not_started' and created_at >= now() - interval '2 days'
    );
  end loop;

  for r in
    select id, description from expenses
    where receipt_document_id is null
    and expense_date <= current_date - interval '5 days'
  loop
    insert into audit_log (actor_type, action, entity_type, entity_id, details)
    select 'system', 'repair_case.stuck_missing_receipt', 'expenses', r.id, jsonb_build_object('description', r.description)
    where not exists (
      select 1 from audit_log where entity_type = 'expenses' and entity_id = r.id
      and action = 'repair_case.stuck_missing_receipt' and created_at >= now() - interval '2 days'
    );
  end loop;

  for r in
    select wo.id, wo.description, wo.tenant_confirmation_sent_at, wo.tenant_reminder_sent, sr.id as service_request_id, sr.tenant_id
    from work_orders wo
    join service_requests sr on sr.id = wo.service_request_id
    where wo.status = 'completed' and coalesce(wo.tenant_confirmed, false) = false
    and wo.tenant_confirmation_sent_at is not null
    and wo.tenant_confirmation_sent_at <= now() - interval '7 days'
  loop
    update work_orders set tenant_confirmed = true, tenant_confirmation_note = 'Fermé automatiquement après 7 jours sans réponse du locataire.' where id = r.id;
    update service_requests set status = 'closed' where id = r.service_request_id;
    insert into audit_log (actor_type, action, entity_type, entity_id, details)
    values ('system', 'repair_case.auto_closed_no_tenant_response', 'work_orders', r.id, jsonb_build_object('description', r.description));
  end loop;

  for r in
    select wo.id, wo.description
    from work_orders wo
    where wo.status = 'completed' and coalesce(wo.tenant_confirmed, false) = false
    and wo.tenant_confirmation_sent_at is not null
    and wo.tenant_confirmation_sent_at <= now() - interval '3 days'
    and coalesce(wo.tenant_reminder_sent, false) = false
  loop
    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-tenant-confirmation',
      body := jsonb_build_object('action', 'send_reminder', 'work_order_id', r.id),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
        'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
      )
    );
    update work_orders set tenant_reminder_sent = true where id = r.id;

    insert into audit_log (actor_type, action, entity_type, entity_id, details)
    select 'system', 'repair_case.stuck_no_tenant_confirmation', 'work_orders', r.id, jsonb_build_object('description', r.description)
    where not exists (
      select 1 from audit_log where entity_type = 'work_orders' and entity_id = r.id
      and action = 'repair_case.stuck_no_tenant_confirmation' and created_at >= now() - interval '2 days'
    );
  end loop;
end;
$$;


ALTER FUNCTION "public"."flag_stuck_repair_cases"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."flag_worker_credential_issues"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  r record;
  v_reasons text[];
begin
  for r in select * from worker_verification_status
  loop
    v_reasons := array[]::text[];
    if r.missing_rbq_license then v_reasons := array_append(v_reasons, 'licence RBQ manquante'); end if;
    if r.rbq_expired then v_reasons := array_append(v_reasons, 'licence RBQ expirée'); end if;
    if r.missing_insurance_doc then v_reasons := array_append(v_reasons, 'preuve d''assurance manquante'); end if;
    if r.insurance_expired then v_reasons := array_append(v_reasons, 'assurance expirée'); end if;

    if array_length(v_reasons, 1) > 0
      and not exists (
        select 1 from audit_log a
        where a.action = 'worker_verification.non_compliant' and a.entity_id = r.id
          and a.created_at >= now() - interval '7 days'
      )
    then
      insert into audit_log (actor_type, action, entity_type, entity_id, details)
      values ('system', 'worker_verification.non_compliant', 'workers', r.id, jsonb_build_object('name', r.name, 'reasons', v_reasons));
    end if;

    if (r.rbq_expiring_soon or r.insurance_expiring_soon)
      and not exists (
        select 1 from audit_log a
        where a.action = 'worker_verification.expiring_soon' and a.entity_id = r.id
          and a.created_at >= now() - interval '10 days'
      )
    then
      insert into audit_log (actor_type, action, entity_type, entity_id, details)
      values ('system', 'worker_verification.expiring_soon', 'workers', r.id, jsonb_build_object(
        'name', r.name,
        'rbq_license_expiry', r.rbq_license_expiry,
        'insurance_expiry', r.insurance_expiry
      ));
    end if;
  end loop;
end;
$$;


ALTER FUNCTION "public"."flag_worker_credential_issues"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_monthly_payments"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  l record;
  target_month date;
  months date[] := array[date_trunc('month', current_date)::date, date_trunc('month', current_date + interval '1 month')::date];
begin
  foreach target_month in array months loop
    for l in
      select id, monthly_rent from leases
      where status in ('active','renewed')
        and start_date <= target_month
        and (end_date is null or end_date >= target_month)
    loop
      if not exists (select 1 from payments where lease_id = l.id and due_date = target_month) then
        insert into payments (lease_id, amount, due_date, status)
        values (l.id, l.monthly_rent, target_month, 'pending');
      end if;
    end loop;
  end loop;
end;
$$;


ALTER FUNCTION "public"."generate_monthly_payments"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gl_trial_balance"("p_owner_id" "uuid") RETURNS TABLE("code" "text", "name" "text", "account_type" "text", "total_debit" numeric, "total_credit" numeric, "balance" numeric)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select a.code, a.name, a.account_type,
    coalesce(sum(l.debit), 0) as total_debit,
    coalesce(sum(l.credit), 0) as total_credit,
    coalesce(sum(l.debit) - sum(l.credit), 0) as balance
  from gl_accounts a
  left join gl_journal_lines l on l.account_id = a.id
  where a.owner_id = p_owner_id
  group by a.id, a.code, a.name, a.account_type
  order by a.code;
$$;


ALTER FUNCTION "public"."gl_trial_balance"("p_owner_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_approval_decision"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
        'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
      )
    );

    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-approval-decision',
      body := jsonb_build_object('approval_id', new.id, 'decision', 'approved'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
        'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
      )
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
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
        'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
      )
    );
    insert into audit_log (actor_type, actor_id, action, entity_type, entity_id, details)
    values ('owner', auth.uid(), 'approval.rejected', 'approvals', new.id,
      jsonb_build_object('work_order_id', new.work_order_id, 'requested_amount', new.requested_amount, 'reassessment_due', current_date + v_days));
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_approval_decision"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'owner');
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."next_invoice_number"("p_year" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_next int;
begin
  insert into invoice_number_counters (year, last_number) values (p_year, 1)
  on conflict (year) do update set last_number = invoice_number_counters.last_number + 1
  returning last_number into v_next;
  return 'PORT-' || p_year || '-' || lpad(v_next::text, 4, '0');
end;
$$;


ALTER FUNCTION "public"."next_invoice_number"("p_year" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_listing_needed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
        'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
      )
    );
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_listing_needed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_inquiry"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  perform net.http_post(
    url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-inquiry',
    body := jsonb_build_object('type', 'INSERT', 'table', 'inquiries', 'record', to_jsonb(NEW)),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
      'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
    )
  );
  return NEW;
end;
$$;


ALTER FUNCTION "public"."notify_new_inquiry"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_mandat_inquiry"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.type = 'mandat' then
    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-mandat-inquiry',
      body := jsonb_build_object('inquiry_id', new.id),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
        'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
      )
    );
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_new_mandat_inquiry"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_service_request"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  perform net.http_post(
    url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-service-request',
    body := jsonb_build_object('type', 'INSERT', 'table', 'service_requests', 'record', to_jsonb(NEW)),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
      'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
    )
  );
  return NEW;
end;
$$;


ALTER FUNCTION "public"."notify_new_service_request"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_worker_new_job"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_cap numeric;
  v_needs_approval boolean := false;
begin
  if new.worker_id is not null
     and (TG_OP = 'INSERT' or old.worker_id is distinct from new.worker_id)
     and coalesce(new.worker_notified, false) = false then

    select o.spending_cap into v_cap
    from owners o
    join buildings b on b.owner_id = o.id
    join units u on u.building_id = b.id
    where u.id = new.unit_id;

    if new.estimated_cost is not null and v_cap is not null and new.estimated_cost > v_cap then
      v_needs_approval := true;
    end if;

    if not v_needs_approval then
      new.worker_notified := true;
      new.worker_notified_at := now();
      new.worker_response := 'pending';
      new.worker_response_token := gen_random_uuid();
      new.worker_response_note := null;
      new.response_reminder_sent := false;
      new.response_escalated := false;

      perform net.http_post(
        url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-worker-job-assigned',
        body := jsonb_build_object('work_order_id', new.id, 'response_token', new.worker_response_token, 'notification_type', 'assigned'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
          'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
        )
      );
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_worker_new_job"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."owned_building_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
  select id from buildings where owner_id = auth_owner_id()
$$;


ALTER FUNCTION "public"."owned_building_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."owned_lease_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$ select id from leases where unit_id in (select owned_unit_ids()) $$;


ALTER FUNCTION "public"."owned_lease_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."owned_unit_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$ select id from units where building_id in (select owned_building_ids()) $$;


ALTER FUNCTION "public"."owned_unit_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."post_expense_to_gl"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_owner_id uuid;
  v_bank_account_id uuid;
  v_expense_account_id uuid;
  v_entry_id uuid;
  v_code text;
begin
  select owner_id into v_owner_id from buildings where id = NEW.building_id;
  if v_owner_id is null then return NEW; end if;

  v_code := case NEW.category
    when 'plomberie' then '5000' when 'electricite' then '5010' when 'cvac' then '5020'
    when 'serrurerie' then '5030' when 'structure' then '5040' when 'peinture' then '5050'
    when 'menage' then '5060' when 'assurance' then '5070' when 'taxes_municipales' then '5080'
    when 'utilities' then '5090' when 'administratif' then '5100' else '5110'
  end;

  select id into v_expense_account_id from gl_accounts where owner_id = v_owner_id and code = v_code;
  select id into v_bank_account_id from gl_accounts where owner_id = v_owner_id and code = '1000';
  if v_expense_account_id is null or v_bank_account_id is null or NEW.amount is null or NEW.amount <= 0 then return NEW; end if;

  insert into gl_journal_entries (owner_id, entry_date, description, source_type, source_id, created_by)
  values (v_owner_id, coalesce(NEW.expense_date, current_date), coalesce(NEW.description, 'Dépense'), 'expense', NEW.id, 'system')
  returning id into v_entry_id;

  insert into gl_journal_lines (journal_entry_id, account_id, debit, credit) values
    (v_entry_id, v_expense_account_id, NEW.amount, 0),
    (v_entry_id, v_bank_account_id, 0, NEW.amount);

  return NEW;
end;
$$;


ALTER FUNCTION "public"."post_expense_to_gl"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."post_invoice_to_gl"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_expense_account_id uuid;
  v_payable_account_id uuid;
  v_entry_id uuid;
begin
  select id into v_expense_account_id from gl_accounts where owner_id = NEW.owner_id and code = '5200';
  select id into v_payable_account_id from gl_accounts where owner_id = NEW.owner_id and code = '2000';
  if v_expense_account_id is null or v_payable_account_id is null or NEW.total_amount is null or NEW.total_amount <= 0 then return NEW; end if;

  insert into gl_journal_entries (owner_id, entry_date, description, source_type, source_id, created_by)
  values (NEW.owner_id, current_date, 'Facture Portail ' || NEW.invoice_number, 'invoice', NEW.id, 'system')
  returning id into v_entry_id;

  insert into gl_journal_lines (journal_entry_id, account_id, debit, credit) values
    (v_entry_id, v_expense_account_id, NEW.total_amount, 0),
    (v_entry_id, v_payable_account_id, 0, NEW.total_amount);

  return NEW;
end;
$$;


ALTER FUNCTION "public"."post_invoice_to_gl"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."post_payment_to_gl"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_owner_id uuid;
  v_bank_account_id uuid;
  v_revenue_account_id uuid;
  v_entry_id uuid;
  v_amount numeric(10,2);
begin
  if NEW.status is distinct from 'paid' then
    return NEW;
  end if;
  if TG_OP = 'UPDATE' and OLD.status = 'paid' then
    return NEW;
  end if;

  select b.owner_id into v_owner_id
  from leases l join units u on u.id = l.unit_id join buildings b on b.id = u.building_id
  where l.id = NEW.lease_id;
  if v_owner_id is null then return NEW; end if;

  v_amount := coalesce(NEW.amount_received, NEW.amount);
  if v_amount is null or v_amount <= 0 then return NEW; end if;

  select id into v_bank_account_id from gl_accounts where owner_id = v_owner_id and code = '1000';
  select id into v_revenue_account_id from gl_accounts where owner_id = v_owner_id and code = '4000';
  if v_bank_account_id is null or v_revenue_account_id is null then return NEW; end if;

  insert into gl_journal_entries (owner_id, entry_date, description, source_type, source_id, created_by)
  values (v_owner_id, coalesce(NEW.paid_date, current_date), 'Loyer perçu', 'payment', NEW.id, 'system')
  returning id into v_entry_id;

  insert into gl_journal_lines (journal_entry_id, account_id, debit, credit) values
    (v_entry_id, v_bank_account_id, v_amount, 0),
    (v_entry_id, v_revenue_account_id, 0, v_amount);

  return NEW;
end;
$$;


ALTER FUNCTION "public"."post_payment_to_gl"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_audit_log_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  raise exception 'audit_log est immuable : % non permis sur une ligne existante', TG_OP;
end;
$$;


ALTER FUNCTION "public"."prevent_audit_log_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_gl_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  raise exception 'Le grand livre est immuable : % non permis sur une écriture existante — corrige par une écriture d''ajustement', TG_OP;
end;
$$;


ALTER FUNCTION "public"."prevent_gl_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_worker_response_timeouts"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  wo record;
  v_next_worker_id uuid;
  v_admin_count int;
begin
  for wo in
    select id from work_orders
    where worker_response = 'pending'
    and worker_notified = true
    and coalesce(response_reminder_sent, false) = false
    and worker_notified_at <= now() - interval '30 minutes'
  loop
    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-worker-job-assigned',
      body := jsonb_build_object('work_order_id', wo.id, 'notification_type', 'reminder'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
        'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
      )
    );
    update work_orders set response_reminder_sent = true where id = wo.id;
  end loop;

  for wo in
    select w.id, w.worker_id, w.declined_worker_ids, wk.specialty
    from work_orders w
    join workers wk on wk.id = w.worker_id
    where w.worker_response = 'pending'
    and w.worker_notified = true
    and coalesce(w.response_escalated, false) = false
    and w.worker_notified_at <= now() - interval '2 hours'
  loop
    select id into v_next_worker_id
    from worker_verification_status
    where specialty is not distinct from wo.specialty
    and id <> wo.worker_id
    and not (id = any(coalesce(wo.declined_worker_ids, '{}')))
    and coalesce(active, true)
    and not missing_rbq_license
    and not rbq_expired
    and not missing_insurance_doc
    and not insurance_expired
    order by random()
    limit 1;

    if v_next_worker_id is not null then
      insert into automated_decisions (decision_type, subject_type, subject_id, entity_type, entity_id, summary, factors)
      values ('worker_reassigned_timeout', 'worker', wo.worker_id, 'work_orders', wo.id,
        'Ce mandat vous a été retiré automatiquement et réassigné à un autre travailleur, faute de réponse dans le délai prévu.',
        jsonb_build_object('delai_heures', 2, 'nouveau_travailleur_id', v_next_worker_id));

      update work_orders set
        declined_worker_ids = array_append(coalesce(declined_worker_ids, '{}'), worker_id),
        worker_id = v_next_worker_id,
        worker_notified = false
      where id = wo.id;
    else
      update work_orders set response_escalated = true where id = wo.id;

      select count(*) into v_admin_count from users where is_admin = true and email is not null;
      if v_admin_count > 0 then
        perform net.http_post(
          url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-worker-job-assigned',
          body := jsonb_build_object('work_order_id', wo.id, 'notification_type', 'all_declined'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
            'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
          )
        );
      end if;
    end if;
  end loop;
end;
$$;


ALTER FUNCTION "public"."process_worker_response_timeouts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_old_health_log"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  delete from system_health_log where checked_at < now() - interval '30 days';
$$;


ALTER FUNCTION "public"."purge_old_health_log"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restrict_automated_decisions_subject_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if auth.role() = 'authenticated' and not auth_is_admin() then
    if (to_jsonb(new) - array['review_requested_at', 'review_note'])
       is distinct from (to_jsonb(old) - array['review_requested_at', 'review_note']) then
      raise exception 'Modification non autorisée sur cette décision';
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."restrict_automated_decisions_subject_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restrict_documents_owner_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if auth.role() = 'authenticated' and not auth_is_admin() then
    new.ai_processed := false;
    new.ai_summary := null;
    new.ai_parties := null;
    new.ai_key_amount := null;
    new.ai_expiry_date := null;
    new.ai_extracted := null;
    new.ai_confidence := null;
    new.ai_source_page := null;
    new.ai_source_excerpt := null;
    new.ai_model_version := null;
    new.ai_extracted_at := null;
    new.ai_readable := null;
    new.ai_signature_present := null;
    new.ai_doc_type_detected := null;
    new.ai_needs_human_validation := false;
    new.file_hash := null;
    new.is_duplicate_of := null;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."restrict_documents_owner_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_default_gl_accounts"("p_owner_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into gl_accounts (owner_id, code, name, account_type) values
    (p_owner_id, '1000', 'Banque', 'actif'),
    (p_owner_id, '2000', 'Comptes à payer', 'passif'),
    (p_owner_id, '4000', 'Revenus de loyers', 'revenu'),
    (p_owner_id, '5000', 'Dépenses — Plomberie', 'depense'),
    (p_owner_id, '5010', 'Dépenses — Électricité', 'depense'),
    (p_owner_id, '5020', 'Dépenses — CVAC', 'depense'),
    (p_owner_id, '5030', 'Dépenses — Serrurerie', 'depense'),
    (p_owner_id, '5040', 'Dépenses — Structure', 'depense'),
    (p_owner_id, '5050', 'Dépenses — Peinture', 'depense'),
    (p_owner_id, '5060', 'Dépenses — Ménage', 'depense'),
    (p_owner_id, '5070', 'Dépenses — Assurance', 'depense'),
    (p_owner_id, '5080', 'Dépenses — Taxes municipales', 'depense'),
    (p_owner_id, '5090', 'Dépenses — Utilities', 'depense'),
    (p_owner_id, '5100', 'Dépenses — Administratif', 'depense'),
    (p_owner_id, '5110', 'Dépenses — Autre', 'depense'),
    (p_owner_id, '5200', 'Frais de gestion Portail', 'depense')
  on conflict (owner_id, code) do nothing;
end;
$$;


ALTER FUNCTION "public"."seed_default_gl_accounts"("p_owner_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_default_gl_accounts_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform seed_default_gl_accounts(NEW.id);
  return NEW;
end;
$$;


ALTER FUNCTION "public"."seed_default_gl_accounts_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_visit_reminders"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  r record;
begin
  for r in
    select id from visits
    where status = 'confirmed'
      and reminder_sent_at is null
      and proposed_at between now() + interval '23 hours' and now() + interval '25 hours'
  loop
    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-visit-response',
      body := jsonb_build_object('action', 'send_reminder', 'visit_id', r.id),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
        'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
      )
    );
  end loop;
end;
$$;


ALTER FUNCTION "public"."send_visit_reminders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_prospect_stage_changed_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if tg_op = 'INSERT' or new.stage is distinct from old.stage then
    new.stage_changed_at := now();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_prospect_stage_changed_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tenant_building_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$ select building_id from units where id in (select tenant_unit_ids()) $$;


ALTER FUNCTION "public"."tenant_building_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tenant_unit_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$ select unit_id from leases where tenant_id = auth_tenant_id() $$;


ALTER FUNCTION "public"."tenant_unit_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_analyze_owner_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.sender = 'owner' then
    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/analyze-satisfaction-signal',
      body := jsonb_build_object(
        'source', 'owner_message', 'subject_type', 'owner', 'subject_id', new.owner_id,
        'related_entity_type', 'messages', 'related_entity_id', new.id, 'content', new.body
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
        'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
      )
    );
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."trigger_analyze_owner_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_dispatch_advance"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  perform net.http_post(
    url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/dispatch-work-order',
    body := jsonb_build_object('action', 'advance'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
      'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
    )
  );
end;
$$;


ALTER FUNCTION "public"."trigger_dispatch_advance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_flinks_daily_sync"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_sync_key text;
begin
  select decrypted_secret into v_sync_key from vault.decrypted_secrets where name = 'flinks_sync_secret';
  perform net.http_post(
    url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/flinks-api',
    body := jsonb_build_object('action', 'sync_all'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
      'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
      'x-flinks-sync-key', coalesce(v_sync_key, '')
    )
  );
end;
$$;


ALTER FUNCTION "public"."trigger_flinks_daily_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_health_check_alert"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_health jsonb;
  v_last_alert timestamptz;
  v_health_key text;
  v_prev_request_id bigint;
  v_prev_status int;
  v_request_id bigint;
begin
  v_health := check_system_health();

  insert into system_health_log (healthy, issue_count, issues)
  values (
    (v_health->>'healthy')::boolean,
    jsonb_array_length(v_health->'issues'),
    v_health->'issues'
  );

  -- Vérifie d'abord le sort de la tentative précédente : net.http_post
  -- étant asynchrone, son statut n'était pas connu au moment de l'envoi.
  select last_request_id into v_prev_request_id from system_health_alert_state where id = true;
  if v_prev_request_id is not null then
    select status_code into v_prev_status from net._http_response where id = v_prev_request_id;
    if v_prev_status is not null and v_prev_status >= 400 then
      insert into audit_log (actor_type, action, entity_type, entity_id, details)
      values ('system', 'health_alert.delivery_failed', 'send-health-alert', null,
              jsonb_build_object('request_id', v_prev_request_id, 'status_code', v_prev_status));
      -- Échec : on retire le refroidissement pour réessayer au prochain
      -- passage plutôt que d'attendre 2h en silence.
      update system_health_alert_state
         set last_alert_sent_at = null, last_request_id = null
       where id = true;
    elsif v_prev_status is not null then
      -- Succès confirmé : c'est MAINTENANT qu'on pose le refroidissement.
      update system_health_alert_state
         set last_alert_sent_at = coalesce(last_attempt_at, now()), last_request_id = null
       where id = true;
    end if;
  end if;

  if (v_health->>'healthy')::boolean then
    return;
  end if;

  select last_alert_sent_at into v_last_alert from system_health_alert_state where id = true;
  if v_last_alert is not null and v_last_alert > now() - interval '2 hours' then
    return;
  end if;

  select decrypted_secret into v_health_key from vault.decrypted_secrets where name = 'health_alert_secret';

  select net.http_post(
    url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/send-health-alert',
    body := jsonb_build_object('issues', v_health->'issues'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
      'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
      'x-health-alert-key', coalesce(v_health_key, '')
    )
  ) into v_request_id;

  -- last_alert_sent_at reste tel quel : il ne sera posé qu'après
  -- confirmation, au passage suivant.
  update system_health_alert_state
     set last_request_id = v_request_id, last_attempt_at = now()
   where id = true;
end;
$$;


ALTER FUNCTION "public"."trigger_health_check_alert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_monthly_owner_reports"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
        'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
      )
    );
  end loop;
end;
$$;


ALTER FUNCTION "public"."trigger_monthly_owner_reports"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_payment_reminders"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
        'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
      )
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
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
        'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
      )
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
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR',
        'apikey', 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR'
      )
    );
    update payments set escalated_to_human = true where id = p.id;
  end loop;
end;
$$;


ALTER FUNCTION "public"."trigger_payment_reminders"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_run_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "function_name" "text" NOT NULL,
    "trigger_source" "text",
    "entity_type" "text",
    "entity_id" "uuid",
    "prompt_version" "text",
    "model_version" "text",
    "input_summary" "text",
    "output_summary" "text",
    "confidence" numeric(5,2),
    "needs_escalation" boolean DEFAULT false,
    "duration_ms" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "automatic_action_taken" "text",
    "human_correction" "text",
    "error" "text",
    "attempt_number" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_run_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "work_order_id" "uuid",
    "owner_id" "uuid",
    "requested_amount" numeric(10,2) NOT NULL,
    "spending_cap_at_request" numeric(10,2),
    "status" "text" DEFAULT 'pending'::"text",
    "decided_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "rejection_note" "text",
    CONSTRAINT "approvals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_type" "text" NOT NULL,
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "audit_log_actor_type_check" CHECK (("actor_type" = ANY (ARRAY['admin'::"text", 'owner'::"text", 'tenant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automated_decisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "decision_type" "text" NOT NULL,
    "subject_type" "text" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "summary" "text" NOT NULL,
    "factors" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "decided_at" timestamp with time zone DEFAULT "now"(),
    "review_requested_at" timestamp with time zone,
    "review_note" "text",
    "review_outcome" "text",
    "review_response" "text",
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    CONSTRAINT "automated_decisions_review_outcome_check" CHECK ((("review_outcome" IS NULL) OR ("review_outcome" = ANY (ARRAY['maintenue'::"text", 'annulee'::"text"])))),
    CONSTRAINT "automated_decisions_subject_type_check" CHECK (("subject_type" = ANY (ARRAY['owner'::"text", 'tenant'::"text", 'worker'::"text"])))
);


ALTER TABLE "public"."automated_decisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "flinks_login_id" "uuid" NOT NULL,
    "institution_name" "text",
    "status" "text" DEFAULT 'active'::"text",
    "last_synced_at" timestamp with time zone,
    "last_sync_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bank_connections_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'error'::"text", 'disconnected'::"text"])))
);


ALTER TABLE "public"."bank_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "transaction_date" "date" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "match_status" "text" DEFAULT 'unmatched'::"text",
    "matched_payment_id" "uuid",
    "ai_suggested_tenant_id" "uuid",
    "ai_suggestion_note" "text",
    "ai_confidence" numeric(5,2),
    "reconciled_by" "uuid",
    "reconciled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "external_id" "text",
    "match_confidence" numeric(5,2),
    CONSTRAINT "bank_transactions_match_status_check" CHECK (("match_status" = ANY (ARRAY['matched'::"text", 'partial'::"text", 'overpaid'::"text", 'duplicate'::"text", 'unmatched'::"text", 'ignored'::"text", 'suggested'::"text", 'reversed'::"text"])))
);


ALTER TABLE "public"."bank_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "excerpt" "text",
    "body" "text" NOT NULL,
    "cover_photo_path" "text",
    "author_name" "text" DEFAULT 'L''équipe Portail'::"text",
    "status" "text" DEFAULT 'draft'::"text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "blog_posts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"])))
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."buildings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "address" "text" NOT NULL,
    "unit_count" integer DEFAULT 1 NOT NULL,
    "year_built" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "zone" "text"
);


ALTER TABLE "public"."buildings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cold_callers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "full_name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cold_callers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_settings" (
    "id" boolean DEFAULT true NOT NULL,
    "legal_name" "text" DEFAULT 'Portail'::"text",
    "address" "text",
    "gst_number" "text",
    "qst_number" "text",
    "gst_rate" numeric(5,3) DEFAULT 5.000,
    "qst_rate" numeric(5,3) DEFAULT 9.975,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "company_settings_id_check" CHECK ("id")
);


ALTER TABLE "public"."company_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dissatisfaction_signals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source" "text" NOT NULL,
    "subject_type" "text" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "related_entity_type" "text",
    "related_entity_id" "uuid",
    "content_excerpt" "text",
    "ai_sentiment" "text",
    "ai_reasoning" "text",
    "ai_confidence" numeric(5,2),
    "escalated" boolean DEFAULT false,
    "escalated_at" timestamp with time zone,
    "resolved" boolean DEFAULT false,
    "resolved_at" timestamp with time zone,
    "resolution_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "dissatisfaction_signals_ai_sentiment_check" CHECK (("ai_sentiment" = ANY (ARRAY['positif'::"text", 'neutre'::"text", 'negatif'::"text", 'tres_negatif'::"text"]))),
    CONSTRAINT "dissatisfaction_signals_subject_type_check" CHECK (("subject_type" = ANY (ARRAY['owner'::"text", 'tenant'::"text"])))
);


ALTER TABLE "public"."dissatisfaction_signals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "building_id" "uuid",
    "lease_id" "uuid",
    "title" "text" NOT NULL,
    "file_url" "text",
    "doc_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "ai_confidence" numeric(5,2),
    "ai_source_page" integer,
    "ai_source_excerpt" "text",
    "ai_model_version" "text",
    "ai_extracted_at" timestamp with time zone,
    "ai_readable" boolean,
    "ai_signature_present" boolean,
    "ai_doc_type_detected" "text",
    "ai_needs_human_validation" boolean DEFAULT false,
    "file_hash" "text",
    "is_duplicate_of" "uuid",
    "worker_id" "uuid",
    CONSTRAINT "documents_doc_type_check" CHECK ((("doc_type" IS NULL) OR ("doc_type" = ANY (ARRAY['bail'::"text", 'mandat'::"text", 'reglement'::"text", 'rapport'::"text", 'facture'::"text", 'assurance_travailleur'::"text", 'reference_travailleur'::"text"]))))
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "work_order_id" "uuid",
    "building_id" "uuid",
    "unit_id" "uuid",
    "description" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "expense_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "receipt_document_id" "uuid",
    "vendor_name" "text",
    "category" "text",
    "gst_amount" numeric(10,2),
    "qst_amount" numeric(10,2),
    "ai_confidence" numeric(5,2),
    "ai_extracted" "jsonb"
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."external_disbursements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "building_id" "uuid",
    "lease_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "receipt_document_id" "uuid",
    "status" "text" DEFAULT 'a_facturer'::"text",
    "expense_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "external_disbursements_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "external_disbursements_category_check" CHECK (("category" = ANY (ARRAY['depot_tal'::"text", 'huissier'::"text", 'avocat'::"text", 'autre'::"text"]))),
    CONSTRAINT "external_disbursements_status_check" CHECK (("status" = ANY (ARRAY['a_facturer'::"text", 'facture'::"text"])))
);


ALTER TABLE "public"."external_disbursements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_anomalies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "severity" "text" DEFAULT 'moyen'::"text" NOT NULL,
    "description" "text" NOT NULL,
    "owner_id" "uuid",
    "related_expense_id" "uuid",
    "related_payment_id" "uuid",
    "related_work_order_id" "uuid",
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "financial_anomalies_severity_check" CHECK (("severity" = ANY (ARRAY['critique'::"text", 'eleve'::"text", 'moyen'::"text"]))),
    CONSTRAINT "financial_anomalies_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'resolved'::"text", 'dismissed'::"text"]))),
    CONSTRAINT "financial_anomalies_type_check" CHECK (("type" = ANY (ARRAY['facture_dupliquee'::"text", 'depassement_cout'::"text", 'loyer_montant_incorrect'::"text", 'recu_manquant'::"text"])))
);


ALTER TABLE "public"."financial_anomalies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gl_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "account_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "gl_accounts_account_type_check" CHECK (("account_type" = ANY (ARRAY['actif'::"text", 'passif'::"text", 'capitaux_propres'::"text", 'revenu'::"text", 'depense'::"text"])))
);


ALTER TABLE "public"."gl_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gl_journal_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "entry_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "description" "text" NOT NULL,
    "source_type" "text",
    "source_id" "uuid",
    "created_by" "text" DEFAULT 'system'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "gl_journal_entries_source_type_check" CHECK (("source_type" = ANY (ARRAY['payment'::"text", 'expense'::"text", 'invoice'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."gl_journal_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gl_journal_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "journal_entry_id" "uuid",
    "account_id" "uuid",
    "debit" numeric(10,2) DEFAULT 0 NOT NULL,
    "credit" numeric(10,2) DEFAULT 0 NOT NULL,
    CONSTRAINT "gl_journal_lines_check" CHECK ((("debit" >= (0)::numeric) AND ("credit" >= (0)::numeric))),
    CONSTRAINT "gl_journal_lines_check1" CHECK ((NOT (("debit" > (0)::numeric) AND ("credit" > (0)::numeric))))
);


ALTER TABLE "public"."gl_journal_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inquiries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "unit_id" "uuid",
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "message" "text",
    "ai_category" "text",
    "ai_summary" "text",
    "ai_reply_sent" boolean DEFAULT false,
    "status" "text" DEFAULT 'new'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "sector" "text",
    "num_doors" integer,
    "avg_rent" numeric(10,2),
    "ownership" "text",
    "current_management" "text",
    "services_needed" "text",
    "main_problem" "text",
    "desired_start_date" "date",
    "best_call_time" "text",
    "anonymized_at" timestamp with time zone,
    "consented_at" timestamp with time zone,
    "consent_purpose" "text",
    CONSTRAINT "inquiries_current_management_check" CHECK (("current_management" = ANY (ARRAY['autogere'::"text", 'sous_gestion'::"text"]))),
    CONSTRAINT "inquiries_ownership_check" CHECK (("ownership" = ANY (ARRAY['personnel'::"text", 'societe'::"text"]))),
    CONSTRAINT "inquiries_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'contacted'::"text", 'closed'::"text"]))),
    CONSTRAINT "inquiries_type_check" CHECK (("type" = ANY (ARRAY['visite'::"text", 'mandat'::"text"])))
);


ALTER TABLE "public"."inquiries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_number_counters" (
    "year" "text" NOT NULL,
    "last_number" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."invoice_number_counters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "invoice_number" "text" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "management_fee_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "coordination_fees_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "subtotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "gst_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "qst_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'issued'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "collection_status" "text" DEFAULT 'pending'::"text",
    "collected_at" timestamp with time zone,
    "collection_error" "text",
    CONSTRAINT "invoices_collection_status_check" CHECK (("collection_status" = ANY (ARRAY['pending'::"text", 'scheduled'::"text", 'collected'::"text", 'failed'::"text"]))),
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['issued'::"text", 'paid'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "work_order_id" "uuid",
    "worker_id" "uuid",
    "tier" integer DEFAULT 1 NOT NULL,
    "score" numeric(6,2),
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "sent_at" timestamp with time zone,
    "responded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "job_offers_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'sent'::"text", 'accepted'::"text", 'declined'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."job_offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "unit_id" "uuid",
    "tenant_id" "uuid",
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "monthly_rent" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "renewal_notice_sent_at" timestamp with time zone,
    "renewal_notice_type" "text",
    "renewal_notice_amount" numeric(10,2),
    "renewal_response" "text" DEFAULT 'pending'::"text",
    "renewal_response_note" "text",
    "renewal_signed" boolean DEFAULT false,
    "renewal_deadline_missed" boolean DEFAULT false,
    "relocation_prep_needed" boolean DEFAULT false,
    "renewal_signature_token" "uuid" DEFAULT "gen_random_uuid"(),
    "renewal_signed_at" timestamp with time zone,
    "renewal_signature_ip" "text",
    CONSTRAINT "leases_renewal_notice_type_check" CHECK (("renewal_notice_type" = ANY (ARRAY['renouvellement_meme_conditions'::"text", 'augmentation'::"text", 'non_renouvellement'::"text"]))),
    CONSTRAINT "leases_renewal_response_check" CHECK (("renewal_response" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'refused'::"text", 'no_response'::"text"]))),
    CONSTRAINT "leases_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'renewed'::"text", 'ended'::"text"])))
);


ALTER TABLE "public"."leases" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."lease_renewal_tracking" WITH ("security_invoker"='true') AS
 SELECT "id" AS "lease_id",
    "unit_id",
    "tenant_id",
    "start_date",
    "end_date",
    "monthly_rent",
    "renewal_notice_sent_at",
    "renewal_notice_type",
    "renewal_response",
    "renewal_signed",
    "renewal_deadline_missed",
    "relocation_prep_needed",
        CASE
            WHEN (("end_date" - "start_date") >= 365) THEN 'long'::"text"
            ELSE 'court'::"text"
        END AS "term_type",
    (
        CASE
            WHEN (("end_date" - "start_date") >= 365) THEN ("end_date" - '6 mons'::interval)
            ELSE ("end_date" - '2 mons'::interval)
        END)::"date" AS "notice_window_start",
    (
        CASE
            WHEN (("end_date" - "start_date") >= 365) THEN ("end_date" - '3 mons'::interval)
            ELSE ("end_date" - '1 mon'::interval)
        END)::"date" AS "notice_window_end",
    ("end_date" - CURRENT_DATE) AS "days_until_end"
   FROM "public"."leases" "l"
  WHERE (("status" = 'active'::"text") AND ("end_date" IS NOT NULL));


ALTER VIEW "public"."lease_renewal_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lease_signatures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lease_id" "uuid",
    "notice_type" "text",
    "signature_image" "text" NOT NULL,
    "signer_name" "text" NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "signed_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lease_signatures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "sender" "text" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "messages_sender_check" CHECK (("sender" = ANY (ARRAY['owner'::"text", 'team'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "full_name" "text" NOT NULL,
    "phone" "text",
    "company_name" "text",
    "spending_cap" numeric(10,2) DEFAULT 300,
    "management_rate" numeric(4,2) DEFAULT 6.00,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "onboarding_completed_at" timestamp with time zone,
    "onboarding_reminder_sent_at" timestamp with time zone,
    "onboarding_reminder_count" integer DEFAULT 0,
    "work_coordination_rate" numeric(4,2) DEFAULT 10.00
);


ALTER TABLE "public"."owners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "full_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "anonymized_at" timestamp with time zone
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."units" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "building_id" "uuid",
    "unit_number" "text" NOT NULL,
    "unit_type" "text",
    "rent" numeric(10,2),
    "status" "text" DEFAULT 'occupied'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "status_changed_at" timestamp with time zone DEFAULT "now"(),
    "listing_description" "text",
    "suggested_rent" numeric(10,2),
    "amenities" "text",
    "listing_published_at" timestamp with time zone,
    "listing_low_interest" boolean DEFAULT false,
    "listing_quality_score" integer,
    "listing_quality_notes" "text",
    "listing_description_short" "text",
    "marketplace_title" "text",
    "marketplace_description" "text",
    "marketplace_generated_at" timestamp with time zone,
    "marketplace_posted_at" timestamp with time zone,
    CONSTRAINT "units_status_check" CHECK (("status" = ANY (ARRAY['occupied'::"text", 'available'::"text", 'soon_available'::"text"])))
);


ALTER TABLE "public"."units" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."owner_onboarding_checklist" WITH ("security_invoker"='true') AS
 SELECT "id" AS "owner_id",
    "full_name",
    "created_at" AS "owner_created_at",
    "onboarding_completed_at",
    "onboarding_reminder_sent_at",
    "onboarding_reminder_count",
    (("phone" IS NULL) OR ("phone" = ''::"text")) AS "missing_phone",
    (NOT (EXISTS ( SELECT 1
           FROM "public"."buildings" "b"
          WHERE ("b"."owner_id" = "o"."id")))) AS "missing_buildings",
    ((EXISTS ( SELECT 1
           FROM "public"."buildings" "b"
          WHERE ("b"."owner_id" = "o"."id"))) AND (NOT (EXISTS ( SELECT 1
           FROM ("public"."units" "u"
             JOIN "public"."buildings" "b" ON (("b"."id" = "u"."building_id")))
          WHERE ("b"."owner_id" = "o"."id"))))) AS "missing_units",
    COALESCE(( SELECT "count"(*) AS "count"
           FROM ("public"."units" "u"
             JOIN "public"."buildings" "b" ON (("b"."id" = "u"."building_id")))
          WHERE (("b"."owner_id" = "o"."id") AND ("u"."rent" IS NULL))), (0)::bigint) AS "units_missing_rent_count",
    COALESCE(( SELECT "count"(*) AS "count"
           FROM ("public"."units" "u"
             JOIN "public"."buildings" "b" ON (("b"."id" = "u"."building_id")))
          WHERE (("b"."owner_id" = "o"."id") AND ("u"."status" = 'occupied'::"text") AND (NOT (EXISTS ( SELECT 1
                   FROM "public"."leases" "l"
                  WHERE (("l"."unit_id" = "u"."id") AND ("l"."status" = 'active'::"text"))))))), (0)::bigint) AS "occupied_units_missing_lease_count",
    COALESCE(( SELECT "count"(*) AS "count"
           FROM ((("public"."leases" "l"
             JOIN "public"."units" "u" ON (("u"."id" = "l"."unit_id")))
             JOIN "public"."buildings" "b" ON (("b"."id" = "u"."building_id")))
             JOIN "public"."tenants" "t" ON (("t"."id" = "l"."tenant_id")))
          WHERE (("b"."owner_id" = "o"."id") AND ("l"."status" = 'active'::"text") AND (("t"."email" IS NULL) OR ("t"."email" = ''::"text")) AND (("t"."phone" IS NULL) OR ("t"."phone" = ''::"text")))), (0)::bigint) AS "active_leases_missing_tenant_contact_count",
    COALESCE(( SELECT "count"(*) AS "count"
           FROM (("public"."leases" "l"
             JOIN "public"."units" "u" ON (("u"."id" = "l"."unit_id")))
             JOIN "public"."buildings" "b" ON (("b"."id" = "u"."building_id")))
          WHERE (("b"."owner_id" = "o"."id") AND ("l"."status" = 'active'::"text") AND (NOT (EXISTS ( SELECT 1
                   FROM "public"."documents" "d"
                  WHERE (("d"."lease_id" = "l"."id") AND ("d"."doc_type" = 'bail'::"text"))))))), (0)::bigint) AS "active_leases_missing_bail_doc_count"
   FROM "public"."owners" "o";


ALTER VIEW "public"."owner_onboarding_checklist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pad_authorizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "consented_at" timestamp with time zone,
    "consent_method" "text",
    "processor" "text",
    "processor_reference" "text",
    "revoked_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pad_authorizations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."pad_authorizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "building_id" "uuid",
    "work_order_id" "uuid",
    "vendor_name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "category" "text",
    "due_date" "date",
    "invoice_document_id" "uuid",
    "status" "text" DEFAULT 'pending_approval'::"text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_note" "text",
    "paid_at" timestamp with time zone,
    "expense_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payables_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "payables_status_check" CHECK (("status" = ANY (ARRAY['pending_approval'::"text", 'approved'::"text", 'rejected'::"text", 'paid'::"text"])))
);


ALTER TABLE "public"."payables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" "uuid",
    "reminder_type" "text" NOT NULL,
    "sequence_number" integer,
    "recipient" "text",
    "subject" "text",
    "body" "text",
    "sent_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_reminders_reminder_type_check" CHECK (("reminder_type" = ANY (ARRAY['upcoming'::"text", 'late'::"text", 'escalate'::"text"])))
);


ALTER TABLE "public"."payment_reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lease_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "due_date" "date" NOT NULL,
    "paid_date" "date",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reminder_upcoming_sent" boolean DEFAULT false,
    "reminder_late_sent" boolean DEFAULT false,
    "reminder_paused" boolean DEFAULT false,
    "late_reminder_count" integer DEFAULT 0,
    "last_late_reminder_at" timestamp with time zone,
    "escalated_to_human" boolean DEFAULT false,
    "amount_received" numeric(10,2) DEFAULT 0,
    "collection_status" "text" DEFAULT 'manual'::"text",
    "processor_charge_id" "text",
    "collection_error" "text",
    CONSTRAINT "payments_collection_status_check" CHECK (("collection_status" = ANY (ARRAY['manual'::"text", 'scheduled'::"text", 'collected'::"text", 'failed'::"text"]))),
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['paid'::"text", 'late'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personal_data_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_type" "text" NOT NULL,
    "subject_type" "text" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "requester_name" "text" NOT NULL,
    "requester_email" "text",
    "request_details" "text",
    "status" "text" DEFAULT 'received'::"text" NOT NULL,
    "handled_by" "uuid",
    "handled_at" timestamp with time zone,
    "resolution_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "personal_data_requests_request_type_check" CHECK (("request_type" = ANY (ARRAY['access'::"text", 'rectification'::"text", 'deletion'::"text"]))),
    CONSTRAINT "personal_data_requests_status_check" CHECK (("status" = ANY (ARRAY['received'::"text", 'in_progress'::"text", 'fulfilled'::"text", 'rejected'::"text"]))),
    CONSTRAINT "personal_data_requests_subject_type_check" CHECK (("subject_type" = ANY (ARRAY['tenant'::"text", 'prospect'::"text", 'owner'::"text", 'worker'::"text"])))
);


ALTER TABLE "public"."personal_data_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."privacy_incidents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "description" "text" NOT NULL,
    "discovered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "affected_data_categories" "text",
    "affected_people_estimate" integer,
    "risk_of_serious_harm" boolean DEFAULT false,
    "cai_notified" boolean DEFAULT false,
    "cai_notified_at" timestamp with time zone,
    "affected_people_notified" boolean DEFAULT false,
    "affected_people_notified_at" timestamp with time zone,
    "containment_measures" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "logged_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "privacy_incidents_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'contained'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."privacy_incidents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prospects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "inquiry_id" "uuid",
    "full_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "company_name" "text",
    "num_doors" integer,
    "avg_rent" numeric(10,2),
    "potential_monthly_revenue" numeric(10,2),
    "stage" "text" DEFAULT 'new'::"text",
    "interest_level" "text",
    "assigned_to" "text",
    "next_followup_date" "date",
    "call_history" "jsonb" DEFAULT '[]'::"jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completeness_score" integer,
    "lead_source" "text",
    "acquisition_cost" numeric(10,2),
    "signing_probability" integer,
    "next_action" "text",
    "vendor_commission_estimate" numeric(10,2),
    "loss_reason" "text",
    "stage_changed_at" timestamp with time zone DEFAULT "now"(),
    "anonymized_at" timestamp with time zone,
    "assigned_caller_id" "uuid",
    "converted_owner_id" "uuid",
    CONSTRAINT "prospects_interest_level_check" CHECK (("interest_level" = ANY (ARRAY['chaud'::"text", 'tiede'::"text", 'froid'::"text"]))),
    CONSTRAINT "prospects_stage_check" CHECK (("stage" = ANY (ARRAY['new'::"text", 'contacted'::"text", 'interested'::"text", 'proposal_sent'::"text", 'signed'::"text", 'lost'::"text"])))
);


ALTER TABLE "public"."prospects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."public_faq_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."public_faq_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."public_submission_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."public_submission_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "rent_expected" numeric(10,2),
    "rent_received" numeric(10,2),
    "late_count" integer,
    "occupancy_rate" numeric(5,2),
    "expenses_total" numeric(10,2),
    "work_orders_completed" integer,
    "work_orders_in_progress" integer,
    "management_fee" numeric(10,2),
    "net_due_to_owner" numeric(10,2),
    "renewals_upcoming" integer,
    "summary" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "missing_receipts_count" integer DEFAULT 0,
    "missing_receipts" "jsonb",
    "over_estimate_count" integer DEFAULT 0,
    "over_estimate_work_orders" "jsonb",
    "owner_actions_needed" "jsonb",
    "bank_reconciliation_status" "text" DEFAULT 'non_connecte'::"text",
    "prev_rent_received" numeric(10,2),
    "prev_occupancy_rate" numeric(5,2),
    "prev_expenses_total" numeric(10,2),
    "prev_net_due_to_owner" numeric(10,2),
    "work_order_expenses_total" numeric(10,2) DEFAULT 0,
    "other_expenses_total" numeric(10,2) DEFAULT 0,
    "late_amount" numeric(10,2) DEFAULT 0
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text" NOT NULL,
    "task_type" "text" NOT NULL,
    "label" "text" NOT NULL,
    "pricing_model" "text" DEFAULT 'diagnostic'::"text" NOT NULL,
    "requires_rbq" boolean DEFAULT false,
    "fixed_owner_price" numeric(10,2),
    "fixed_worker_pay" numeric(10,2),
    "estimated_duration_minutes" integer,
    "urgent_eligible" boolean DEFAULT true,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "service_catalog_pricing_model_check" CHECK (("pricing_model" = ANY (ARRAY['forfait'::"text", 'horaire'::"text", 'diagnostic'::"text"])))
);


ALTER TABLE "public"."service_catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "unit_id" "uuid",
    "tenant_id" "uuid",
    "description" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "ai_category" "text",
    "ai_estimated_cost" numeric(10,2),
    "ai_urgency" "text",
    "safety_override" boolean DEFAULT false,
    "safety_flags" "text"[] DEFAULT '{}'::"text"[],
    "ai_subcategory" "text",
    "ai_cost_min" numeric(10,2),
    "ai_cost_max" numeric(10,2),
    "ai_confidence" numeric(5,2),
    "ai_missing_info" "text",
    "ai_photos_needed" boolean,
    "ai_recommended_trade" "text",
    "ai_immediate_action" "text",
    "ai_risk_if_no_action" "text",
    "ai_needs_review" boolean DEFAULT false,
    "pending_reassessment" boolean DEFAULT false,
    "reassessment_due" "date",
    CONSTRAINT "service_requests_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."service_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sms_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_phone" "text",
    "message" "text" NOT NULL,
    "channel_used" "text" NOT NULL,
    "status" "text" NOT NULL,
    "error_detail" "text",
    "entity_type" "text",
    "entity_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sms_log_channel_used_check" CHECK (("channel_used" = ANY (ARRAY['twilio'::"text", 'email_fallback'::"text", 'skipped'::"text"]))),
    CONSTRAINT "sms_log_status_check" CHECK (("status" = ANY (ARRAY['sent'::"text", 'error'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."sms_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_health_alert_state" (
    "id" boolean DEFAULT true NOT NULL,
    "last_alert_sent_at" timestamp with time zone,
    "last_request_id" bigint,
    "last_attempt_at" timestamp with time zone,
    CONSTRAINT "system_health_alert_state_singleton" CHECK ("id")
);


ALTER TABLE "public"."system_health_alert_state" OWNER TO "postgres";


COMMENT ON COLUMN "public"."system_health_alert_state"."last_request_id" IS 'Lot P8 : id net.http_post de la dernière tentative, relu au passage suivant pour savoir si l''alerte est réellement partie.';



CREATE TABLE IF NOT EXISTS "public"."system_health_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checked_at" timestamp with time zone DEFAULT "now"(),
    "healthy" boolean NOT NULL,
    "issue_count" integer DEFAULT 0 NOT NULL,
    "issues" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."system_health_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_pad_authorizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lease_id" "uuid",
    "tenant_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "consented_at" timestamp with time zone,
    "consent_method" "text",
    "processor" "text",
    "processor_customer_id" "text",
    "processor_mandate_id" "text",
    "revoked_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tenant_pad_authorizations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."tenant_pad_authorizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_admin" boolean DEFAULT false,
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'tenant'::"text", 'admin'::"text", 'worker'::"text", 'caller'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "inquiry_id" "uuid",
    "unit_id" "uuid" NOT NULL,
    "prospect_name" "text" NOT NULL,
    "prospect_email" "text" NOT NULL,
    "prospect_phone" "text",
    "proposed_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'proposed'::"text" NOT NULL,
    "confirmation_token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "response_note" "text",
    "reminder_sent_at" timestamp with time zone,
    "outcome_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "visits_status_check" CHECK (("status" = ANY (ARRAY['proposed'::"text", 'confirmed'::"text", 'declined'::"text", 'completed'::"text", 'no_show'::"text", 'cancelled'::"text", 'other_time_proposed'::"text"])))
);


ALTER TABLE "public"."visits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_request_id" "uuid",
    "unit_id" "uuid",
    "worker_id" "uuid",
    "description" "text" NOT NULL,
    "estimated_cost" numeric(10,2),
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "worker_pay" numeric(10,2),
    "worker_notified" boolean DEFAULT false,
    "coordination_fee" numeric(10,2),
    "worker_notified_at" timestamp with time zone,
    "worker_response" "text" DEFAULT 'pending'::"text",
    "worker_response_at" timestamp with time zone,
    "worker_response_token" "uuid" DEFAULT "gen_random_uuid"(),
    "worker_response_note" "text",
    "declined_worker_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "response_reminder_sent" boolean DEFAULT false,
    "response_escalated" boolean DEFAULT false,
    "appointment_at" timestamp with time zone,
    "entry_permission" "text",
    "billing_terms" "text",
    "due_by" "date",
    "tenant_confirmed" boolean,
    "tenant_confirmation_sent_at" timestamp with time zone,
    "tenant_confirmation_token" "uuid" DEFAULT "gen_random_uuid"(),
    "tenant_confirmation_note" "text",
    "tenant_reminder_sent" boolean DEFAULT false,
    "worker_reported_done_at" timestamp with time zone,
    "worker_completion_note" "text",
    "dispatch_mode" "text" DEFAULT 'manual'::"text",
    "dispatch_started_at" timestamp with time zone,
    "dispatch_escalated" boolean DEFAULT false,
    "is_urgent" boolean DEFAULT false,
    "safety_instructions" "text",
    "service_catalog_id" "uuid",
    "coordination_rate" numeric(4,2),
    "coordination_fee_type" "text",
    CONSTRAINT "work_orders_coordination_fee_type_check" CHECK ((("coordination_fee_type" IS NULL) OR ("coordination_fee_type" = ANY (ARRAY['taux'::"text", 'forfait'::"text"])))),
    CONSTRAINT "work_orders_dispatch_mode_check" CHECK (("dispatch_mode" = ANY (ARRAY['manual'::"text", 'auto'::"text"]))),
    CONSTRAINT "work_orders_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'assigned'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "work_orders_worker_response_check" CHECK (("worker_response" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'proposed_other_time'::"text", 'info_requested'::"text"])))
);


ALTER TABLE "public"."work_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."worker_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "work_order_id" "uuid" NOT NULL,
    "worker_id" "uuid" NOT NULL,
    "rated_by_type" "text" DEFAULT 'tenant'::"text" NOT NULL,
    "stars" smallint NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "worker_ratings_rated_by_type_check" CHECK (("rated_by_type" = ANY (ARRAY['tenant'::"text", 'owner'::"text"]))),
    CONSTRAINT "worker_ratings_stars_check" CHECK ((("stars" >= 1) AND ("stars" <= 5)))
);


ALTER TABLE "public"."worker_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "specialty" "text",
    "rbq_license" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "user_id" "uuid",
    "requires_rbq" boolean DEFAULT false,
    "rbq_license_expiry" "date",
    "insurance_expiry" "date",
    "insurance_document_id" "uuid",
    "verification_notes" "text",
    "verified_by_admin_at" timestamp with time zone,
    "company_name" "text",
    "neq" "text",
    "specialties" "text"[] DEFAULT '{}'::"text"[],
    "zones" "text"[] DEFAULT '{}'::"text"[],
    "hourly_rate" numeric(10,2),
    "travel_fee" numeric(10,2),
    "handles_urgent" boolean DEFAULT false,
    "payout_email" "text",
    "verification_status" "text" DEFAULT 'pending'::"text",
    "verified_at" timestamp with time zone,
    "verified_by" "uuid",
    "rejection_reason" "text",
    "availability_status" "text" DEFAULT 'semaine'::"text",
    "availability_schedule" "jsonb" DEFAULT '{}'::"jsonb",
    "rating" numeric(3,2),
    "active" boolean DEFAULT true,
    CONSTRAINT "workers_availability_status_check" CHECK (("availability_status" = ANY (ARRAY['maintenant'::"text", 'aujourdhui'::"text", 'semaine'::"text", 'indisponible'::"text"]))),
    CONSTRAINT "workers_verification_status_check" CHECK (("verification_status" = ANY (ARRAY['pending'::"text", 'verified'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."workers" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."worker_verification_status" WITH ("security_invoker"='true') AS
 SELECT "id",
    "name",
    "specialty",
    "rbq_license",
    "phone",
    "created_at",
    "email",
    "user_id",
    "requires_rbq",
    "rbq_license_expiry",
    "insurance_expiry",
    "insurance_document_id",
    "verification_notes",
    "verified_by_admin_at",
    "company_name",
    "neq",
    "specialties",
    "zones",
    "hourly_rate",
    "travel_fee",
    "handles_urgent",
    "payout_email",
    "verification_status",
    "verified_at",
    "verified_by",
    "rejection_reason",
    "availability_status",
    "availability_schedule",
    "rating",
    "active",
    ("requires_rbq" AND (("rbq_license" IS NULL) OR ("rbq_license" = ''::"text"))) AS "missing_rbq_license",
    (("rbq_license_expiry" IS NOT NULL) AND ("rbq_license_expiry" < CURRENT_DATE)) AS "rbq_expired",
    ("insurance_document_id" IS NULL) AS "missing_insurance_doc",
    (("insurance_expiry" IS NOT NULL) AND ("insurance_expiry" < CURRENT_DATE)) AS "insurance_expired",
    (("rbq_license_expiry" IS NOT NULL) AND ("rbq_license_expiry" >= CURRENT_DATE) AND ("rbq_license_expiry" <= (CURRENT_DATE + '15 days'::interval))) AS "rbq_expiring_soon",
    (("insurance_expiry" IS NOT NULL) AND ("insurance_expiry" >= CURRENT_DATE) AND ("insurance_expiry" <= (CURRENT_DATE + '15 days'::interval))) AS "insurance_expiring_soon",
    COALESCE(( SELECT "count"(*) AS "count"
           FROM "public"."work_orders" "wo"
          WHERE (("wo"."worker_id" = "w"."id") AND ("wo"."status" = 'completed'::"text"))), (0)::bigint) AS "completed_jobs_count",
    COALESCE(( SELECT "count"(*) AS "count"
           FROM "public"."work_orders" "wo"
          WHERE (("wo"."worker_id" = "w"."id") AND ("wo"."worker_response" = 'declined'::"text"))), (0)::bigint) AS "declined_jobs_count",
    COALESCE(( SELECT "count"(*) AS "count"
           FROM "public"."job_offers" "jo"
          WHERE ("jo"."worker_id" = "w"."id")), (0)::bigint) AS "jobs_offered_count",
    COALESCE(( SELECT "count"(*) AS "count"
           FROM "public"."job_offers" "jo"
          WHERE (("jo"."worker_id" = "w"."id") AND ("jo"."status" = 'accepted'::"text"))), (0)::bigint) AS "jobs_accepted_count",
    COALESCE(( SELECT "count"(*) AS "count"
           FROM "public"."work_orders" "wo2"
          WHERE (("wo2"."worker_id" = "w"."id") AND ("wo2"."status" = 'cancelled'::"text"))), (0)::bigint) AS "jobs_cancelled_count",
    ( SELECT "round"("avg"("wr"."stars"), 2) AS "round"
           FROM "public"."worker_ratings" "wr"
          WHERE ("wr"."worker_id" = "w"."id")) AS "avg_rating",
    COALESCE(( SELECT "count"(*) AS "count"
           FROM "public"."worker_ratings" "wr"
          WHERE ("wr"."worker_id" = "w"."id")), (0)::bigint) AS "ratings_count"
   FROM "public"."workers" "w";


ALTER VIEW "public"."worker_verification_status" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ai_run_log"
    ADD CONSTRAINT "ai_run_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approvals"
    ADD CONSTRAINT "approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automated_decisions"
    ADD CONSTRAINT "automated_decisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_connections"
    ADD CONSTRAINT "bank_connections_owner_id_flinks_login_id_key" UNIQUE ("owner_id", "flinks_login_id");



ALTER TABLE ONLY "public"."bank_connections"
    ADD CONSTRAINT "bank_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_transactions"
    ADD CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."buildings"
    ADD CONSTRAINT "buildings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cold_callers"
    ADD CONSTRAINT "cold_callers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dissatisfaction_signals"
    ADD CONSTRAINT "dissatisfaction_signals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_disbursements"
    ADD CONSTRAINT "external_disbursements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_anomalies"
    ADD CONSTRAINT "financial_anomalies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gl_accounts"
    ADD CONSTRAINT "gl_accounts_owner_id_code_key" UNIQUE ("owner_id", "code");



ALTER TABLE ONLY "public"."gl_accounts"
    ADD CONSTRAINT "gl_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gl_journal_entries"
    ADD CONSTRAINT "gl_journal_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gl_journal_lines"
    ADD CONSTRAINT "gl_journal_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_number_counters"
    ADD CONSTRAINT "invoice_number_counters_pkey" PRIMARY KEY ("year");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_owner_id_period_start_period_end_key" UNIQUE ("owner_id", "period_start", "period_end");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_offers"
    ADD CONSTRAINT "job_offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lease_signatures"
    ADD CONSTRAINT "lease_signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pad_authorizations"
    ADD CONSTRAINT "pad_authorizations_owner_id_key" UNIQUE ("owner_id");



ALTER TABLE ONLY "public"."pad_authorizations"
    ADD CONSTRAINT "pad_authorizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payables"
    ADD CONSTRAINT "payables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_reminders"
    ADD CONSTRAINT "payment_reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personal_data_requests"
    ADD CONSTRAINT "personal_data_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."privacy_incidents"
    ADD CONSTRAINT "privacy_incidents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prospects"
    ADD CONSTRAINT "prospects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."public_faq_log"
    ADD CONSTRAINT "public_faq_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."public_submission_log"
    ADD CONSTRAINT "public_submission_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_catalog"
    ADD CONSTRAINT "service_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_catalog"
    ADD CONSTRAINT "service_catalog_task_type_key" UNIQUE ("task_type");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sms_log"
    ADD CONSTRAINT "sms_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_health_alert_state"
    ADD CONSTRAINT "system_health_alert_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_health_log"
    ADD CONSTRAINT "system_health_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_pad_authorizations"
    ADD CONSTRAINT "tenant_pad_authorizations_lease_id_key" UNIQUE ("lease_id");



ALTER TABLE ONLY "public"."tenant_pad_authorizations"
    ADD CONSTRAINT "tenant_pad_authorizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visits"
    ADD CONSTRAINT "visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_orders"
    ADD CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_ratings"
    ADD CONSTRAINT "worker_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_ratings"
    ADD CONSTRAINT "worker_ratings_work_order_id_rated_by_type_key" UNIQUE ("work_order_id", "rated_by_type");



ALTER TABLE ONLY "public"."workers"
    ADD CONSTRAINT "workers_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "bank_transactions_owner_external_id_key" ON "public"."bank_transactions" USING "btree" ("owner_id", "external_id") WHERE ("external_id" IS NOT NULL);



CREATE INDEX "idx_automated_decisions_review_pending" ON "public"."automated_decisions" USING "btree" ("review_requested_at") WHERE (("review_requested_at" IS NOT NULL) AND ("review_outcome" IS NULL));



CREATE INDEX "idx_automated_decisions_subject" ON "public"."automated_decisions" USING "btree" ("subject_type", "subject_id", "decided_at" DESC);



CREATE INDEX "idx_blog_posts_published" ON "public"."blog_posts" USING "btree" ("published_at" DESC) WHERE ("status" = 'published'::"text");



CREATE INDEX "idx_external_disbursements_lease" ON "public"."external_disbursements" USING "btree" ("lease_id");



CREATE INDEX "idx_gl_journal_entries_owner" ON "public"."gl_journal_entries" USING "btree" ("owner_id");



CREATE INDEX "idx_gl_journal_lines_account" ON "public"."gl_journal_lines" USING "btree" ("account_id");



CREATE INDEX "idx_gl_journal_lines_entry" ON "public"."gl_journal_lines" USING "btree" ("journal_entry_id");



CREATE INDEX "idx_job_offers_work_order" ON "public"."job_offers" USING "btree" ("work_order_id");



CREATE INDEX "idx_job_offers_worker" ON "public"."job_offers" USING "btree" ("worker_id");



CREATE INDEX "idx_payables_owner" ON "public"."payables" USING "btree" ("owner_id");



CREATE INDEX "idx_payables_status" ON "public"."payables" USING "btree" ("status") WHERE ("status" = 'pending_approval'::"text");



CREATE INDEX "idx_public_faq_log_ip_created" ON "public"."public_faq_log" USING "btree" ("ip_address", "created_at");



CREATE INDEX "idx_system_health_log_checked_at" ON "public"."system_health_log" USING "btree" ("checked_at" DESC);



CREATE INDEX "idx_worker_ratings_worker" ON "public"."worker_ratings" USING "btree" ("worker_id");



CREATE OR REPLACE TRIGGER "audit_log_immutable" BEFORE DELETE OR UPDATE ON "public"."audit_log" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_audit_log_mutation"();



CREATE OR REPLACE TRIGGER "gl_journal_entries_immutable" BEFORE DELETE OR UPDATE ON "public"."gl_journal_entries" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_gl_mutation"();



CREATE OR REPLACE TRIGGER "gl_journal_lines_immutable" BEFORE DELETE OR UPDATE ON "public"."gl_journal_lines" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_gl_mutation"();



CREATE OR REPLACE TRIGGER "on_approval_decided" AFTER UPDATE ON "public"."approvals" FOR EACH ROW EXECUTE FUNCTION "public"."handle_approval_decision"();



CREATE OR REPLACE TRIGGER "on_expense_insert_post_gl" AFTER INSERT ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."post_expense_to_gl"();



CREATE OR REPLACE TRIGGER "on_inquiry_insert" AFTER INSERT ON "public"."inquiries" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_inquiry"();



CREATE OR REPLACE TRIGGER "on_invoice_insert_post_gl" AFTER INSERT ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."post_invoice_to_gl"();



CREATE OR REPLACE TRIGGER "on_mandat_inquiry_insert" AFTER INSERT ON "public"."inquiries" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_mandat_inquiry"();



CREATE OR REPLACE TRIGGER "on_owner_insert_seed_gl_accounts" AFTER INSERT ON "public"."owners" FOR EACH ROW EXECUTE FUNCTION "public"."seed_default_gl_accounts_trigger"();



CREATE OR REPLACE TRIGGER "on_owner_message_insert" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_analyze_owner_message"();



CREATE OR REPLACE TRIGGER "on_payment_insert_post_gl" AFTER INSERT ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."post_payment_to_gl"();



CREATE OR REPLACE TRIGGER "on_payment_update_post_gl" AFTER UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."post_payment_to_gl"();



CREATE OR REPLACE TRIGGER "on_prospect_change" BEFORE INSERT OR UPDATE ON "public"."prospects" FOR EACH ROW EXECUTE FUNCTION "public"."compute_prospect_derived_fields"();



CREATE OR REPLACE TRIGGER "on_prospect_stage_change" BEFORE INSERT OR UPDATE ON "public"."prospects" FOR EACH ROW EXECUTE FUNCTION "public"."set_prospect_stage_changed_at"();



CREATE OR REPLACE TRIGGER "on_service_request_insert" AFTER INSERT ON "public"."service_requests" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_service_request"();



CREATE OR REPLACE TRIGGER "on_unit_listing_change" BEFORE INSERT OR UPDATE ON "public"."units" FOR EACH ROW EXECUTE FUNCTION "public"."notify_listing_needed"();



CREATE OR REPLACE TRIGGER "on_work_order_insert" AFTER INSERT ON "public"."work_orders" FOR EACH ROW EXECUTE FUNCTION "public"."check_work_order_approval"();



CREATE OR REPLACE TRIGGER "on_work_order_worker_assigned" BEFORE INSERT OR UPDATE ON "public"."work_orders" FOR EACH ROW EXECUTE FUNCTION "public"."notify_worker_new_job"();



CREATE OR REPLACE TRIGGER "restrict_automated_decisions_subject_update_trigger" BEFORE UPDATE ON "public"."automated_decisions" FOR EACH ROW EXECUTE FUNCTION "public"."restrict_automated_decisions_subject_update"();



CREATE OR REPLACE TRIGGER "restrict_documents_owner_insert_trigger" BEFORE INSERT ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."restrict_documents_owner_insert"();



ALTER TABLE ONLY "public"."approvals"
    ADD CONSTRAINT "approvals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id");



ALTER TABLE ONLY "public"."approvals"
    ADD CONSTRAINT "approvals_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automated_decisions"
    ADD CONSTRAINT "automated_decisions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."bank_connections"
    ADD CONSTRAINT "bank_connections_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_transactions"
    ADD CONSTRAINT "bank_transactions_ai_suggested_tenant_id_fkey" FOREIGN KEY ("ai_suggested_tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."bank_transactions"
    ADD CONSTRAINT "bank_transactions_matched_payment_id_fkey" FOREIGN KEY ("matched_payment_id") REFERENCES "public"."payments"("id");



ALTER TABLE ONLY "public"."bank_transactions"
    ADD CONSTRAINT "bank_transactions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_transactions"
    ADD CONSTRAINT "bank_transactions_reconciled_by_fkey" FOREIGN KEY ("reconciled_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."buildings"
    ADD CONSTRAINT "buildings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cold_callers"
    ADD CONSTRAINT "cold_callers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_is_duplicate_of_fkey" FOREIGN KEY ("is_duplicate_of") REFERENCES "public"."documents"("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_receipt_document_id_fkey" FOREIGN KEY ("receipt_document_id") REFERENCES "public"."documents"("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id");



ALTER TABLE ONLY "public"."external_disbursements"
    ADD CONSTRAINT "external_disbursements_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id");



ALTER TABLE ONLY "public"."external_disbursements"
    ADD CONSTRAINT "external_disbursements_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id");



ALTER TABLE ONLY "public"."external_disbursements"
    ADD CONSTRAINT "external_disbursements_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id");



ALTER TABLE ONLY "public"."external_disbursements"
    ADD CONSTRAINT "external_disbursements_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."external_disbursements"
    ADD CONSTRAINT "external_disbursements_receipt_document_id_fkey" FOREIGN KEY ("receipt_document_id") REFERENCES "public"."documents"("id");



ALTER TABLE ONLY "public"."external_disbursements"
    ADD CONSTRAINT "external_disbursements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."financial_anomalies"
    ADD CONSTRAINT "financial_anomalies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id");



ALTER TABLE ONLY "public"."financial_anomalies"
    ADD CONSTRAINT "financial_anomalies_related_expense_id_fkey" FOREIGN KEY ("related_expense_id") REFERENCES "public"."expenses"("id");



ALTER TABLE ONLY "public"."financial_anomalies"
    ADD CONSTRAINT "financial_anomalies_related_payment_id_fkey" FOREIGN KEY ("related_payment_id") REFERENCES "public"."payments"("id");



ALTER TABLE ONLY "public"."financial_anomalies"
    ADD CONSTRAINT "financial_anomalies_related_work_order_id_fkey" FOREIGN KEY ("related_work_order_id") REFERENCES "public"."work_orders"("id");



ALTER TABLE ONLY "public"."gl_accounts"
    ADD CONSTRAINT "gl_accounts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gl_journal_entries"
    ADD CONSTRAINT "gl_journal_entries_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gl_journal_lines"
    ADD CONSTRAINT "gl_journal_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."gl_accounts"("id");



ALTER TABLE ONLY "public"."gl_journal_lines"
    ADD CONSTRAINT "gl_journal_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."gl_journal_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_offers"
    ADD CONSTRAINT "job_offers_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_offers"
    ADD CONSTRAINT "job_offers_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id");



ALTER TABLE ONLY "public"."lease_signatures"
    ADD CONSTRAINT "lease_signatures_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pad_authorizations"
    ADD CONSTRAINT "pad_authorizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payables"
    ADD CONSTRAINT "payables_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."payables"
    ADD CONSTRAINT "payables_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id");



ALTER TABLE ONLY "public"."payables"
    ADD CONSTRAINT "payables_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id");



ALTER TABLE ONLY "public"."payables"
    ADD CONSTRAINT "payables_invoice_document_id_fkey" FOREIGN KEY ("invoice_document_id") REFERENCES "public"."documents"("id");



ALTER TABLE ONLY "public"."payables"
    ADD CONSTRAINT "payables_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payables"
    ADD CONSTRAINT "payables_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id");



ALTER TABLE ONLY "public"."payment_reminders"
    ADD CONSTRAINT "payment_reminders_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_data_requests"
    ADD CONSTRAINT "personal_data_requests_handled_by_fkey" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."privacy_incidents"
    ADD CONSTRAINT "privacy_incidents_logged_by_fkey" FOREIGN KEY ("logged_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."prospects"
    ADD CONSTRAINT "prospects_assigned_caller_id_fkey" FOREIGN KEY ("assigned_caller_id") REFERENCES "public"."cold_callers"("id");



ALTER TABLE ONLY "public"."prospects"
    ADD CONSTRAINT "prospects_converted_owner_id_fkey" FOREIGN KEY ("converted_owner_id") REFERENCES "public"."owners"("id");



ALTER TABLE ONLY "public"."prospects"
    ADD CONSTRAINT "prospects_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_pad_authorizations"
    ADD CONSTRAINT "tenant_pad_authorizations_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_pad_authorizations"
    ADD CONSTRAINT "tenant_pad_authorizations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visits"
    ADD CONSTRAINT "visits_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id");



ALTER TABLE ONLY "public"."visits"
    ADD CONSTRAINT "visits_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id");



ALTER TABLE ONLY "public"."work_orders"
    ADD CONSTRAINT "work_orders_service_catalog_id_fkey" FOREIGN KEY ("service_catalog_id") REFERENCES "public"."service_catalog"("id");



ALTER TABLE ONLY "public"."work_orders"
    ADD CONSTRAINT "work_orders_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id");



ALTER TABLE ONLY "public"."work_orders"
    ADD CONSTRAINT "work_orders_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_orders"
    ADD CONSTRAINT "work_orders_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id");



ALTER TABLE ONLY "public"."worker_ratings"
    ADD CONSTRAINT "worker_ratings_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."worker_ratings"
    ADD CONSTRAINT "worker_ratings_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id");



ALTER TABLE ONLY "public"."workers"
    ADD CONSTRAINT "workers_insurance_document_id_fkey" FOREIGN KEY ("insurance_document_id") REFERENCES "public"."documents"("id");



ALTER TABLE ONLY "public"."workers"
    ADD CONSTRAINT "workers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."workers"
    ADD CONSTRAINT "workers_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id");



CREATE POLICY "admin full access automated_decisions" ON "public"."automated_decisions" USING ("public"."auth_is_admin"()) WITH CHECK ("public"."auth_is_admin"());



CREATE POLICY "admin manages bank connections" ON "public"."bank_connections" USING ("public"."auth_is_admin"()) WITH CHECK ("public"."auth_is_admin"());



CREATE POLICY "admin manages blog posts" ON "public"."blog_posts" USING ("public"."auth_is_admin"()) WITH CHECK ("public"."auth_is_admin"());



CREATE POLICY "admin manages cold callers" ON "public"."cold_callers" USING ("public"."auth_is_admin"()) WITH CHECK ("public"."auth_is_admin"());



CREATE POLICY "admin manages company settings" ON "public"."company_settings" USING ("public"."auth_is_admin"()) WITH CHECK ("public"."auth_is_admin"());



CREATE POLICY "admin manages external disbursements" ON "public"."external_disbursements" USING ("public"."auth_is_admin"()) WITH CHECK ("public"."auth_is_admin"());



CREATE POLICY "admin manages gl_accounts" ON "public"."gl_accounts" USING ("public"."auth_is_admin"()) WITH CHECK ("public"."auth_is_admin"());



CREATE POLICY "admin manages gl_journal_entries" ON "public"."gl_journal_entries" USING ("public"."auth_is_admin"()) WITH CHECK ("public"."auth_is_admin"());



CREATE POLICY "admin manages gl_journal_lines" ON "public"."gl_journal_lines" USING ("public"."auth_is_admin"()) WITH CHECK ("public"."auth_is_admin"());



CREATE POLICY "admin manages invoices" ON "public"."invoices" USING ("public"."auth_is_admin"()) WITH CHECK ("public"."auth_is_admin"());



CREATE POLICY "admin manages pad authorizations" ON "public"."pad_authorizations" USING ("public"."auth_is_admin"()) WITH CHECK ("public"."auth_is_admin"());



CREATE POLICY "admin manages payables" ON "public"."payables" USING ("public"."auth_is_admin"()) WITH CHECK ("public"."auth_is_admin"());



CREATE POLICY "admin manages service catalog" ON "public"."service_catalog" USING ("public"."auth_is_admin"()) WITH CHECK ("public"."auth_is_admin"());



CREATE POLICY "admin manages tenant pad authorizations" ON "public"."tenant_pad_authorizations" USING ("public"."auth_is_admin"()) WITH CHECK ("public"."auth_is_admin"());



CREATE POLICY "admin read ai_run_log" ON "public"."ai_run_log" FOR SELECT USING ("public"."auth_is_admin"());



CREATE POLICY "admin read approvals" ON "public"."approvals" FOR SELECT USING ("public"."auth_is_admin"());



CREATE POLICY "admin read audit_log" ON "public"."audit_log" FOR SELECT USING ("public"."auth_is_admin"());



CREATE POLICY "admin read dissatisfaction_signals" ON "public"."dissatisfaction_signals" FOR SELECT USING ("public"."auth_is_admin"());



CREATE POLICY "admin read expenses" ON "public"."expenses" FOR SELECT USING ("public"."auth_is_admin"());



CREATE POLICY "admin read inquiries" ON "public"."inquiries" FOR SELECT USING ("public"."auth_is_admin"());



CREATE POLICY "admin read leases" ON "public"."leases" FOR SELECT USING ("public"."auth_is_admin"());



CREATE POLICY "admin read payment_reminders" ON "public"."payment_reminders" FOR SELECT USING ("public"."auth_is_admin"());



CREATE POLICY "admin read payments" ON "public"."payments" FOR SELECT USING ("public"."auth_is_admin"());



CREATE POLICY "admin read personal_data_requests" ON "public"."personal_data_requests" FOR SELECT USING ("public"."auth_is_admin"());



CREATE POLICY "admin read privacy_incidents" ON "public"."privacy_incidents" FOR SELECT USING ("public"."auth_is_admin"());



CREATE POLICY "admin read service_requests" ON "public"."service_requests" FOR SELECT USING ("public"."auth_is_admin"());



CREATE POLICY "admin read visits" ON "public"."visits" FOR SELECT USING ("public"."auth_is_admin"());



CREATE POLICY "admin read work_orders" ON "public"."work_orders" FOR SELECT USING ("public"."auth_is_admin"());



CREATE POLICY "admin reads system health log" ON "public"."system_health_log" FOR SELECT USING ("public"."auth_is_admin"());



CREATE POLICY "admin update inquiries" ON "public"."inquiries" FOR UPDATE USING ("public"."auth_is_admin"()) WITH CHECK ("public"."auth_is_admin"());



ALTER TABLE "public"."ai_run_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anyone authenticated views company settings" ON "public"."company_settings" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automated_decisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."buildings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "caller views own profile" ON "public"."cold_callers" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."cold_callers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dissatisfaction_signals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."external_disbursements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_anomalies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gl_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gl_journal_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gl_journal_lines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inquiries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_number_counters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_offers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lease_signatures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "own approvals" ON "public"."approvals" FOR SELECT USING (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "own approvals update" ON "public"."approvals" FOR UPDATE USING (("owner_id" = "public"."auth_owner_id"())) WITH CHECK (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "own automated decisions as owner" ON "public"."automated_decisions" FOR SELECT USING ((("subject_type" = 'owner'::"text") AND ("subject_id" = "public"."auth_owner_id"())));



CREATE POLICY "own automated decisions as tenant" ON "public"."automated_decisions" FOR SELECT USING ((("subject_type" = 'tenant'::"text") AND ("subject_id" = "public"."auth_tenant_id"())));



CREATE POLICY "own automated decisions as worker" ON "public"."automated_decisions" FOR SELECT USING ((("subject_type" = 'worker'::"text") AND ("subject_id" IN ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."user_id" = "auth"."uid"())))));



CREATE POLICY "own building as tenant" ON "public"."buildings" FOR SELECT USING (("id" IN ( SELECT "public"."tenant_building_ids"() AS "tenant_building_ids")));



CREATE POLICY "own buildings" ON "public"."buildings" FOR SELECT USING (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "own documents" ON "public"."documents" FOR SELECT USING (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "own documents delete" ON "public"."documents" FOR DELETE USING (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "own documents insert" ON "public"."documents" FOR INSERT WITH CHECK (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "own expenses" ON "public"."expenses" FOR SELECT USING (("building_id" IN ( SELECT "public"."owned_building_ids"() AS "owned_building_ids")));



CREATE POLICY "own expenses insert" ON "public"."expenses" FOR INSERT WITH CHECK (("building_id" IN ( SELECT "public"."owned_building_ids"() AS "owned_building_ids")));



CREATE POLICY "own leases" ON "public"."leases" FOR SELECT USING (("unit_id" IN ( SELECT "public"."owned_unit_ids"() AS "owned_unit_ids")));



CREATE POLICY "own leases as tenant" ON "public"."leases" FOR SELECT USING (("tenant_id" = "public"."auth_tenant_id"()));



CREATE POLICY "own messages" ON "public"."messages" FOR SELECT USING (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "own messages insert" ON "public"."messages" FOR INSERT WITH CHECK (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "own payments" ON "public"."payments" FOR SELECT USING (("lease_id" IN ( SELECT "public"."owned_lease_ids"() AS "owned_lease_ids")));



CREATE POLICY "own payments as tenant" ON "public"."payments" FOR SELECT USING (("lease_id" IN ( SELECT "leases"."id"
   FROM "public"."leases"
  WHERE ("leases"."tenant_id" = "public"."auth_tenant_id"()))));



CREATE POLICY "own profile" ON "public"."owners" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "own reports" ON "public"."reports" FOR SELECT USING (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "own service_requests" ON "public"."service_requests" FOR SELECT USING (("unit_id" IN ( SELECT "public"."owned_unit_ids"() AS "owned_unit_ids")));



CREATE POLICY "own service_requests as tenant insert" ON "public"."service_requests" FOR INSERT WITH CHECK ((("tenant_id" = "public"."auth_tenant_id"()) AND ("unit_id" IN ( SELECT "public"."tenant_unit_ids"() AS "tenant_unit_ids"))));



CREATE POLICY "own service_requests as tenant select" ON "public"."service_requests" FOR SELECT USING (("tenant_id" = "public"."auth_tenant_id"()));



CREATE POLICY "own service_requests update" ON "public"."service_requests" FOR UPDATE USING (("unit_id" IN ( SELECT "public"."owned_unit_ids"() AS "owned_unit_ids"))) WITH CHECK (("unit_id" IN ( SELECT "public"."owned_unit_ids"() AS "owned_unit_ids")));



CREATE POLICY "own tenant profile" ON "public"."tenants" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "own tenants" ON "public"."tenants" FOR SELECT USING (("id" IN ( SELECT "leases"."tenant_id"
   FROM "public"."leases"
  WHERE ("leases"."unit_id" IN ( SELECT "public"."owned_unit_ids"() AS "owned_unit_ids")))));



CREATE POLICY "own unit as tenant" ON "public"."units" FOR SELECT USING (("id" IN ( SELECT "public"."tenant_unit_ids"() AS "tenant_unit_ids")));



CREATE POLICY "own units" ON "public"."units" FOR SELECT USING (("building_id" IN ( SELECT "public"."owned_building_ids"() AS "owned_building_ids")));



CREATE POLICY "own work_orders" ON "public"."work_orders" FOR SELECT USING (("unit_id" IN ( SELECT "public"."owned_unit_ids"() AS "owned_unit_ids")));



CREATE POLICY "own work_orders insert" ON "public"."work_orders" FOR INSERT WITH CHECK (("unit_id" IN ( SELECT "public"."owned_unit_ids"() AS "owned_unit_ids")));



CREATE POLICY "own work_orders update" ON "public"."work_orders" FOR UPDATE USING (("unit_id" IN ( SELECT "public"."owned_unit_ids"() AS "owned_unit_ids"))) WITH CHECK (("unit_id" IN ( SELECT "public"."owned_unit_ids"() AS "owned_unit_ids")));



CREATE POLICY "owner read own data requests" ON "public"."personal_data_requests" FOR SELECT USING ((("subject_type" = 'owner'::"text") AND ("subject_id" = "public"."auth_owner_id"())));



CREATE POLICY "owner read own unit visit inquiries" ON "public"."inquiries" FOR SELECT USING ((("type" = 'visite'::"text") AND ("unit_id" IN ( SELECT "public"."owned_unit_ids"() AS "owned_unit_ids"))));



CREATE POLICY "owner read workers assigned to own units" ON "public"."workers" FOR SELECT USING (("public"."auth_is_admin"() OR ("id" IN ( SELECT "work_orders"."worker_id"
   FROM "public"."work_orders"
  WHERE (("work_orders"."unit_id" IN ( SELECT "public"."owned_unit_ids"() AS "owned_unit_ids")) AND ("work_orders"."worker_id" IS NOT NULL))))));



CREATE POLICY "owner submit own data request" ON "public"."personal_data_requests" FOR INSERT WITH CHECK ((("subject_type" = 'owner'::"text") AND ("subject_id" = "public"."auth_owner_id"()) AND ("status" = 'received'::"text")));



CREATE POLICY "owner update own unit visit inquiries" ON "public"."inquiries" FOR UPDATE USING ((("type" = 'visite'::"text") AND ("unit_id" IN ( SELECT "public"."owned_unit_ids"() AS "owned_unit_ids")))) WITH CHECK ((("type" = 'visite'::"text") AND ("unit_id" IN ( SELECT "public"."owned_unit_ids"() AS "owned_unit_ids"))));



CREATE POLICY "owner views own bank connections" ON "public"."bank_connections" FOR SELECT USING (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "owner views own external disbursements" ON "public"."external_disbursements" FOR SELECT USING (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "owner views own gl_accounts" ON "public"."gl_accounts" FOR SELECT USING (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "owner views own gl_journal_entries" ON "public"."gl_journal_entries" FOR SELECT USING (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "owner views own gl_journal_lines" ON "public"."gl_journal_lines" FOR SELECT USING (("journal_entry_id" IN ( SELECT "gl_journal_entries"."id"
   FROM "public"."gl_journal_entries"
  WHERE ("gl_journal_entries"."owner_id" = "public"."auth_owner_id"()))));



CREATE POLICY "owner views own invoices" ON "public"."invoices" FOR SELECT USING (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "owner views own pad authorization" ON "public"."pad_authorizations" FOR SELECT USING (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "owner views own payables" ON "public"."payables" FOR SELECT USING (("owner_id" = "public"."auth_owner_id"()));



CREATE POLICY "owner views own tenants pad authorizations" ON "public"."tenant_pad_authorizations" FOR SELECT USING (("lease_id" IN ( SELECT "public"."owned_lease_ids"() AS "owned_lease_ids")));



ALTER TABLE "public"."owners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pad_authorizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_reminders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personal_data_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."privacy_incidents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prospects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public read available units" ON "public"."units" FOR SELECT USING (("status" = ANY (ARRAY['available'::"text", 'soon_available'::"text"])));



CREATE POLICY "public read buildings with available units" ON "public"."buildings" FOR SELECT USING (("id" IN ( SELECT "units"."building_id"
   FROM "public"."units"
  WHERE ("units"."status" = ANY (ARRAY['available'::"text", 'soon_available'::"text"])))));



CREATE POLICY "public reads published blog posts" ON "public"."blog_posts" FOR SELECT USING (("status" = 'published'::"text"));



ALTER TABLE "public"."public_faq_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."public_submission_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "request review as owner" ON "public"."automated_decisions" FOR UPDATE USING ((("subject_type" = 'owner'::"text") AND ("subject_id" = "public"."auth_owner_id"()))) WITH CHECK ((("subject_type" = 'owner'::"text") AND ("subject_id" = "public"."auth_owner_id"())));



CREATE POLICY "request review as tenant" ON "public"."automated_decisions" FOR UPDATE USING ((("subject_type" = 'tenant'::"text") AND ("subject_id" = "public"."auth_tenant_id"()))) WITH CHECK ((("subject_type" = 'tenant'::"text") AND ("subject_id" = "public"."auth_tenant_id"())));



CREATE POLICY "request review as worker" ON "public"."automated_decisions" FOR UPDATE USING ((("subject_type" = 'worker'::"text") AND ("subject_id" IN ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."user_id" = "auth"."uid"()))))) WITH CHECK ((("subject_type" = 'worker'::"text") AND ("subject_id" IN ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."user_id" = "auth"."uid"())))));



CREATE POLICY "self" ON "public"."users" FOR SELECT USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."service_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sms_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_health_alert_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_health_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenant read own data requests" ON "public"."personal_data_requests" FOR SELECT USING ((("subject_type" = 'tenant'::"text") AND ("subject_id" = "public"."auth_tenant_id"())));



CREATE POLICY "tenant submit own data request" ON "public"."personal_data_requests" FOR INSERT WITH CHECK ((("subject_type" = 'tenant'::"text") AND ("subject_id" = "public"."auth_tenant_id"()) AND ("status" = 'received'::"text")));



CREATE POLICY "tenant views own pad authorization" ON "public"."tenant_pad_authorizations" FOR SELECT USING (("tenant_id" = "public"."auth_tenant_id"()));



ALTER TABLE "public"."tenant_pad_authorizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."units" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."visits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."worker_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workers" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."accept_job_offer"("p_offer_id" "uuid", "p_worker_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_job_offer"("p_offer_id" "uuid", "p_worker_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_job_offer"("p_offer_id" "uuid", "p_worker_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_caller_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_caller_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_caller_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_owner_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_owner_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_owner_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_tenant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_tenant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_tenant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_lease_renewal_windows"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_lease_renewal_windows"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_lease_renewal_windows"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_recent_http_failures"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_recent_http_failures"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_recent_http_failures"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_system_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_system_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_system_health"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_work_order_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_work_order_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_work_order_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_prospect_derived_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."compute_prospect_derived_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_prospect_derived_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."detect_financial_anomalies"() TO "anon";
GRANT ALL ON FUNCTION "public"."detect_financial_anomalies"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."detect_financial_anomalies"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_data_retention"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_data_retention"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_data_retention"() TO "service_role";



GRANT ALL ON FUNCTION "public"."flag_incomplete_onboarding"() TO "anon";
GRANT ALL ON FUNCTION "public"."flag_incomplete_onboarding"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."flag_incomplete_onboarding"() TO "service_role";



GRANT ALL ON FUNCTION "public"."flag_stale_listings"() TO "anon";
GRANT ALL ON FUNCTION "public"."flag_stale_listings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."flag_stale_listings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."flag_stuck_repair_cases"() TO "anon";
GRANT ALL ON FUNCTION "public"."flag_stuck_repair_cases"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."flag_stuck_repair_cases"() TO "service_role";



GRANT ALL ON FUNCTION "public"."flag_worker_credential_issues"() TO "anon";
GRANT ALL ON FUNCTION "public"."flag_worker_credential_issues"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."flag_worker_credential_issues"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_monthly_payments"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_monthly_payments"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_monthly_payments"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gl_trial_balance"("p_owner_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."gl_trial_balance"("p_owner_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gl_trial_balance"("p_owner_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_approval_decision"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_approval_decision"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_approval_decision"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."next_invoice_number"("p_year" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."next_invoice_number"("p_year" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."next_invoice_number"("p_year" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_listing_needed"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_listing_needed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_listing_needed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_inquiry"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_inquiry"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_inquiry"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_mandat_inquiry"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_mandat_inquiry"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_mandat_inquiry"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_service_request"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_service_request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_service_request"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_worker_new_job"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_worker_new_job"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_worker_new_job"() TO "service_role";



GRANT ALL ON FUNCTION "public"."owned_building_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."owned_building_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."owned_building_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."owned_lease_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."owned_lease_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."owned_lease_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."owned_unit_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."owned_unit_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."owned_unit_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."post_expense_to_gl"() TO "anon";
GRANT ALL ON FUNCTION "public"."post_expense_to_gl"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."post_expense_to_gl"() TO "service_role";



GRANT ALL ON FUNCTION "public"."post_invoice_to_gl"() TO "anon";
GRANT ALL ON FUNCTION "public"."post_invoice_to_gl"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."post_invoice_to_gl"() TO "service_role";



GRANT ALL ON FUNCTION "public"."post_payment_to_gl"() TO "anon";
GRANT ALL ON FUNCTION "public"."post_payment_to_gl"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."post_payment_to_gl"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_audit_log_mutation"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_audit_log_mutation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_audit_log_mutation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_gl_mutation"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_gl_mutation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_gl_mutation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_worker_response_timeouts"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_worker_response_timeouts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_worker_response_timeouts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."purge_old_health_log"() TO "anon";
GRANT ALL ON FUNCTION "public"."purge_old_health_log"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."purge_old_health_log"() TO "service_role";



GRANT ALL ON FUNCTION "public"."restrict_automated_decisions_subject_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."restrict_automated_decisions_subject_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."restrict_automated_decisions_subject_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."restrict_documents_owner_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."restrict_documents_owner_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."restrict_documents_owner_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_default_gl_accounts"("p_owner_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."seed_default_gl_accounts"("p_owner_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_default_gl_accounts"("p_owner_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_default_gl_accounts_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."seed_default_gl_accounts_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_default_gl_accounts_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."send_visit_reminders"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_visit_reminders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_visit_reminders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_prospect_stage_changed_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_prospect_stage_changed_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_prospect_stage_changed_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tenant_building_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."tenant_building_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tenant_building_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tenant_unit_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."tenant_unit_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tenant_unit_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_analyze_owner_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_analyze_owner_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_analyze_owner_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_dispatch_advance"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_dispatch_advance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_dispatch_advance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_flinks_daily_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_flinks_daily_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_flinks_daily_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_health_check_alert"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_health_check_alert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_health_check_alert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_monthly_owner_reports"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_monthly_owner_reports"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_monthly_owner_reports"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_payment_reminders"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_payment_reminders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_payment_reminders"() TO "service_role";
























GRANT ALL ON TABLE "public"."ai_run_log" TO "anon";
GRANT ALL ON TABLE "public"."ai_run_log" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_run_log" TO "service_role";



GRANT ALL ON TABLE "public"."approvals" TO "anon";
GRANT ALL ON TABLE "public"."approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."approvals" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."automated_decisions" TO "anon";
GRANT ALL ON TABLE "public"."automated_decisions" TO "authenticated";
GRANT ALL ON TABLE "public"."automated_decisions" TO "service_role";



GRANT ALL ON TABLE "public"."bank_connections" TO "anon";
GRANT ALL ON TABLE "public"."bank_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_connections" TO "service_role";



GRANT ALL ON TABLE "public"."bank_transactions" TO "anon";
GRANT ALL ON TABLE "public"."bank_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."buildings" TO "anon";
GRANT ALL ON TABLE "public"."buildings" TO "authenticated";
GRANT ALL ON TABLE "public"."buildings" TO "service_role";



GRANT ALL ON TABLE "public"."cold_callers" TO "anon";
GRANT ALL ON TABLE "public"."cold_callers" TO "authenticated";
GRANT ALL ON TABLE "public"."cold_callers" TO "service_role";



GRANT ALL ON TABLE "public"."company_settings" TO "anon";
GRANT ALL ON TABLE "public"."company_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."company_settings" TO "service_role";



GRANT ALL ON TABLE "public"."dissatisfaction_signals" TO "anon";
GRANT ALL ON TABLE "public"."dissatisfaction_signals" TO "authenticated";
GRANT ALL ON TABLE "public"."dissatisfaction_signals" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."external_disbursements" TO "anon";
GRANT ALL ON TABLE "public"."external_disbursements" TO "authenticated";
GRANT ALL ON TABLE "public"."external_disbursements" TO "service_role";



GRANT ALL ON TABLE "public"."financial_anomalies" TO "anon";
GRANT ALL ON TABLE "public"."financial_anomalies" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_anomalies" TO "service_role";



GRANT ALL ON TABLE "public"."gl_accounts" TO "anon";
GRANT ALL ON TABLE "public"."gl_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."gl_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."gl_journal_entries" TO "anon";
GRANT ALL ON TABLE "public"."gl_journal_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."gl_journal_entries" TO "service_role";



GRANT ALL ON TABLE "public"."gl_journal_lines" TO "anon";
GRANT ALL ON TABLE "public"."gl_journal_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."gl_journal_lines" TO "service_role";



GRANT ALL ON TABLE "public"."inquiries" TO "anon";
GRANT ALL ON TABLE "public"."inquiries" TO "authenticated";
GRANT ALL ON TABLE "public"."inquiries" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_number_counters" TO "anon";
GRANT ALL ON TABLE "public"."invoice_number_counters" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_number_counters" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."job_offers" TO "anon";
GRANT ALL ON TABLE "public"."job_offers" TO "authenticated";
GRANT ALL ON TABLE "public"."job_offers" TO "service_role";



GRANT ALL ON TABLE "public"."leases" TO "anon";
GRANT ALL ON TABLE "public"."leases" TO "authenticated";
GRANT ALL ON TABLE "public"."leases" TO "service_role";



GRANT ALL ON TABLE "public"."lease_renewal_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."lease_signatures" TO "anon";
GRANT ALL ON TABLE "public"."lease_signatures" TO "authenticated";
GRANT ALL ON TABLE "public"."lease_signatures" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."owners" TO "anon";
GRANT ALL ON TABLE "public"."owners" TO "authenticated";
GRANT ALL ON TABLE "public"."owners" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."units" TO "anon";
GRANT ALL ON TABLE "public"."units" TO "authenticated";
GRANT ALL ON TABLE "public"."units" TO "service_role";



GRANT ALL ON TABLE "public"."owner_onboarding_checklist" TO "service_role";



GRANT ALL ON TABLE "public"."pad_authorizations" TO "anon";
GRANT ALL ON TABLE "public"."pad_authorizations" TO "authenticated";
GRANT ALL ON TABLE "public"."pad_authorizations" TO "service_role";



GRANT ALL ON TABLE "public"."payables" TO "anon";
GRANT ALL ON TABLE "public"."payables" TO "authenticated";
GRANT ALL ON TABLE "public"."payables" TO "service_role";



GRANT ALL ON TABLE "public"."payment_reminders" TO "anon";
GRANT ALL ON TABLE "public"."payment_reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_reminders" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."personal_data_requests" TO "anon";
GRANT ALL ON TABLE "public"."personal_data_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."personal_data_requests" TO "service_role";



GRANT ALL ON TABLE "public"."privacy_incidents" TO "anon";
GRANT ALL ON TABLE "public"."privacy_incidents" TO "authenticated";
GRANT ALL ON TABLE "public"."privacy_incidents" TO "service_role";



GRANT ALL ON TABLE "public"."prospects" TO "anon";
GRANT ALL ON TABLE "public"."prospects" TO "authenticated";
GRANT ALL ON TABLE "public"."prospects" TO "service_role";



GRANT ALL ON TABLE "public"."public_faq_log" TO "anon";
GRANT ALL ON TABLE "public"."public_faq_log" TO "authenticated";
GRANT ALL ON TABLE "public"."public_faq_log" TO "service_role";



GRANT ALL ON TABLE "public"."public_submission_log" TO "anon";
GRANT ALL ON TABLE "public"."public_submission_log" TO "authenticated";
GRANT ALL ON TABLE "public"."public_submission_log" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."service_catalog" TO "anon";
GRANT ALL ON TABLE "public"."service_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."service_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."service_requests" TO "anon";
GRANT ALL ON TABLE "public"."service_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."service_requests" TO "service_role";



GRANT ALL ON TABLE "public"."sms_log" TO "anon";
GRANT ALL ON TABLE "public"."sms_log" TO "authenticated";
GRANT ALL ON TABLE "public"."sms_log" TO "service_role";



GRANT ALL ON TABLE "public"."system_health_alert_state" TO "anon";
GRANT ALL ON TABLE "public"."system_health_alert_state" TO "authenticated";
GRANT ALL ON TABLE "public"."system_health_alert_state" TO "service_role";



GRANT ALL ON TABLE "public"."system_health_log" TO "anon";
GRANT ALL ON TABLE "public"."system_health_log" TO "authenticated";
GRANT ALL ON TABLE "public"."system_health_log" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_pad_authorizations" TO "anon";
GRANT ALL ON TABLE "public"."tenant_pad_authorizations" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_pad_authorizations" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."visits" TO "anon";
GRANT ALL ON TABLE "public"."visits" TO "authenticated";
GRANT ALL ON TABLE "public"."visits" TO "service_role";



GRANT ALL ON TABLE "public"."work_orders" TO "anon";
GRANT ALL ON TABLE "public"."work_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."work_orders" TO "service_role";



GRANT ALL ON TABLE "public"."worker_ratings" TO "anon";
GRANT ALL ON TABLE "public"."worker_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."worker_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."workers" TO "anon";
GRANT ALL ON TABLE "public"."workers" TO "authenticated";
GRANT ALL ON TABLE "public"."workers" TO "service_role";



GRANT ALL ON TABLE "public"."worker_verification_status" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";

































--
-- TRIGGERS
--
-- Ajoutés à la main : `supabase db dump` a produit les 50 fonctions
-- trigger mais AUCUNE instruction CREATE TRIGGER — ses filtres sed les
-- écartent. Les liaisons ci-dessous sont extraites de pg_get_triggerdef()
-- en production. Sans elles, une base reconstruite aurait des fonctions
-- trigger jamais appelées : audit_log et le grand livre deviendraient
-- silencieusement modifiables, et les notifications ne partiraient pas.
--

CREATE TRIGGER on_approval_decided AFTER UPDATE ON public.approvals FOR EACH ROW EXECUTE FUNCTION handle_approval_decision();
CREATE TRIGGER audit_log_immutable BEFORE DELETE OR UPDATE ON public.audit_log FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
CREATE TRIGGER restrict_automated_decisions_subject_update_trigger BEFORE UPDATE ON public.automated_decisions FOR EACH ROW EXECUTE FUNCTION restrict_automated_decisions_subject_update();
CREATE TRIGGER restrict_documents_owner_insert_trigger BEFORE INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION restrict_documents_owner_insert();
CREATE TRIGGER on_expense_insert_post_gl AFTER INSERT ON public.expenses FOR EACH ROW EXECUTE FUNCTION post_expense_to_gl();
CREATE TRIGGER gl_journal_entries_immutable BEFORE DELETE OR UPDATE ON public.gl_journal_entries FOR EACH ROW EXECUTE FUNCTION prevent_gl_mutation();
CREATE TRIGGER gl_journal_lines_immutable BEFORE DELETE OR UPDATE ON public.gl_journal_lines FOR EACH ROW EXECUTE FUNCTION prevent_gl_mutation();
CREATE TRIGGER on_inquiry_insert AFTER INSERT ON public.inquiries FOR EACH ROW EXECUTE FUNCTION notify_new_inquiry();
CREATE TRIGGER on_mandat_inquiry_insert AFTER INSERT ON public.inquiries FOR EACH ROW EXECUTE FUNCTION notify_new_mandat_inquiry();
CREATE TRIGGER on_invoice_insert_post_gl AFTER INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION post_invoice_to_gl();
CREATE TRIGGER on_owner_message_insert AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION trigger_analyze_owner_message();
CREATE TRIGGER on_owner_insert_seed_gl_accounts AFTER INSERT ON public.owners FOR EACH ROW EXECUTE FUNCTION seed_default_gl_accounts_trigger();
CREATE TRIGGER on_payment_insert_post_gl AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION post_payment_to_gl();
CREATE TRIGGER on_payment_update_post_gl AFTER UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION post_payment_to_gl();
CREATE TRIGGER on_prospect_change BEFORE INSERT OR UPDATE ON public.prospects FOR EACH ROW EXECUTE FUNCTION compute_prospect_derived_fields();
CREATE TRIGGER on_prospect_stage_change BEFORE INSERT OR UPDATE ON public.prospects FOR EACH ROW EXECUTE FUNCTION set_prospect_stage_changed_at();
CREATE TRIGGER on_service_request_insert AFTER INSERT ON public.service_requests FOR EACH ROW EXECUTE FUNCTION notify_new_service_request();
CREATE TRIGGER on_unit_listing_change BEFORE INSERT OR UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION notify_listing_needed();
CREATE TRIGGER on_work_order_insert AFTER INSERT ON public.work_orders FOR EACH ROW EXECUTE FUNCTION check_work_order_approval();
CREATE TRIGGER on_work_order_worker_assigned BEFORE INSERT OR UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION notify_worker_new_job();

--
-- Le trigger on_auth_user_created (schéma auth) n'est PAS inclus : il
-- porte sur auth.users, hors du schéma public, et une branche Supabase
-- recrée le schéma auth elle-même. Il est documenté ici pour mémoire —
-- c'est lui qui alimente public.users à la création d'un compte :
--   CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();
--
