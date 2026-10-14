-- T8a · Juridique : dossiers de recouvrement, mises en demeure, TAL, modèles (maquettes l16, e46–e51).
-- Spec : ordre-des-tranches.md § T8 (J+1, J+7 envoyés par T2; à J+12, la rédaction juridique propose une mise en demeure; une personne
-- l'approuve (e50); elle part signée (eZsign) un jour ouvrable entre 9 h et 17 h (LOC-07); le dossier passe au TAL).
--   Invariants : aucun envoi juridique sans approbation humaine (la mise en demeure n'est approuvée QUE par une proposition décidée
--   par une personne); modèle non révisé par l'avocate inutilisable (422).
--   • La rédaction est l'agent « redaction » : il remplit le modèle révisé avec les valeurs du dossier (aucun texte inventé) et dépose
--     une proposition « approve-formal-notice » dans « À approuver ». La personne peut corriger le texte avant d'approuver.
--   • L'envoi (fonction « juridique ») signe la lettre (simulateur hors production; refusé en production tant qu'eZsign n'est pas
--     branché) puis met LOC-07 en file : la fenêtre du gabarit (jour ouvrable, 9 h–17 h) planifie l'envoi si on est hors heures.
--   • Ouverture automatique des dossiers à J+12 : INACTIVE tant que config.parametres « juridique_auto » n'est pas vrai.
--   • Loyer payé → le dossier se règle seul et la mise en demeure envoyée porte le résultat « payé ».

create schema if not exists jur;
grant usage on schema jur to authenticated, service_role;
insert into config.parametres (cle, valeur) values ('juridique_auto', 'false'::jsonb) on conflict (cle) do nothing;

-- Avis légaux : jour ouvrable, 9 h–17 h (courriels.md : LOC-07, LOC-12, LOC-13).
update comms.email_templates set window_start = '09:00', window_end = '17:00', business_days_only = true where code in ('LOC-07', 'LOC-12', 'LOC-13');

create table if not exists jur.templates (
  id uuid primary key default gen_random_uuid(), code text not null, version int not null, title text not null, body text not null,
  reviewed_by_lawyer text, reviewed_on date, reviewed_recorded_by uuid references auth.users(id), active boolean not null default true,
  created_at timestamptz not null default now(), unique (code, version),
  check ((reviewed_by_lawyer is null) = (reviewed_on is null))
);
create index if not exists jur_templates_by_idx on jur.templates (reviewed_recorded_by);

create sequence if not exists jur.cases_numero;
create table if not exists jur.cases (
  id uuid primary key default gen_random_uuid(), numero text not null unique default 'JUR-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('jur.cases_numero')::text, 3, '0'),
  kind text not null default 'recouvrement' check (kind in ('recouvrement')),
  lease_id uuid not null references public.leases(id), tenant_id uuid references public.tenants(id) on delete set null, owner_id uuid references public.owners(id) on delete set null,
  amount numeric(10,2) not null check (amount > 0), first_due date, stage text not null default 'ouvert' check (stage in ('ouvert', 'mise_en_demeure', 'tal', 'regle', 'ferme')),
  opened_by uuid references auth.users(id), opened_at timestamptz not null default now(), note text,
  tal_number text, tal_filed_at date, hearing_at timestamptz, closed_at timestamptz, close_reason text, updated_at timestamptz not null default now()
);
create unique index if not exists jur_un_dossier_ouvert_par_bail on jur.cases (lease_id) where stage in ('ouvert', 'mise_en_demeure', 'tal');
create index if not exists jur_cases_tenant_idx on jur.cases (tenant_id);
create index if not exists jur_cases_owner_idx on jur.cases (owner_id);
create index if not exists jur_cases_by_idx on jur.cases (opened_by);

create table if not exists jur.notices (
  id uuid primary key default gen_random_uuid(), case_id uuid not null references jur.cases(id) on delete cascade,
  template_id uuid not null references jur.templates(id), template_version int not null, body text not null, amount numeric(10,2) not null, delay_days int not null default 10,
  status text not null default 'draft' check (status in ('draft', 'approved', 'sent', 'cancelled')),
  proposal_id uuid references crm.proposals(id), approved_by uuid references auth.users(id), approved_at timestamptz,
  signer_name text, signed_at timestamptz, signature_simulated boolean not null default false, outbox_id uuid references comms.outbox(id), sent_at timestamptz,
  proof_mode text check (proof_mode in ('courriel', 'poste', 'huissier')), proof_detail text, result text check (result in ('paye', 'tal')), result_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (status in ('draft', 'cancelled') or approved_by is not null)        -- aucun envoi juridique sans approbation humaine
);
create unique index if not exists jur_une_mise_en_demeure_active on jur.notices (case_id) where status in ('draft', 'approved');
create index if not exists jur_notices_template_idx on jur.notices (template_id);
create index if not exists jur_notices_proposal_idx on jur.notices (proposal_id);
create index if not exists jur_notices_by_idx on jur.notices (approved_by);
create index if not exists jur_notices_outbox_idx on jur.notices (outbox_id);

alter table jur.templates enable row level security; alter table jur.cases enable row level security; alter table jur.notices enable row level security;
create policy "juridique lit les modeles" on jur.templates for select to authenticated using (crm.can('juridique.lire'));
create policy "juridique lit les dossiers" on jur.cases for select to authenticated using (crm.can('juridique.lire'));
create policy "juridique lit les mises en demeure" on jur.notices for select to authenticated using (crm.can('juridique.lire'));
revoke all on jur.templates, jur.cases, jur.notices from anon, authenticated;
grant select on jur.templates, jur.cases, jur.notices to authenticated; grant all on jur.templates, jur.cases, jur.notices to service_role;
comment on column jur.notices.body is 'RP · nom, adresse et dette du locataire · preuve de la mise en demeure · fin du dossier + 3 ans (à valider avec le juridique)';

-- Modèle v1 : brouillon de Lease Lane, NON révisé (inutilisable tant que l'avocate ne l'a pas révisé et qu'un admin ne l'a pas consigné).
insert into jur.templates (code, version, title, body) values ('mise_en_demeure_loyer', 1, 'Mise en demeure · loyer impayé',
'Québec, le {date_lettre}

{nom}
{adresse}

Objet : mise en demeure, loyer impayé

Madame, Monsieur,

Selon nos registres, le loyer {de_mois}, soit {montant}, demeure impayé à ce jour. Nous vous mettons en demeure de payer cette somme dans les {delai} suivant la réception de la présente.

À défaut, nous pourrons nous adresser au Tribunal administratif du logement, sans autre avis ni délai, pour obtenir le paiement de cette somme et, le cas échéant, la résiliation du bail.

{signataire}, pour Lease Lane, mandataire du locateur')
on conflict (code, version) do nothing;

create or replace function jur.rendre(p_body text, p_vars jsonb) returns text language plpgsql immutable set search_path = '' as $$
declare k text; v text; r text := p_body;
begin
  for k, v in select key, value from jsonb_each_text(p_vars) loop r := replace(r, '{' || k || '}', v); end loop;
  return r;
end $$;

-- « de mois » avec élision : d'octobre 2026, de novembre 2026; plusieurs mois reliés par « et ».
create or replace function jur.de_mois(p_dates date[]) returns text language sql immutable set search_path = '' as $$
  select string_agg(case when m in ('avril', 'août', 'octobre') then 'd’' else 'de ' end || m || ' ' || y, ' et ' order by d)
  from (select d, (array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'])[extract(month from d)::int] m, extract(year from d)::int y
        from unnest(p_dates) d) x
$$;

-- Loyers impayés d'un bail (échus, non payés).
create or replace function jur.impayes(p_lease uuid) returns table (montant numeric, premiere date, mois date[]) language sql stable security definer set search_path = '' as $$
  select sum(p.amount - coalesce(p.amount_received, 0)), min(p.due_date), array_agg(p.due_date order by p.due_date)
  from public.payments p where p.lease_id = p_lease and p.status <> 'paid' and p.due_date < current_date and p.amount > coalesce(p.amount_received, 0)
$$;

-- Ouvrir un dossier (e51, ou le cron à J+12). 409 si un dossier est déjà ouvert pour ce bail.
create or replace function jur.ouvrir_dossier(p_lease uuid, p_par uuid, p_note text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare l record; i record; v uuid;
begin
  select le.id, le.tenant_id, b.owner_id into l from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id where le.id = p_lease;
  if l.id is null then raise exception 'Bail introuvable.' using errcode = 'PT404'; end if;
  if exists (select 1 from jur.cases where lease_id = p_lease and stage in ('ouvert', 'mise_en_demeure', 'tal')) then
    raise exception 'Un dossier est déjà ouvert pour ce bail.' using errcode = 'PT409';
  end if;
  select * into i from jur.impayes(p_lease);
  if coalesce(i.montant, 0) <= 0 then raise exception 'Aucun loyer impayé à ce bail.' using errcode = 'PT422'; end if;
  insert into jur.cases (lease_id, tenant_id, owner_id, amount, first_due, opened_by, note) values (p_lease, l.tenant_id, l.owner_id, i.montant, i.premiere, p_par, nullif(btrim(p_note), ''))
  returning id into v;
  perform crm.journal('legal_case.opened', 'jur.cases', v, null, jsonb_build_object('montant', i.montant), 'create-legal-case', case when p_par is null then 'cron' else 'interface' end);
  return v;
end $$;

-- Rédaction (agent « redaction ») : remplit le modèle RÉVISÉ avec les valeurs du dossier et dépose une proposition dans « À approuver ».
create or replace function jur.rediger_mise_en_demeure(p_case uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare c jur.cases; t jur.templates; i record; d record; v uuid; s record; mois text[] := array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
begin
  select * into c from jur.cases where id = p_case and stage in ('ouvert', 'mise_en_demeure') for update;
  if not found then raise exception 'Dossier introuvable ou au TAL.' using errcode = 'PT409'; end if;
  select * into t from jur.templates where code = 'mise_en_demeure_loyer' and active and reviewed_by_lawyer is not null order by version desc limit 1;
  if not found then raise exception 'Modèle « Loyer impayé » non révisé par l’avocate : il ne peut pas servir.' using errcode = 'PT422'; end if;
  select * into i from jur.impayes(c.lease_id);
  if coalesce(i.montant, 0) <= 0 then raise exception 'Plus aucun loyer impayé : rien à mettre en demeure.' using errcode = 'PT422'; end if;
  select tn.full_name, b.address || coalesce(', logement ' || u.unit_number, '') as adresse into d
    from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id left join public.tenants tn on tn.id = le.tenant_id where le.id = c.lease_id;
  select * into s from crm.signataire_admin();
  insert into jur.notices (case_id, template_id, template_version, amount, signer_name, body)
  values (c.id, t.id, t.version, i.montant, s.nom, jur.rendre(t.body, jsonb_build_object(
    'date_lettre', extract(day from now() at time zone 'America/Toronto')::int || case when extract(day from now() at time zone 'America/Toronto') = 1 then 'er' else '' end || ' '
                   || mois[extract(month from now() at time zone 'America/Toronto')::int] || ' ' || extract(year from now() at time zone 'America/Toronto'),
    'nom', d.full_name, 'adresse', d.adresse, 'de_mois', jur.de_mois(i.mois), 'montant', comms.montant_court(i.montant), 'delai', '10 jours', 'signataire', s.nom)))
  returning id into v;
  update jur.cases set amount = i.montant, updated_at = now() where id = c.id;
  perform crm.create_proposal(jsonb_build_object('agent', 'redaction', 'operation', 'approve-formal-notice', 'target_id', v,
    'after', (select jsonb_build_object('body', body, 'amount', amount) from jur.notices where id = v),
    'reason', 'Loyer impayé depuis le ' || to_char(i.premiere, 'DD/MM') || ' (' || comms.montant_court(i.montant) || ') : mise en demeure rédigée à partir du modèle révisé « ' || t.title || ' » v' || t.version || '.',
    'source_type', 'systeme', 'source_ref', c.numero, 'assignee_role', 'gestionnaire', 'confidence', 100, 'idempotency_key', 'mise-en-demeure:' || v, 'channel', 'cron'));
  update jur.notices set proposal_id = (select id from crm.proposals where idempotency_key = 'mise-en-demeure:' || v) where id = v;
  return v;
end $$;

-- Appliquée par approve_proposal SEULEMENT (une personne a décidé) : texte final, approbation. L'envoi suit (fonction « juridique »).
create or replace function jur.appliquer_mise_en_demeure(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare n jur.notices;
begin
  if coalesce(current_setting('crm.via_proposal', true), '') <> 'on' or auth.uid() is null then
    raise exception 'Une mise en demeure n’est approuvée que par une personne, depuis « À approuver ».' using errcode = 'PT403';
  end if;
  select * into n from jur.notices where id = (p ->> 'id')::uuid for update;
  if n.status <> 'draft' then raise exception 'Cette mise en demeure n’est plus un brouillon.' using errcode = 'PT409'; end if;
  if char_length(btrim(coalesce(p ->> 'body', n.body))) < 200 then raise exception 'Texte de la lettre trop court.' using errcode = 'PT422'; end if;
  update jur.notices set status = 'approved', body = coalesce(p ->> 'body', body), amount = coalesce((p ->> 'amount')::numeric, amount), approved_by = auth.uid(), approved_at = now(), updated_at = now()
   where id = n.id;
  update jur.cases set stage = 'mise_en_demeure', updated_at = now() where id = n.case_id;
  return jsonb_build_object('notice_id', n.id);
end $$;
insert into crm.operation_registry (name, sql_function, target_table, permission, espace, proposable, field_labels)
values ('approve-formal-notice', 'jur.appliquer_mise_en_demeure(jsonb)', 'jur.notices', 'juridique.ecrire', 'juridique', true, '{"body": "Texte de la lettre", "amount": "Montant réclamé"}')
on conflict (name) do nothing;

-- Envoi (fonction « juridique », clé de service) après la signature : LOC-07 en file (fenêtre du gabarit : jour ouvrable, 9 h–17 h).
create or replace function public.service_envoyer_mise_en_demeure(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare n jur.notices; c jur.cases; t record; o comms.outbox; i record;
begin
  select * into n from jur.notices where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Mise en demeure introuvable.' using errcode = 'PT404'; end if;
  if n.status <> 'approved' or n.approved_by is null then raise exception 'Aucun envoi juridique sans approbation humaine.' using errcode = 'PT422'; end if;
  select * into c from jur.cases where id = n.case_id;
  select tn.full_name, tn.email into t from public.tenants tn where tn.id = c.tenant_id;
  if coalesce(t.email, '') = '' then raise exception 'Aucun courriel pour ce locataire : signifiez par la poste recommandée ou un huissier.' using errcode = 'PT422'; end if;
  select * into i from jur.impayes(c.lease_id);
  o := comms.enqueue(jsonb_build_object('template_code', 'LOC-07', 'channel', 'email', 'recipient', t.email, 'entity_type', 'jur.notices', 'entity_id', n.id, 'canal_journal', 'interface',
    'idempotency_key', 'loc07:' || n.id,
    'vars', jsonb_build_object('formule', t.full_name, 'de_mois', jur.de_mois(i.mois), 'montant', comms.montant_court(n.amount), 'delai_paiement', n.delay_days || ' jours',
      'numero_dossier', c.numero, 'signataire', n.signer_name, 'initiales_signataire', upper(left(split_part(n.signer_name, ' ', 1), 1) || left(split_part(n.signer_name, ' ', 2), 1)),
      'lien_paiement', 'https://app.leaselane.ca/?p=locataire')));
  update jur.notices set status = 'sent', signed_at = now(), signature_simulated = coalesce((p ->> 'simulated')::boolean, false), outbox_id = o.id, sent_at = o.scheduled_for,
    proof_mode = 'courriel', updated_at = now() where id = n.id;
  perform crm.journal('formal_notice.sent', 'jur.notices', n.id, null, jsonb_build_object('outbox', o.id, 'prevu', o.scheduled_for), 'send-formal-notice', 'api', null, 'system');
  return jsonb_build_object('outbox_id', o.id, 'scheduled_for', o.scheduled_for);
end $$;

-- Porte de l'envoi (jeton de la personne) : droit, 2FA, mise en demeure approuvée.
create or replace function public.lanceur_peut_envoyer_mise_en_demeure(p_id uuid) returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('juridique.ecrire') then raise exception 'Votre rôle ne permet pas d’envoyer une mise en demeure.' using errcode = 'PT403'; end if;
  if not exists (select 1 from jur.notices where id = p_id and status = 'approved' and approved_by is not null) then
    raise exception 'Aucun envoi juridique sans approbation humaine : approuvez d’abord la mise en demeure.' using errcode = 'PT422';
  end if;
  return true;
end $$;
revoke all on function public.lanceur_peut_envoyer_mise_en_demeure(uuid) from public, anon;
grant execute on function public.lanceur_peut_envoyer_mise_en_demeure(uuid) to authenticated;

-- Preuve d'envoi complémentaire (poste recommandée, huissier).
create or replace function public.lanceur_preuve_mise_en_demeure(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('juridique.ecrire') then raise exception 'Votre rôle ne permet pas de consigner une preuve.' using errcode = 'PT403'; end if;
  if p ->> 'mode' not in ('poste', 'huissier') or coalesce(btrim(p ->> 'detail'), '') = '' then raise exception 'Mode (poste ou huissier) et détail requis.' using errcode = 'PT422'; end if;
  update jur.notices set proof_mode = p ->> 'mode', proof_detail = btrim(p ->> 'detail'), updated_at = now() where id = (p ->> 'id')::uuid and status = 'sent';
  if not found then raise exception 'Mise en demeure introuvable ou pas encore envoyée.' using errcode = 'PT409'; end if;
  perform crm.journal('formal_notice.proof', 'jur.notices', (p ->> 'id')::uuid, null, p, 'record-notice-proof');
end $$;

-- TAL : dépôt (numéro, date) et audience. Le dossier passe au TAL; la mise en demeure envoyée porte le résultat « TAL ».
create or replace function public.lanceur_dossier_tal(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare c jur.cases;
begin
  perform crm.require_aal2();
  if not crm.can('juridique.ecrire') then raise exception 'Votre rôle ne permet pas de déposer au TAL.' using errcode = 'PT403'; end if;
  select * into c from jur.cases where id = (p ->> 'case_id')::uuid for update;
  if c.stage not in ('mise_en_demeure', 'tal', 'ouvert') then raise exception 'Dossier fermé.' using errcode = 'PT409'; end if;
  if coalesce(btrim(p ->> 'numero'), '') = '' and c.tal_number is null then raise exception 'Numéro de dossier du TAL requis.' using errcode = 'PT422'; end if;
  update jur.cases set stage = 'tal', tal_number = coalesce(nullif(btrim(p ->> 'numero'), ''), tal_number), tal_filed_at = coalesce((p ->> 'depot')::date, tal_filed_at, current_date),
    hearing_at = coalesce((p ->> 'audience')::timestamptz, hearing_at), updated_at = now() where id = c.id;
  update jur.notices set result = 'tal', result_at = now(), updated_at = now() where case_id = c.id and status = 'sent' and result is null;
  perform crm.journal('legal_case.tal', 'jur.cases', c.id, to_jsonb(c), p, 'update-legal-case');
end $$;

-- Loyer payé → dossier réglé, résultat « payé ».
create or replace function jur.loyer_paye() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' and coalesce((select montant from jur.impayes(new.lease_id)), 0) <= 0 then
    update jur.notices set result = 'paye', result_at = now(), updated_at = now()
     where case_id in (select id from jur.cases where lease_id = new.lease_id and stage in ('ouvert', 'mise_en_demeure')) and status = 'sent' and result is null;
    update jur.notices set status = 'cancelled', updated_at = now()
     where case_id in (select id from jur.cases where lease_id = new.lease_id and stage in ('ouvert', 'mise_en_demeure')) and status in ('draft', 'approved');
    update crm.proposals set status = 'expired', apply_error = 'loyer payé', updated_at = now()
     where status = 'pending' and id in (select n.proposal_id from jur.notices n join jur.cases c on c.id = n.case_id where c.lease_id = new.lease_id);
    update jur.cases set stage = 'regle', closed_at = now(), close_reason = 'Loyer payé', updated_at = now() where lease_id = new.lease_id and stage in ('ouvert', 'mise_en_demeure');
  end if;
  return new;
end $$;
drop trigger if exists jur_loyer_paye on public.payments;
create trigger jur_loyer_paye after update of status on public.payments for each row execute function jur.loyer_paye();

-- Cron quotidien (INACTIF par défaut) : à J+12, dossier ouvert et mise en demeure proposée.
create or replace function jur.rediger_echues() returns int language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0; v uuid;
begin
  if coalesce((select valeur from config.parametres where cle = 'juridique_auto'), 'false'::jsonb) <> 'true'::jsonb then return 0; end if;
  if not exists (select 1 from jur.templates where code = 'mise_en_demeure_loyer' and active and reviewed_by_lawyer is not null) then return 0; end if;
  for r in select distinct p.lease_id from public.payments p join public.leases l on l.id = p.lease_id
            where l.status = 'active' and p.status <> 'paid' and not coalesce(p.reminder_paused, false) and p.due_date <= current_date - 12
              and not exists (select 1 from jur.cases c where c.lease_id = p.lease_id and c.stage in ('ouvert', 'mise_en_demeure', 'tal')) loop
    v := jur.ouvrir_dossier(r.lease_id, null);
    perform jur.rediger_mise_en_demeure(v); n := n + 1;
  end loop;
  return n;
end $$;
do $$ begin
  if exists (select 1 from cron.job where jobname = 'juridique-echues') then perform cron.unschedule('juridique-echues'); end if;
  perform cron.schedule('juridique-echues', '0 14 * * 1-5', 'select jur.rediger_echues()');
end $$;

-- ── Portes de l'interface ──
create or replace function public.lanceur_ouvrir_dossier(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v uuid;
begin
  perform crm.require_aal2();
  if not crm.can('juridique.ecrire') then raise exception 'Votre rôle ne permet pas d’ouvrir un dossier.' using errcode = 'PT403'; end if;
  v := jur.ouvrir_dossier((p ->> 'lease_id')::uuid, auth.uid(), p ->> 'note');
  return jsonb_build_object('id', v);
end $$;
create or replace function public.lanceur_rediger_mise_en_demeure(p_case uuid) returns uuid language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('juridique.ecrire') then raise exception 'Votre rôle ne permet pas de demander une mise en demeure.' using errcode = 'PT403'; end if;
  return jur.rediger_mise_en_demeure(p_case);
end $$;
create or replace function public.lanceur_fermer_dossier(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('juridique.ecrire') then raise exception 'Votre rôle ne permet pas de fermer un dossier.' using errcode = 'PT403'; end if;
  if coalesce(btrim(p ->> 'raison'), '') = '' then raise exception 'Raison de la fermeture requise (entente, jugement…).' using errcode = 'PT422'; end if;
  update jur.cases set stage = 'ferme', closed_at = now(), close_reason = btrim(p ->> 'raison'), updated_at = now() where id = (p ->> 'case_id')::uuid and stage in ('ouvert', 'mise_en_demeure', 'tal');
  if not found then raise exception 'Dossier introuvable ou déjà fermé.' using errcode = 'PT409'; end if;
  update jur.notices set status = 'cancelled', updated_at = now() where case_id = (p ->> 'case_id')::uuid and status in ('draft', 'approved');
  perform crm.journal('legal_case.closed', 'jur.cases', (p ->> 'case_id')::uuid, null, p, 'close-legal-case');
end $$;
-- Révision par l'avocate, consignée par un admin (nom de l'avocate, date). Une nouvelle version repart non révisée.
create or replace function public.lanceur_reviser_modele(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if crm.role_actuel() <> 'admin' then raise exception 'Seul un admin consigne la révision de l’avocate.' using errcode = 'PT403'; end if;
  if coalesce(btrim(p ->> 'avocate'), '') = '' or (p ->> 'le') is null then raise exception 'Nom de l’avocate et date de la révision requis.' using errcode = 'PT422'; end if;
  update jur.templates set reviewed_by_lawyer = btrim(p ->> 'avocate'), reviewed_on = (p ->> 'le')::date, reviewed_recorded_by = auth.uid() where id = (p ->> 'id')::uuid and reviewed_by_lawyer is null;
  if not found then raise exception 'Modèle introuvable ou déjà révisé.' using errcode = 'PT409'; end if;
  perform crm.journal('legal_template.reviewed', 'jur.templates', (p ->> 'id')::uuid, null, p, 'update-legal-template');
end $$;
create or replace function public.lanceur_nouvelle_version_modele(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare t jur.templates; v uuid;
begin
  perform crm.require_aal2();
  if not crm.can('juridique.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un modèle.' using errcode = 'PT403'; end if;
  select * into t from jur.templates where id = (p ->> 'id')::uuid;
  if char_length(btrim(coalesce(p ->> 'body', ''))) < 200 then raise exception 'Texte du modèle trop court.' using errcode = 'PT422'; end if;
  insert into jur.templates (code, version, title, body) values (t.code, (select max(version) + 1 from jur.templates where code = t.code), t.title, btrim(p ->> 'body')) returning id into v;
  perform crm.journal('legal_template.versioned', 'jur.templates', v, null, jsonb_build_object('depuis', t.version), 'update-legal-template');
  return v;
end $$;

-- Lecture (l16, e46–e49) : dossiers, mises en demeure, TAL, modèles, rappels en cours.
create or replace function public.lanceur_juridique() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('juridique.lire') then raise exception 'Votre rôle ne donne pas accès au juridique.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'dossiers', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'numero', c.numero, 'etape', c.stage, 'montant', c.amount, 'premiere', c.first_due, 'ouvert', c.opened_at,
        'locataire', tn.full_name, 'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'fin_bail', le.end_date, 'loyer', le.monthly_rent,
        'tal', c.tal_number, 'depot', c.tal_filed_at, 'audience', c.hearing_at, 'ferme', c.closed_at, 'raison', c.close_reason, 'note', c.note,
        'retards', (select jsonb_agg(jsonb_build_object('mois', to_char(m, 'YYYY-MM'), 'jours',
            coalesce((select max(case when p.paid_date is not null then greatest(0, p.paid_date - p.due_date) when p.status <> 'paid' then greatest(0, current_date - p.due_date) else 0 end)
                      from public.payments p where p.lease_id = c.lease_id and date_trunc('month', p.due_date) = m), 0)) order by m)
            from generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') m),
        'rappels', (select jsonb_agg(jsonb_build_object('gabarit', o.template_code, 'canal', o.channel, 'statut', o.status, 'le', coalesce(o.sent_at, o.scheduled_for)) order by o.created_at)
            from comms.outbox o where o.template_code in ('LOC-05', 'LOC-06') and o.vars ->> 'adresse_logement' = b.address || coalesce(' — ' || u.unit_number, '') and o.created_at >= c.first_due),
        'mise_en_demeure', (select jsonb_build_object('id', n.id, 'statut', n.status, 'texte', n.body, 'montant', n.amount, 'version', n.template_version, 'modele', t.title,
            'revise_par', t.reviewed_by_lawyer, 'revise_le', t.reviewed_on, 'proposition', n.proposal_id, 'proposition_statut', pr.status, 'redigee', n.created_at,
            'approuvee_par', crm.nom_membre(n.approved_by), 'envoyee', n.sent_at, 'envoi', o.status, 'preuve', n.proof_mode, 'preuve_detail', n.proof_detail, 'resultat', n.result,
            'verifs', jsonb_build_object('montant', n.amount = (select montant from jur.impayes(c.lease_id)), 'adresse', position(b.address in n.body) > 0 and position(tn.full_name in n.body) > 0,
              'delai', n.body ~ '10 jours', 'signature', n.signed_at is not null))
            from jur.notices n join jur.templates t on t.id = n.template_id left join crm.proposals pr on pr.id = n.proposal_id left join comms.outbox o on o.id = n.outbox_id
            where n.case_id = c.id and n.status <> 'cancelled' order by n.created_at desc limit 1))
      order by case c.stage when 'mise_en_demeure' then 0 when 'ouvert' then 1 when 'tal' then 2 else 3 end, c.opened_at desc)
      from jur.cases c join public.leases le on le.id = c.lease_id join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id
      left join public.tenants tn on tn.id = c.tenant_id where c.stage in ('ouvert', 'mise_en_demeure', 'tal') or c.updated_at > now() - interval '120 days'), '[]'::jsonb),
    'envoyees', coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'locataire', tn.full_name, 'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'montant', n.amount,
        'envoyee', n.sent_at, 'preuve', n.proof_mode, 'preuve_detail', n.proof_detail, 'envoi', o.status, 'livre', o.sent_at, 'resultat', n.result, 'resultat_le', n.result_at, 'audience', c.hearing_at)
      order by n.sent_at desc) from jur.notices n join jur.cases c on c.id = n.case_id join public.leases le on le.id = c.lease_id join public.units u on u.id = le.unit_id
      join public.buildings b on b.id = u.building_id left join public.tenants tn on tn.id = c.tenant_id left join comms.outbox o on o.id = n.outbox_id where n.status = 'sent'), '[]'::jsonb),
    'modeles', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'code', t.code, 'version', t.version, 'titre', t.title, 'texte', t.body, 'avocate', t.reviewed_by_lawyer, 'le', t.reviewed_on,
        'utilisations', (select count(*) from jur.notices n where n.template_id = t.id and n.status = 'sent')) order by t.code, t.version desc) from jur.templates t where t.active), '[]'::jsonb),
    'retards', coalesce((select jsonb_agg(jsonb_build_object('lease_id', x.lease_id, 'logement', x.logement, 'locataire', x.locataire, 'montant', x.montant, 'jours', x.jours, 'dossier', x.dossier) order by x.jours desc)
      from (select p.lease_id, b.address || coalesce(' — ' || u.unit_number, '') as logement, tn.full_name as locataire, sum(p.amount - coalesce(p.amount_received, 0)) as montant,
                   max(current_date - p.due_date) as jours, (select c.numero from jur.cases c where c.lease_id = p.lease_id and c.stage in ('ouvert', 'mise_en_demeure', 'tal')) as dossier
            from public.payments p join public.leases le on le.id = p.lease_id join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id left join public.tenants tn on tn.id = le.tenant_id
            where p.status <> 'paid' and p.due_date < current_date and le.status = 'active' group by p.lease_id, b.address, u.unit_number, tn.full_name) x), '[]'::jsonb),
    'auto', coalesce((select valeur from config.parametres where cle = 'juridique_auto'), 'false'::jsonb) = 'true'::jsonb,
    'est_admin', crm.role_actuel() = 'admin', 'peut_ecrire', crm.can('juridique.ecrire'));
end $$;

revoke all on function jur.rendre(text, jsonb), jur.de_mois(date[]), jur.impayes(uuid), jur.ouvrir_dossier(uuid, uuid, text), jur.rediger_mise_en_demeure(uuid),
  jur.appliquer_mise_en_demeure(jsonb), jur.loyer_paye(), jur.rediger_echues() from public, anon, authenticated;
grant execute on function jur.appliquer_mise_en_demeure(jsonb), jur.rediger_mise_en_demeure(uuid), jur.rediger_echues() to service_role;
revoke all on function public.service_envoyer_mise_en_demeure(jsonb) from public, anon, authenticated;
grant execute on function public.service_envoyer_mise_en_demeure(jsonb) to service_role;
revoke all on function public.lanceur_preuve_mise_en_demeure(jsonb), public.lanceur_dossier_tal(jsonb), public.lanceur_ouvrir_dossier(jsonb), public.lanceur_rediger_mise_en_demeure(uuid),
  public.lanceur_fermer_dossier(jsonb), public.lanceur_reviser_modele(jsonb), public.lanceur_nouvelle_version_modele(jsonb), public.lanceur_juridique() from public, anon;
grant execute on function public.lanceur_preuve_mise_en_demeure(jsonb), public.lanceur_dossier_tal(jsonb), public.lanceur_ouvrir_dossier(jsonb), public.lanceur_rediger_mise_en_demeure(uuid),
  public.lanceur_fermer_dossier(jsonb), public.lanceur_reviser_modele(jsonb), public.lanceur_nouvelle_version_modele(jsonb), public.lanceur_juridique() to authenticated;
