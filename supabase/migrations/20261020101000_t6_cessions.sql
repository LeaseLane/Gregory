-- T6b · Cessions et sous-locations (maquette l10). Spec : ordre-des-tranches.md § T6 (demande → fiche → solvabilité → décision du
-- propriétaire (PRO-04); refus seulement avec un motif sérieux, dans les 15 jours (LOC-13); décision après 15 jours → « réputée acceptée »).
--   • Délai : config.legal_parameters « assignment_response » (15 jours, art. 1871 C.c.Q.); tant qu'il n'est pas validé, 15 jours
--     s'appliquent quand même (la loi court) et l'écran le signale.
--   • La demande est saisie par l'équipe tant que le portail locataire (t01) n'existe pas; l'accord du propriétaire est consigné par
--     l'équipe tant que le portail p04 n'existe pas (moyen + note).
--   • Acceptée → LOC-12 au locataire et tâche « avenant à faire signer »; refusée → LOC-13 avec le motif saisi par une personne.

insert into config.legal_parameters (code, label, value, source) values
  ('assignment_response', 'Réponse du propriétaire à une cession ou sous-location', '{"jours": 15}', 'C.c.Q., art. 1871 — à valider par le juridique')
on conflict (code, valid_from) do nothing;

create sequence if not exists crm.assignments_numero;
create table if not exists crm.assignments (
  id uuid primary key default gen_random_uuid(), numero text not null unique default to_char(now(), 'YYYY') || '-' || lpad(nextval('crm.assignments_numero')::text, 3, '0'),
  kind text not null check (kind in ('cession', 'sous_location')),
  lease_id uuid not null references public.leases(id), tenant_id uuid references public.tenants(id) on delete set null, owner_id uuid references public.owners(id) on delete set null,
  person_name text not null check (char_length(btrim(person_name)) between 2 and 120), person_email text, person_phone text, person_job text, person_income text,
  start_date date not null, end_date date, attachments text[] not null default '{}', source text not null default 'equipe' check (source in ('equipe', 'portail')),
  status text not null default 'recue' check (status in ('recue', 'solvabilite', 'accord_proprietaire', 'acceptee', 'refusee', 'reputee_acceptee', 'annulee')),
  received_at timestamptz not null default now(), deadline_at timestamptz not null, screening_id uuid references crm.screenings(id) on delete set null,
  owner_requested_at timestamptz, owner_outbox_id uuid references comms.outbox(id),
  decision_at timestamptz, decision_by uuid references auth.users(id), decision_note text, refusal_reason text, reply_outbox_id uuid references comms.outbox(id),
  created_by uuid references auth.users(id), created_at timestamptz not null default now(),
  check (status <> 'refusee' or char_length(btrim(coalesce(refusal_reason, ''))) >= 20)
);
create unique index if not exists assignments_une_ouverte_par_bail on crm.assignments (lease_id) where status in ('recue', 'solvabilite', 'accord_proprietaire');
create index if not exists assignments_tenant_idx on crm.assignments (tenant_id);
create index if not exists assignments_owner_idx on crm.assignments (owner_id);
create index if not exists assignments_screening_idx on crm.assignments (screening_id);
create index if not exists assignments_owner_outbox_idx on crm.assignments (owner_outbox_id);
create index if not exists assignments_reply_outbox_idx on crm.assignments (reply_outbox_id);
create index if not exists assignments_decision_by_idx on crm.assignments (decision_by);
create index if not exists assignments_created_by_idx on crm.assignments (created_by);
create index if not exists assignments_deadline_idx on crm.assignments (deadline_at) where status in ('recue', 'solvabilite', 'accord_proprietaire');
alter table crm.assignments enable row level security;
create policy "clients lit les cessions" on crm.assignments for select to authenticated using (crm.can('clients.lire'));
revoke all on crm.assignments from anon, authenticated; grant select on crm.assignments to authenticated; grant all on crm.assignments to service_role;
alter table crm.screenings add column if not exists assignment_id uuid references crm.assignments(id) on delete set null;
create index if not exists screenings_assignment_idx on crm.screenings (assignment_id);

create or replace function crm.cession_jours() returns int language sql stable security definer set search_path = '' as $$
  select coalesce((config.parametre_legal('assignment_response') ->> 'jours')::int, 15)
$$;
create or replace function crm.date_fr(p timestamptz) returns text language sql stable set search_path = '' as $$
  select extract(day from p at time zone 'America/Toronto')::int || case when extract(day from p at time zone 'America/Toronto') = 1 then 'er' else '' end || ' '
    || (array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'])[extract(month from p at time zone 'America/Toronto')::int]
$$;

-- Demande (équipe, en attendant le portail t01). { kind, lease_id, nom, courriel?, telephone?, emploi?, revenu?, date_debut, date_fin?, pieces? }
create or replace function public.lanceur_creer_cession(p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare l record; v uuid;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas d’enregistrer une demande.' using errcode = 'PT403'; end if;
  select le.id, le.tenant_id, le.end_date, b.owner_id into l from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id
   where le.id = (p ->> 'lease_id')::uuid and le.status = 'active';
  if l.id is null then raise exception 'Bail actif introuvable.' using errcode = 'PT404'; end if;
  if (p ->> 'date_debut') is null then raise exception 'Date de début requise.' using errcode = 'PT422'; end if;
  if p ->> 'kind' = 'sous_location' and (p ->> 'date_fin') is null then raise exception 'Une sous-location a une date de fin.' using errcode = 'PT422'; end if;
  insert into crm.assignments (kind, lease_id, tenant_id, owner_id, person_name, person_email, person_phone, person_job, person_income, start_date, end_date, attachments, deadline_at, created_by)
  values (coalesce(p ->> 'kind', 'cession'), l.id, l.tenant_id, l.owner_id, btrim(p ->> 'nom'), nullif(lower(btrim(p ->> 'courriel')), ''), nullif(btrim(p ->> 'telephone'), ''),
          nullif(btrim(p ->> 'emploi'), ''), nullif(btrim(p ->> 'revenu'), ''), (p ->> 'date_debut')::date, (p ->> 'date_fin')::date,
          coalesce(array(select jsonb_array_elements_text(p -> 'pieces')), '{}'), now() + make_interval(days => crm.cession_jours()), auth.uid())
  returning id into v;
  perform crm.journal('assignment.received', 'crm.assignments', v, null, p - 'revenu', 'create-assignment');
  return v;
end $$;

-- Solvabilité de la personne proposée : demande T5 (LOC-14) liée à la cession.
create or replace function public.lanceur_cession_solvabilite(p_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare a crm.assignments; v uuid;
begin
  select * into a from crm.assignments where id = p_id and status in ('recue', 'solvabilite') for update;
  if not found then raise exception 'Demande introuvable ou déjà au propriétaire.' using errcode = 'PT409'; end if;
  if a.person_email is null then raise exception 'Ajoutez le courriel de la personne : le consentement part par courriel.' using errcode = 'PT422'; end if;
  v := (public.lanceur_demander_enquete(jsonb_build_object('nom', a.person_name, 'courriel', a.person_email, 'lease_id', a.lease_id, 'motif', a.kind)) ->> 'id')::uuid;
  update crm.screenings set assignment_id = a.id where id = v;
  update crm.assignments set status = 'solvabilite', screening_id = v where id = a.id;
  return v;
end $$;

-- Accord du propriétaire demandé : PRO-04.
create or replace function public.lanceur_cession_demander_accord(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a crm.assignments; i record; o comms.outbox; v_j numeric;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de demander l’accord du propriétaire.' using errcode = 'PT403'; end if;
  select * into a from crm.assignments where id = p_id and status in ('recue', 'solvabilite') for update;
  if not found then raise exception 'Demande introuvable ou déjà au propriétaire.' using errcode = 'PT409'; end if;
  select ow.full_name as proprio, coalesce(c.emails[1], u.email) as courriel_proprio, t.full_name as locataire, b.address || coalesce(' — ' || un.unit_number, '') as lieu, le.monthly_rent,
         (select case s.result when 'ok' then coalesce((array['Faible','Passable','Bonne','Très bonne','Excellente'])[(s.report ->> 'cote')::int], 'reçue') || ' (' || crm.date_fr(s.result_at) || ')'
                 when 'empty' then 'Dossier vide' else null end from crm.screenings s where s.id = a.screening_id) as solva
    into i from public.leases le join public.units un on un.id = le.unit_id join public.buildings b on b.id = un.building_id left join public.owners ow on ow.id = b.owner_id
    left join crm.contacts c on c.owner_id = ow.id and c.merged_into is null left join auth.users u on u.id = ow.user_id left join public.tenants t on t.id = le.tenant_id where le.id = a.lease_id;
  if coalesce(i.courriel_proprio, '') = '' then raise exception 'Aucun courriel pour le propriétaire.' using errcode = 'PT422'; end if;
  v_j := greatest(0, ceil(extract(epoch from a.deadline_at - now()) / 86400));
  o := comms.enqueue(jsonb_build_object('template_code', 'PRO-04', 'channel', 'email', 'recipient', i.courriel_proprio, 'entity_type', 'crm.assignments', 'entity_id', a.id, 'canal_journal', 'interface',
    'idempotency_key', 'pro04:' || a.id,
    'vars', jsonb_build_object('type_demande', case a.kind when 'cession' then 'cession de bail' else 'sous-location' end, 'adresse_logement', i.lieu,
      'titre_demande', i.locataire || case a.kind when 'cession' then ' souhaite céder son bail à ' else ' souhaite sous-louer son logement à ' end || a.person_name,
      'logement_ligne', i.lieu || ' · ' || comms.montant_court(i.monthly_rent) || ' par mois', 'cessionnaire_ligne', a.person_name || coalesce(', ' || a.person_job, ''),
      'solvabilite', coalesce(i.solva, 'pas encore vérifiée'), 'date_debut', crm.date_fr(a.start_date::timestamptz) || ' ' || extract(year from a.start_date),
      'jours_restants', v_j || ' jour' || case when v_j > 1 then 's' else '' end || ' restant' || case when v_j > 1 then 's' else '' end,
      'ratio_delai', round(1 - v_j / crm.cession_jours(), 2)::text, 'date_demande', crm.date_fr(a.received_at), 'date_limite', crm.date_fr(a.deadline_at),
      'lien_reponse', 'https://app.leaselane.ca/?p=proprietaire', 'gestionnaire', crm.nom_membre(auth.uid()),
      'initiales_gestionnaire', upper(left(split_part(crm.nom_membre(auth.uid()), ' ', 1), 1) || left(split_part(crm.nom_membre(auth.uid()), ' ', 2), 1)))));
  update crm.assignments set status = 'accord_proprietaire', owner_requested_at = now(), owner_outbox_id = o.id where id = a.id;
  perform crm.journal('assignment.owner_asked', 'crm.assignments', a.id, null, null, 'ask-owner-assignment');
  return jsonb_build_object('outbox_id', o.id);
end $$;

-- Décision du propriétaire (consignée par l'équipe). { id, decision: accepte|refuse, motif? (refus : motif sérieux), note (comment obtenue) }
create or replace function public.lanceur_cession_decider(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a crm.assignments; i record; o comms.outbox; v_dec text := p ->> 'decision'; v_type text;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de consigner la décision.' using errcode = 'PT403'; end if;
  select * into a from crm.assignments where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
  if a.status not in ('recue', 'solvabilite', 'accord_proprietaire') then raise exception 'Cette demande est déjà tranchée (%).', a.status using errcode = 'PT409'; end if;
  if v_dec not in ('accepte', 'refuse') then raise exception 'Décision inconnue.' using errcode = 'PT422'; end if;
  if v_dec = 'refuse' and now() > a.deadline_at then
    raise exception 'Le délai de % jours est écoulé : la demande est réputée acceptée, un refus n’est plus possible.', crm.cession_jours() using errcode = 'PT422';
  end if;
  if v_dec = 'refuse' and char_length(btrim(coalesce(p ->> 'motif', ''))) < 20 then
    raise exception 'Un refus exige un motif sérieux, écrit par une personne (20 caractères au moins).' using errcode = 'PT422';
  end if;
  if coalesce(btrim(p ->> 'note'), '') = '' then raise exception 'Indiquez comment le propriétaire a répondu (courriel, appel…).' using errcode = 'PT422'; end if;
  select t.full_name, t.email, b.address || coalesce(' — ' || un.unit_number, '') as lieu into i
    from public.leases le join public.units un on un.id = le.unit_id join public.buildings b on b.id = un.building_id left join public.tenants t on t.id = le.tenant_id where le.id = a.lease_id;
  v_type := case a.kind when 'cession' then 'cession de bail' else 'sous-location' end;
  update crm.assignments set status = case v_dec when 'accepte' then 'acceptee' else 'refusee' end, decision_at = now(), decision_by = auth.uid(), decision_note = btrim(p ->> 'note'),
    refusal_reason = case when v_dec = 'refuse' then btrim(p ->> 'motif') end where id = a.id;
  if coalesce(i.email, '') <> '' then
    o := comms.enqueue(jsonb_build_object('template_code', case v_dec when 'accepte' then 'LOC-12' else 'LOC-13' end, 'channel', 'email', 'recipient', i.email,
      'entity_type', 'crm.assignments', 'entity_id', a.id, 'canal_journal', 'interface', 'idempotency_key', 'cession-reponse:' || a.id,
      'vars', jsonb_build_object('prenom', split_part(i.full_name, ' ', 1), 'type_demande', v_type, 'cessionnaire', a.person_name, 'adresse_logement', i.lieu,
        'date_debut', crm.date_fr(a.start_date::timestamptz) || ' ' || extract(year from a.start_date), 'date_demande', crm.date_fr(a.received_at), 'date_accord', crm.date_fr(now()),
        'verification', coalesce((select 'solvabilité de ' || a.person_name || ' : ' || case s.result when 'ok' then lower((array['Faible','Passable','Bonne','Très bonne','Excellente'])[(s.report ->> 'cote')::int]) else 'vérifiée' end
                                  from crm.screenings s where s.id = a.screening_id and s.status = 'done'), 'dossier vérifié par l’équipe'),
        'changement', case a.kind when 'cession' then 'Une fois l’avenant signé, ' || a.person_name || ' devient locataire à votre place. Pensez à transférer l’électricité et votre assurance.'
                      else 'Vous restez locataire et responsable du bail pendant la sous-location' || coalesce(', jusqu’au ' || crm.date_fr(a.end_date::timestamptz), '') || '.' end,
        'motif', btrim(p ->> 'motif'), 'lien_avenant', 'https://app.leaselane.ca/?p=locataire', 'lien_portail', 'https://app.leaselane.ca/?p=locataire',
        'gestionnaire', crm.nom_membre(auth.uid()), 'initiales_gestionnaire', upper(left(split_part(crm.nom_membre(auth.uid()), ' ', 1), 1) || left(split_part(crm.nom_membre(auth.uid()), ' ', 2), 1)))));
    update crm.assignments set reply_outbox_id = o.id where id = a.id;
  end if;
  if v_dec = 'accepte' then
    perform crm.creer_tache(jsonb_build_object('title', 'Avenant de ' || v_type || ' à faire signer · ' || a.person_name, 'context', 'Clients · Cessions et sous-locations · ' || i.lieu,
      'due_at', now() + interval '3 days', 'assignee_user_id', auth.uid(), 'entity_type', 'crm.assignments', 'entity_id', a.id, 'canal', 'interface'));
  end if;
  perform crm.journal('assignment.decided', 'crm.assignments', a.id, jsonb_build_object('status', a.status), p, 'decide-assignment');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.lanceur_cession_annuler(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas d’annuler une demande.' using errcode = 'PT403'; end if;
  update crm.assignments set status = 'annulee' where id = p_id and status in ('recue', 'solvabilite', 'accord_proprietaire');
  if not found then raise exception 'Demande introuvable ou déjà tranchée.' using errcode = 'PT409'; end if;
  perform crm.journal('assignment.cancelled', 'crm.assignments', p_id, null, null, 'cancel-assignment');
end $$;

-- Cron quotidien : délai écoulé sans décision → réputée acceptée, signalée par une tâche.
create or replace function crm.cessions_echues() returns int language plpgsql security definer set search_path = '' as $$
declare a record; n int := 0;
begin
  for a in update crm.assignments set status = 'reputee_acceptee', decision_at = now(), decision_note = 'Délai légal écoulé sans réponse'
            where status in ('recue', 'solvabilite', 'accord_proprietaire') and deadline_at < now() returning id, person_name, created_by loop
    perform crm.creer_tache(jsonb_build_object('title', 'Réputée acceptée (délai écoulé) : demande pour ' || a.person_name, 'context', 'Clients · Cessions et sous-locations',
      'due_at', now() + interval '1 day', 'assignee_user_id', a.created_by, 'source', 'system', 'entity_type', 'crm.assignments', 'entity_id', a.id, 'canal', 'cron'));
    perform crm.journal('assignment.deemed_accepted', 'crm.assignments', a.id, null, null, 'deem-assignment-accepted', 'cron', null, 'system');
    n := n + 1;
  end loop;
  return n;
end $$;
do $$ begin
  if exists (select 1 from cron.job where jobname = 'cessions-echues') then perform cron.unschedule('cessions-echues'); end if;
  perform cron.schedule('cessions-echues', '5 5 * * *', 'select crm.cessions_echues()');
end $$;

-- l10
create or replace function public.lanceur_cessions() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès aux cessions.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'demandes', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'numero', a.numero, 'kind', a.kind, 'statut', a.status, 'logement', b.address || coalesce(' — ' || un.unit_number, ''),
        'loyer', le.monthly_rent, 'fin_bail', le.end_date, 'locataire', t.full_name, 'personne', a.person_name, 'courriel', a.person_email, 'telephone', a.person_phone, 'emploi', a.person_job,
        'revenu', a.person_income, 'debut', a.start_date, 'fin', a.end_date, 'pieces', a.attachments, 'source', a.source, 'recue', a.received_at, 'limite', a.deadline_at,
        'proprietaire', ow.full_name, 'accord_demande', a.owner_requested_at, 'decision', a.decision_at, 'note', a.decision_note, 'motif', a.refusal_reason,
        'enquete', (select jsonb_build_object('statut', s.status, 'resultat', s.result, 'cote', (s.report ->> 'cote')::int, 'le', coalesce(s.result_at, s.consent_requested_at), 'consentement', s.consent_at)
                    from crm.screenings s where s.id = a.screening_id))
      order by case when a.status in ('recue', 'solvabilite', 'accord_proprietaire') then 0 else 1 end, a.deadline_at)
      from crm.assignments a join public.leases le on le.id = a.lease_id join public.units un on un.id = le.unit_id join public.buildings b on b.id = un.building_id
      left join public.tenants t on t.id = a.tenant_id left join public.owners ow on ow.id = a.owner_id
      where a.status in ('recue', 'solvabilite', 'accord_proprietaire') or a.created_at > now() - interval '60 days'), '[]'::jsonb),
    'baux', coalesce((select jsonb_agg(jsonb_build_object('id', le.id, 'libelle', b.address || coalesce(' — ' || un.unit_number, '') || ' · ' || t.full_name) order by b.address, un.unit_number)
      from public.leases le join public.units un on un.id = le.unit_id join public.buildings b on b.id = un.building_id join public.tenants t on t.id = le.tenant_id where le.status = 'active'), '[]'::jsonb),
    'jours', crm.cession_jours(), 'delai_valide', config.parametre_legal('assignment_response') is not null, 'peut_ecrire', crm.can('clients.ecrire'));
end $$;

revoke all on function crm.cession_jours(), crm.cessions_echues() from public, anon, authenticated;
revoke all on function public.lanceur_creer_cession(jsonb), public.lanceur_cession_solvabilite(uuid), public.lanceur_cession_demander_accord(uuid), public.lanceur_cession_decider(jsonb),
  public.lanceur_cession_annuler(uuid), public.lanceur_cessions() from public, anon;
grant execute on function public.lanceur_creer_cession(jsonb), public.lanceur_cession_solvabilite(uuid), public.lanceur_cession_demander_accord(uuid), public.lanceur_cession_decider(jsonb),
  public.lanceur_cession_annuler(uuid), public.lanceur_cessions() to authenticated;
