-- Lot G9.8 — un rappel n'est compté que s'il est vraiment parti.
--
-- ⚠️  NON APPLIQUÉE. Écrite le 2026-09-11, à relire et à éprouver sur
--     préproduction avant exécution.
--
-- LE PROBLÈME, constaté en production le 2026-09-11. Deux loyers impayés
-- de 950 $ et 1 150 $, échus le 1er septembre :
--
--   reminder_upcoming_sent .......... true
--   late_reminder_count ............. 3
--   escalated_to_human .............. true
--   rappels réellement enregistrés .. 0
--
-- Quatre rappels annoncés par locataire, aucune trace qu'un seul soit
-- parti : ni dans payment_reminders, ni dans ai_run_log, ni dans sms_log.
--
-- LA CAUSE. Dans trigger_payment_reminders(), net.http_post est
-- ASYNCHRONE : il met la requête en file et rend la main aussitôt, sans
-- connaître le sort de l'appel. La ligne suivante incrémentait le
-- compteur de toute façon. Un échec et un succès étaient donc
-- indiscernables pour la base.
--
-- Conséquences, par ordre de gravité :
--   1. Le compteur atteint 3 et le locataire CESSE d'être relancé, sans
--      avoir jamais rien reçu.
--   2. Le portail affiche « 3 rappels envoyés » à l'équipe et au
--      propriétaire — une information fausse sur un dossier d'argent,
--      opposable au locataire en cas de litige.
--   3. Aucune alerte : rien ne distingue l'échec du succès.
--
-- LE MOTIF RETENU est déjà en service ailleurs dans ce dépôt :
-- trigger_health_check_alert() vérifie le sort de la requête PRÉCÉDENTE
-- avant de poser son verrou, journalise l'échec, et retire le verrou pour
-- réessayer. On l'applique ici.
--
-- CE QUI NE CHANGE PAS : la fonction edge handle-payment-reminder écrit
-- déjà dans payment_reminders APRÈS un envoi réussi. Cette table est donc
-- la source de vérité; ce sont les compteurs SQL qui mentaient.

-- ============================================================
-- 1. Mémoriser la requête en attente
-- ============================================================
-- net.http_post rend un identifiant de requête. Sans le conserver, on ne
-- peut pas vérifier au passage suivant si l'appel a abouti.

alter table payments add column if not exists reminder_request_id bigint;
alter table payments add column if not exists reminder_request_type text;
alter table payments add column if not exists reminder_request_at timestamptz;

comment on column payments.reminder_request_id is
  'Identifiant net.http_post du dernier rappel tenté, en attente de confirmation. Null une fois le sort connu (lot G9.8).';

-- ============================================================
-- 2. Confirmer ou infirmer la tentative précédente
-- ============================================================
-- Appelée en tête de trigger_payment_reminders, avant toute nouvelle
-- tentative. C'est ici — et seulement ici — que les compteurs avancent.

create or replace function confirmer_rappels_en_attente()
returns void language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_statut int;
begin
  for r in
    select id, reminder_request_id, reminder_request_type
    from payments
    where reminder_request_id is not null
  loop
    select status_code into v_statut
    from net._http_response where id = r.reminder_request_id;

    -- Réponse pas encore arrivée : on laisse en attente, on retentera au
    -- passage suivant. Ne rien faire est la bonne action ici.
    if v_statut is null then
      continue;
    end if;

    if v_statut >= 200 and v_statut < 300 then
      -- Succès confirmé : c'est MAINTENANT qu'on avance le compteur.
      update payments set
        reminder_upcoming_sent = case when r.reminder_request_type = 'upcoming' then true else reminder_upcoming_sent end,
        late_reminder_count    = case when r.reminder_request_type = 'late' then coalesce(late_reminder_count, 0) + 1 else late_reminder_count end,
        last_late_reminder_at  = case when r.reminder_request_type = 'late' then now() else last_late_reminder_at end,
        escalated_to_human     = case when r.reminder_request_type = 'escalate' then true else escalated_to_human end,
        reminder_request_id = null, reminder_request_type = null, reminder_request_at = null
      where id = r.id;
    else
      -- Échec : on NE compte pas, et on remet le dossier en file pour la
      -- prochaine exécution plutôt que de le laisser filer en silence.
      insert into audit_log (actor_type, action, entity_type, entity_id, details)
      values ('system', 'payment_reminder.delivery_failed', 'payments', r.id,
              jsonb_build_object('request_id', r.reminder_request_id,
                                 'status_code', v_statut,
                                 'reminder_type', r.reminder_request_type));
      update payments set
        reminder_request_id = null, reminder_request_type = null, reminder_request_at = null
      where id = r.id;
    end if;
  end loop;
end;
$$;

-- ============================================================
-- 3. trigger_payment_reminders, sans mensonge
-- ============================================================
-- Reprise de la version en production au 2026-09-11. Deux changements,
-- rien d'autre :
--   - confirmer_rappels_en_attente() en tête;
--   - l'identifiant de requête est mémorisé au lieu d'avancer le compteur.
--
-- Le `and reminder_request_id is null` de chaque boucle évite de relancer
-- un dossier dont la tentative précédente n'a pas encore répondu : sans
-- lui, un locataire recevrait plusieurs rappels en quelques minutes.

create or replace function trigger_payment_reminders()
returns void language plpgsql security definer set search_path = public as $$
declare
  p record;
  v_request_id bigint;
begin
  perform confirmer_rappels_en_attente();

  update payments set status = 'late'
  where status = 'pending' and due_date < current_date;

  for p in
    select id from payments
    where status = 'pending'
    and due_date between current_date and current_date + interval '3 days'
    and reminder_upcoming_sent = false
    and coalesce(reminder_paused, false) = false
    and reminder_request_id is null
  loop
    select net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-payment-reminder',
      body := jsonb_build_object('payment_id', p.id, 'reminder_type', 'upcoming'),
      headers := internal_call_headers()
    ) into v_request_id;
    update payments set reminder_request_id = v_request_id,
                        reminder_request_type = 'upcoming',
                        reminder_request_at = now()
     where id = p.id;
  end loop;

  for p in
    select id, due_date, late_reminder_count from payments
    where status = 'late'
    and coalesce(reminder_paused, false) = false
    and coalesce(escalated_to_human, false) = false
    and coalesce(late_reminder_count, 0) < 3
    and (current_date - due_date) >= (array[1,3,5])[coalesce(late_reminder_count, 0) + 1]
    and reminder_request_id is null
  loop
    select net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-payment-reminder',
      body := jsonb_build_object('payment_id', p.id, 'reminder_type', 'late'),
      headers := internal_call_headers()
    ) into v_request_id;
    update payments set reminder_request_id = v_request_id,
                        reminder_request_type = 'late',
                        reminder_request_at = now()
     where id = p.id;
  end loop;

  for p in
    select id from payments
    where status = 'late'
    and coalesce(reminder_paused, false) = false
    and coalesce(escalated_to_human, false) = false
    and (current_date - due_date) >= 8
    and reminder_request_id is null
  loop
    select net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-payment-reminder',
      body := jsonb_build_object('payment_id', p.id, 'reminder_type', 'escalate'),
      headers := internal_call_headers()
    ) into v_request_id;
    update payments set reminder_request_id = v_request_id,
                        reminder_request_type = 'escalate',
                        reminder_request_at = now()
     where id = p.id;
  end loop;
end;
$$;

-- ============================================================
-- 4. Corriger les deux dossiers déjà faussés
-- ============================================================
-- Les compteurs des paiements en retard annoncent des rappels dont
-- payment_reminders ne garde aucune trace. On les remet sur la réalité :
-- le nombre de rappels 'late' réellement enregistrés.
--
-- Effet concret : ces locataires redeviennent éligibles aux relances
-- qu'ils auraient dû recevoir. C'est voulu — ils n'ont jamais été
-- contactés.

update payments p set
  late_reminder_count = (
    select count(*) from payment_reminders r
    where r.payment_id = p.id and r.reminder_type = 'late'),
  reminder_upcoming_sent = exists (
    select 1 from payment_reminders r
    where r.payment_id = p.id and r.reminder_type = 'upcoming'),
  escalated_to_human = exists (
    select 1 from payment_reminders r
    where r.payment_id = p.id and r.reminder_type = 'escalate'),
  last_late_reminder_at = (
    select max(sent_at) from payment_reminders r
    where r.payment_id = p.id and r.reminder_type = 'late')
where p.status in ('pending', 'late')
  and (
    p.late_reminder_count <> (select count(*) from payment_reminders r
                              where r.payment_id = p.id and r.reminder_type = 'late')
    or p.reminder_upcoming_sent <> exists (select 1 from payment_reminders r
                              where r.payment_id = p.id and r.reminder_type = 'upcoming')
  );

-- ============================================================
-- Vérification après exécution
-- ============================================================
-- Plus aucun écart entre ce qui est compté et ce qui est tracé :
--
--   select p.id, p.late_reminder_count,
--          (select count(*) from payment_reminders r
--            where r.payment_id = p.id and r.reminder_type = 'late') as traces
--   from payments p where p.status = 'late';
--   → les deux colonnes doivent être égales.
--
-- Les échecs de livraison deviennent visibles :
--
--   select * from audit_log
--   where action = 'payment_reminder.delivery_failed'
--   order by created_at desc;
--
-- ⚠️  DÉPENDANCE : cette migration appelle internal_call_headers(), créée
-- par 20260909160000_g11_secret_appels_internes.sql. Appliquer celle-là
-- d'abord.
