-- T2 · Déclenchement de l'envoyeur et séquence des rappels de loyer (courriels.md § 2).
--
-- 1. comms.declencher_envois() : chaque minute, appelle la fonction edge envoyer-courriels s'il y a un envoi dû.
--    L'URL du projet est lue dans Vault (« project_url ») : jamais écrite en dur (voir 20260907190000, la
--    préproduction appelait la production). Sans ce secret, rien n'est appelé.
-- 2. comms.planifier_rappels_loyer() : chaque jour, loyer impayé → SMS à J+1 (LOC-05, courriel si pas de
--    cellulaire), courriel à J+7 (LOC-06), à 9 h; arrêt dès que le loyer est payé.
--    INACTIF tant que config.parametres « rappels_loyer » n'est pas vrai : les anciens rappels
--    (trigger_payment_reminders, jours 1/3/5) tournent encore en production; activer les deux doublerait les rappels.

create table config.parametres (
  cle        text primary key,
  valeur     jsonb not null,
  updated_at timestamptz not null default now()
);
alter table config.parametres enable row level security;
create policy "equipe lit les parametres" on config.parametres for select to authenticated using (crm.is_team_member());
grant select on config.parametres to authenticated;
grant all on config.parametres to service_role;
insert into config.parametres (cle, valeur) values ('rappels_loyer', 'false'::jsonb);

create or replace function comms.declencher_envois() returns void
language plpgsql security definer set search_path = '' as $$
declare v_url text;
begin
  if not exists (select 1 from comms.outbox where status in ('queued', 'held_window', 'held_kill_switch') and scheduled_for <= now()) then return; end if;
  begin
    select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url' limit 1;
  exception when others then v_url := null;
  end;
  if coalesce(v_url, '') = '' then return; end if;
  perform net.http_post(url := rtrim(v_url, '/') || '/functions/v1/envoyer-courriels', body := '{}'::jsonb, headers := public.internal_call_headers());
end $$;

-- Montant à la québécoise : « 1 195 $ », « 1 195,50 $ ».
create or replace function comms.montant(p numeric) returns text language sql immutable set search_path = '' as $$
  select replace(replace(to_char(p, 'FM999G999G990D00'), ',', ' '), '.', ',') || ' $'
$$;
create or replace function comms.montant_court(p numeric) returns text language sql immutable set search_path = '' as $$
  select regexp_replace(comms.montant(p), ',00 [$]$', ' $')
$$;

create or replace function comms.planifier_rappels_loyer() returns int
language plpgsql security definer set search_path = '' as $$
declare
  r record; n int := 0; v_seq uuid; v_jours int; v_vars jsonb; v_tel text; v_neuf timestamptz;
  mois text[] := array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  v_mois text;
begin
  if coalesce((select valeur from config.parametres where cle = 'rappels_loyer'), 'false'::jsonb) <> 'true'::jsonb then return 0; end if;
  v_neuf := (current_date + time '09:00') at time zone 'America/Toronto';

  -- Payé entre-temps : la séquence s'arrête (les envois en file sont annulés à la préparation du lot).
  update comms.sequence_enrollments se set stopped_reason = 'resolu', stopped_at = now()
   from public.payments p where se.sequence_code = 'loyer' and se.stopped_at is null and se.entity_type = 'payments'
     and se.entity_id = p.id and (p.status = 'paid' or coalesce(p.reminder_paused, false));

  for r in
    select p.id, p.amount, p.due_date, t.full_name, t.email, t.phone, b.address, u.unit_number
    from public.payments p
    join public.leases l on l.id = p.lease_id
    join public.tenants t on t.id = l.tenant_id
    join public.units u on u.id = l.unit_id
    join public.buildings b on b.id = u.building_id
    where p.status in ('pending', 'late') and p.due_date <= current_date - 1 and p.due_date > current_date - 21
      and not coalesce(p.reminder_paused, false) and not coalesce(p.escalated_to_human, false)
      and t.archived_at is null and t.anonymized_at is null
  loop
    v_jours := current_date - r.due_date;
    v_mois := mois[extract(month from r.due_date)::int];
    v_tel := case when length(regexp_replace(coalesce(r.phone, ''), '\D', '', 'g')) = 10 then '+1' || regexp_replace(r.phone, '\D', '', 'g')
                  when regexp_replace(coalesce(r.phone, ''), '\D', '', 'g') ~ '^1\d{10}$' then '+' || regexp_replace(r.phone, '\D', '', 'g') end;
    if v_tel is null and coalesce(r.email, '') = '' then continue; end if;
    -- Une séquence arrêtée (réponse, STOP, payé) ne recommence jamais pour ce loyer.
    if exists (select 1 from comms.sequence_enrollments where sequence_code = 'loyer' and entity_type = 'payments' and entity_id = r.id and stopped_at is not null) then continue; end if;

    insert into comms.sequence_enrollments (sequence_code, channel, recipient, entity_type, entity_id)
    values ('loyer', case when v_tel is not null then 'sms' else 'email' end, coalesce(v_tel, r.email), 'payments', r.id)
    on conflict (sequence_code, entity_type, entity_id) where stopped_at is null do nothing;
    select id into v_seq from comms.sequence_enrollments where sequence_code = 'loyer' and entity_type = 'payments' and entity_id = r.id and stopped_at is null;
    if v_seq is null then continue; end if;

    v_vars := jsonb_build_object(
      'prenom', split_part(btrim(r.full_name), ' ', 1), 'montant', comms.montant_court(r.amount), 'mois', v_mois,
      'de_mois', case when v_mois ~ '^[aeiouéo]' then 'd’' else 'de ' end || v_mois,
      'echeance', case when extract(day from r.due_date) = 1 then '1er' else extract(day from r.due_date)::text end || ' ' || v_mois || ' ' || extract(year from r.due_date),
      'adresse_logement', r.address || coalesce(' — ' || r.unit_number, ''), 'jours_retard', v_jours, 'ratio_retard', round(least(v_jours / 21.0, 1), 3),
      'lien_paiement', 'https://app.leaselane.ca/?p=locataire', 'lien_entente', 'mailto:info@leaselane.ca?subject=Entente%20de%20paiement',
      'gestionnaire', 'L’équipe Lease Lane', 'initiales_gestionnaire', 'LL');

    if v_jours >= 1 then
      perform comms.enqueue(jsonb_build_object('template_code', 'LOC-05', 'channel', case when v_tel is not null then 'sms' else 'email' end,
        'recipient', coalesce(v_tel, r.email), 'vars', v_vars, 'at', greatest(now(), v_neuf), 'idempotency_key', 'loyer:' || r.id || ':j1',
        'entity_type', 'payments', 'entity_id', r.id, 'sequence_enrollment_id', v_seq));
    end if;
    if v_jours >= 7 and coalesce(r.email, '') <> '' then
      perform comms.enqueue(jsonb_build_object('template_code', 'LOC-06', 'channel', 'email', 'recipient', r.email, 'vars', v_vars,
        'at', greatest(now(), v_neuf), 'idempotency_key', 'loyer:' || r.id || ':j7', 'entity_type', 'payments', 'entity_id', r.id, 'sequence_enrollment_id', v_seq));
    end if;
    update comms.sequence_enrollments set attempt = (select count(*) from comms.outbox o where o.sequence_enrollment_id = v_seq), next_at = case when v_jours < 7 then r.due_date + 7 + time '09:00' end where id = v_seq;
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function comms.declencher_envois(), comms.planifier_rappels_loyer(), comms.montant(numeric), comms.montant_court(numeric) from public, anon, authenticated;
grant execute on function comms.declencher_envois(), comms.planifier_rappels_loyer(), comms.montant(numeric), comms.montant_court(numeric) to service_role;

do $$ begin
  if exists (select 1 from cron.job where jobname = 'envois-chaque-minute') then perform cron.unschedule('envois-chaque-minute'); end if;
  perform cron.schedule('envois-chaque-minute', '* * * * *', 'select comms.declencher_envois()');
  if exists (select 1 from cron.job where jobname = 'rappels-loyer-t2') then perform cron.unschedule('rappels-loyer-t2'); end if;
  perform cron.schedule('rappels-loyer-t2', '30 12 * * *', 'select comms.planifier_rappels_loyer()');
end $$;
