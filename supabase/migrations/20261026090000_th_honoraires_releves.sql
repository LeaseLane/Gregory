-- TH · Jalon 1 : honoraires paramétrés et datés, relevé mensuel figé et facture d'honoraires émis le 5 (#26, #26b; PRO-05, PRO-06).
-- Règle du 13 oct. (Steven) : 6 % des loyers payés au propriétaire; travaux : AUCUN honoraire à 1 000 $ ou moins, au-delà 10 % de la facture
-- complète AVANT TAXES, sans plafond ni exception (aucun forfait, aucun taux négocié). Taux et seuil pris à la date de la facture (ou du loyer).
--   • config.fee_parameters : une ligne par période (valid_from); validée par une personne.
--   • work_orders.invoice_subtotal_cents : montant avant taxes de la facture du fournisseur (assiette des honoraires). À défaut, l'estimation
--     (avant taxes) sert, et la ligne est marquée « estimée ».
--   • fin.owner_statements : relevé du mois FIGÉ au moment de l'émission (le 5), lié à la facture public.invoices (numérotation et écriture
--     comptable existantes). Rien n'alimente reports.net_due_to_owner : il n'y a ni « net » ni « versement ».

create schema if not exists fin;
grant usage on schema fin to authenticated, service_role;

create table if not exists config.fee_parameters (
  id uuid primary key default gen_random_uuid(), valid_from date not null unique,
  gestion_pct numeric(5,2) not null check (gestion_pct between 0 and 100), travaux_seuil numeric(10,2) not null check (travaux_seuil >= 0),
  travaux_pct numeric(5,2) not null check (travaux_pct between 0 and 100), source text not null,
  validated_by uuid references auth.users(id) on delete set null, validated_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists fee_parameters_by_idx on config.fee_parameters (validated_by);
alter table config.fee_parameters enable row level security;
drop policy if exists "equipe lit les parametres d'honoraires" on config.fee_parameters;
create policy "equipe lit les parametres d'honoraires" on config.fee_parameters for select to authenticated using (crm.is_team_member());
revoke all on config.fee_parameters from anon, authenticated; grant select on config.fee_parameters to authenticated; grant all on config.fee_parameters to service_role;
insert into config.fee_parameters (valid_from, gestion_pct, travaux_seuil, travaux_pct, source, validated_at)
values ('2026-01-01', 6, 1000, 10, 'Décision de Steven du 13 oct. 2026 (ordre-des-tranches.md, choix par défaut)', now()) on conflict (valid_from) do nothing;

-- Paramètres en vigueur à une date (dernière ligne validée).
create or replace function crm.parametres_honoraires(p_date date) returns config.fee_parameters language sql stable security definer set search_path = '' as $$
  select * from config.fee_parameters where valid_from <= p_date and validated_at is not null order by valid_from desc limit 1
$$;
-- Honoraires sur une facture de travaux : 0 $ si le montant avant taxes est au seuil ou sous le seuil; sinon le taux sur la facture COMPLÈTE.
create or replace function crm.honoraire_travaux(p_avant_taxes numeric, p_date date) returns numeric language sql stable security definer set search_path = '' as $$
  select case when p_avant_taxes is null or p_avant_taxes <= f.travaux_seuil then 0 else round(p_avant_taxes * f.travaux_pct / 100, 2) end
  from crm.parametres_honoraires(p_date) f
$$;

alter table public.work_orders add column if not exists invoice_subtotal_cents bigint check (invoice_subtotal_cents is null or invoice_subtotal_cents >= 0);
comment on column public.work_orders.invoice_subtotal_cents is 'Facture du fournisseur avant taxes (assiette des honoraires sur travaux).';

-- Écritures d'un mois : loyers payés chez le propriétaire, honoraires de gestion (taux du mois), travaux (TTC) et honoraires sur travaux
-- (avant taxes, au taux de la date de la facture).
create or replace function crm.ecritures_proprio(p_owner uuid, p_mois date) returns table (le date, libelle text, categorie text, montant numeric, immeuble text, ref text)
language sql stable security definer set search_path = '' as $$
  with g as (select gestion_pct / 100 as t from crm.parametres_honoraires((date_trunc('month', p_mois) + interval '1 month - 1 day')::date)),
  loyers as (
    select max(p.paid_date) as le, b.address as immeuble, sum(p.amount_received) as m, bool_or(p.amount_received < p.amount) as partiel
    from public.payments p join public.leases l on l.id = p.lease_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
    where b.owner_id = p_owner and p.status = 'paid' and date_trunc('month', p.due_date) = date_trunc('month', p_mois) group by b.address),
  travaux as (
    select coalesce(w.worker_reported_done_at::date, w.created_at::date) as le, b.address as immeuble, coalesce(wk.company_name, wk.name, 'Fournisseur') as qui,
           coalesce(w.invoice_total_cents / 100.0, w.estimated_cost) as ttc, coalesce(w.invoice_subtotal_cents / 100.0, w.estimated_cost) as ht, w.invoice_subtotal_cents is null as estime,
           'DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)) as ref
    from public.work_orders w join public.units u on u.id = w.unit_id join public.buildings b on b.id = u.building_id left join public.workers wk on wk.id = w.worker_id
    left join public.service_requests sr on sr.id = w.service_request_id
    where b.owner_id = p_owner and w.status = 'completed' and date_trunc('month', coalesce(w.worker_reported_done_at, w.created_at)) = date_trunc('month', p_mois))
  select le, 'Loyers payés chez vous — ' || immeuble, case when partiel then 'Loyer partiel' else 'Loyers' end, m, immeuble, null from loyers
  union all select (date_trunc('month', p_mois) + interval '1 month 4 days')::date, 'Honoraires de gestion ' || trim(to_char((select t from g) * 100, 'FM990.##')) || ' %', 'Honoraires',
    -round(coalesce((select sum(m) from loyers), 0) * (select t from g), 2), null, null where exists (select 1 from loyers)
  union all select le, qui || coalesce(' — ' || ref, ''), 'Entretien', -ttc, immeuble, ref from travaux where ttc is not null
  union all select le, 'Honoraires sur travaux ' || trim(to_char(f.travaux_pct, 'FM990.##')) || ' % (facture de ' || trim(to_char(ht, 'FM999G990D00')) || ' $ avant taxes' || case when estime then ', estimée' else '' end || ') — ' || coalesce(ref, qui),
    'Coordination', -crm.honoraire_travaux(ht, le), immeuble, ref
    from travaux cross join lateral crm.parametres_honoraires(le) f where crm.honoraire_travaux(ht, le) > 0
$$;

-- Facture d'honoraires d'un mois (taxes de la fiche d'entreprise).
create or replace function crm.facture_honoraires(p_owner uuid, p_mois date) returns jsonb language sql stable security definer set search_path = '' as $$
  with e as (select -coalesce(sum(montant) filter (where categorie = 'Honoraires'), 0) as hon, -coalesce(sum(montant) filter (where categorie = 'Coordination'), 0) as coord from crm.ecritures_proprio(p_owner, p_mois)),
  t as (select coalesce((select gst_rate from public.company_settings where id), 5) / 100 as tps, coalesce((select qst_rate from public.company_settings where id), 9.975) / 100 as tvq)
  select jsonb_build_object('honoraires', e.hon, 'coordination', e.coord, 'sous_total', e.hon + e.coord, 'tps', round((e.hon + e.coord) * t.tps, 2), 'tvq', round((e.hon + e.coord) * t.tvq, 2),
    'total', e.hon + e.coord + round((e.hon + e.coord) * t.tps, 2) + round((e.hon + e.coord) * t.tvq, 2)) from e, t
$$;

create table if not exists fin.owner_statements (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.owners(id) on delete cascade, mois date not null check (mois = date_trunc('month', mois)::date),
  numero text not null unique, lignes jsonb not null, facture jsonb not null, invoice_id uuid references public.invoices(id) on delete set null,
  emis_le timestamptz not null default now(), pro05_outbox_id uuid references comms.outbox(id) on delete set null, pro06_outbox_id uuid references comms.outbox(id) on delete set null,
  unique (owner_id, mois)
);
create index if not exists owner_statements_invoice_idx on fin.owner_statements (invoice_id);
create index if not exists owner_statements_pro05_idx on fin.owner_statements (pro05_outbox_id);
create index if not exists owner_statements_pro06_idx on fin.owner_statements (pro06_outbox_id);
alter table fin.owner_statements enable row level security;
drop policy if exists "releves lus par le proprietaire et l'equipe" on fin.owner_statements;
create policy "releves lus par le proprietaire et l'equipe" on fin.owner_statements for select to authenticated using (owner_id = public.auth_owner_id() or crm.can('finances.lire'));
revoke all on fin.owner_statements from anon, authenticated; grant select on fin.owner_statements to authenticated; grant all on fin.owner_statements to service_role;

-- PRO-05 (relevé) et PRO-06 (facture d'honoraires, remplace « Versement effectué ») avec variables.
update comms.email_templates t set name = v.name, contenu = v.contenu::jsonb, subject = v.subject, preheader = v.preheader, variables = v.variables, trigger_event = 'Le 5 du mois', essential = true,
  lcap_category = 'transactional', active = true
from (values
 ('PRO-05', 'Relevé mensuel', '{"subject": "Votre relevé de {mois}", "pre": "Loyers payés chez vous : {loyers}. Honoraires facturés : {honoraires}.", "label": "Relevé mensuel", "icon": "chart", "eyebrow": "Relevé du mois", "title": "{prenom}, votre relevé de {mois} est prêt", "intro": "Les loyers sont payés directement chez vous; Lease Lane les suit et les relance. Voici le résumé du mois.", "blocks": [["kv", {"rows": [["Loyers payés chez vous", "{loyers}"], ["Travaux du mois (taxes incluses)", "{travaux}"], ["Honoraires facturés (avant taxes)", "{honoraires}"]]}], ["notice", {"k": "info", "ic": "file", "title": "Facture d’honoraires", "t": "Elle suit dans un courriel distinct (numéro {facture})."}]], "cta": {"l": "Voir mon relevé", "href": "{lien}"}, "sign": {"ini": "LL", "name": "Lease Lane", "role": "Gestion immobilière"}, "foot": {"reason": "Vous recevez ce relevé parce que Lease Lane gère vos immeubles."}, "spec": {"trigger": "Le 5 du mois", "send": "Automatique", "when": "Le 5, 8 h", "lcap": "Transactionnel"}}',
  'Votre relevé de {mois}', 'Loyers payés chez vous : {loyers}. Honoraires facturés : {honoraires}.', array['facture', 'honoraires', 'lien', 'loyers', 'mois', 'prenom', 'travaux']::text[]),
 ('PRO-06', 'Facture d’honoraires', '{"subject": "Facture d’honoraires {facture} : {total}", "pre": "Honoraires de {mois}, taxes incluses.", "label": "Facture", "icon": "receipt", "eyebrow": "Facture d’honoraires", "title": "Facture {facture}", "intro": "{prenom}, voici la facture de nos honoraires pour {mois}.", "blocks": [["kv", {"rows": [["Honoraires de gestion", "{gestion}"], ["Honoraires sur travaux (factures de plus de 1 000 $)", "{coordination}"], ["TPS", "{tps}"], ["TVQ", "{tvq}"], ["Total", "{total}"]]}], ["notice", {"k": "info", "ic": "lock", "title": "Aucun montant retenu", "t": "Lease Lane ne détient pas vos loyers : cette facture est la seule somme due."}]], "cta": {"l": "Voir la facture", "href": "{lien}"}, "sign": {"ini": "LL", "name": "Lease Lane", "role": "Facturation"}, "foot": {"reason": "Vous recevez cette facture parce que Lease Lane gère vos immeubles."}, "spec": {"trigger": "Le 5 du mois", "send": "Automatique", "when": "Le 5, 8 h", "lcap": "Transactionnel"}}',
  'Facture d’honoraires {facture} : {total}', 'Honoraires de {mois}, taxes incluses.', array['coordination', 'facture', 'gestion', 'lien', 'mois', 'prenom', 'total', 'tps', 'tvq']::text[])
) v(code, name, contenu, subject, preheader, variables) where t.code = v.code;

-- Émission du 5 : pour chaque propriétaire qui a une activité dans le mois précédent, relevé figé + facture (numérotation existante) +
-- PRO-05 et PRO-06. Idempotent (un relevé par propriétaire et par mois).
create or replace function crm.emettre_releves(p_mois date default null) returns int language plpgsql security definer set search_path = '' as $$
declare v_m date := coalesce(date_trunc('month', p_mois)::date, (date_trunc('month', current_date) - interval '1 month')::date); o record; f jsonb; v_inv uuid; s fin.owner_statements;
  n int := 0; v_mois text; v_mail text; v_fmt text;
begin
  v_mois := (array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'])[extract(month from v_m)::int] || ' ' || extract(year from v_m);
  for o in select ow.id, ow.full_name from public.owners ow where exists (select 1 from crm.ecritures_proprio(ow.id, v_m))
             and not exists (select 1 from fin.owner_statements st where st.owner_id = ow.id and st.mois = v_m) loop
    f := crm.facture_honoraires(o.id, v_m);
    v_inv := null;
    if (f ->> 'sous_total')::numeric > 0 then
      insert into public.invoices (owner_id, invoice_number, period_start, period_end, management_fee_amount, coordination_fees_amount, subtotal, gst_amount, qst_amount, total_amount)
      values (o.id, public.next_invoice_number(to_char(v_m, 'YYYY')), v_m, (v_m + interval '1 month - 1 day')::date, (f ->> 'honoraires')::numeric, (f ->> 'coordination')::numeric,
              (f ->> 'sous_total')::numeric, (f ->> 'tps')::numeric, (f ->> 'tvq')::numeric, (f ->> 'total')::numeric)
      on conflict (owner_id, period_start, period_end) do nothing returning id into v_inv;
      if v_inv is null then select id into v_inv from public.invoices where owner_id = o.id and period_start = v_m; end if;
    end if;
    insert into fin.owner_statements (owner_id, mois, numero, lignes, facture, invoice_id)
    values (o.id, v_m, 'REL-' || to_char(v_m, 'YYYY-MM') || '-' || upper(left(o.id::text, 3)),
            coalesce((select jsonb_agg(jsonb_build_object('libelle', e.libelle, 'categorie', e.categorie, 'le', e.le, 'montant', e.montant, 'immeuble', e.immeuble) order by e.categorie <> 'Loyers', e.categorie <> 'Loyer partiel', e.le)
              from crm.ecritures_proprio(o.id, v_m) e), '[]'::jsonb),
            f || jsonb_build_object('numero', (select invoice_number from public.invoices where id = v_inv)), v_inv) returning * into s;
    select u.email into v_mail from public.owners ow join auth.users u on u.id = ow.user_id where ow.id = o.id;
    if v_mail is not null then
      v_fmt := '{montant} $';
      update fin.owner_statements set
        pro05_outbox_id = (comms.enqueue(jsonb_build_object('template_code', 'PRO-05', 'channel', 'email', 'recipient', v_mail, 'entity_type', 'fin.owner_statements', 'entity_id', s.id,
          'canal_journal', 'cron', 'idempotency_key', 'pro05:' || s.id, 'vars', jsonb_build_object('prenom', split_part(o.full_name, ' ', 1), 'mois', v_mois,
            'loyers', comms.montant_court((select coalesce(sum((x ->> 'montant')::numeric), 0) from jsonb_array_elements(s.lignes) x where x ->> 'categorie' in ('Loyers', 'Loyer partiel'))),
            'travaux', comms.montant_court((select coalesce(-sum((x ->> 'montant')::numeric), 0) from jsonb_array_elements(s.lignes) x where x ->> 'categorie' = 'Entretien')),
            'honoraires', comms.montant_court((s.facture ->> 'sous_total')::numeric), 'facture', coalesce(s.facture ->> 'numero', '—'),
            'lien', 'https://app.leaselane.ca/proprietaire/finance/releve?m=' || to_char(v_m, 'YYYY-MM'))))).id,
        pro06_outbox_id = case when v_inv is not null then (comms.enqueue(jsonb_build_object('template_code', 'PRO-06', 'channel', 'email', 'recipient', v_mail, 'entity_type', 'fin.owner_statements', 'entity_id', s.id,
          'canal_journal', 'cron', 'idempotency_key', 'pro06:' || s.id, 'vars', jsonb_build_object('prenom', split_part(o.full_name, ' ', 1), 'mois', v_mois, 'facture', s.facture ->> 'numero',
            'gestion', comms.montant_court((s.facture ->> 'honoraires')::numeric), 'coordination', comms.montant_court((s.facture ->> 'coordination')::numeric),
            'tps', comms.montant_court((s.facture ->> 'tps')::numeric), 'tvq', comms.montant_court((s.facture ->> 'tvq')::numeric), 'total', comms.montant_court((s.facture ->> 'total')::numeric),
            'lien', 'https://app.leaselane.ca/proprietaire/finance/releve?m=' || to_char(v_m, 'YYYY-MM'))))).id end
      where id = s.id;
    end if;
    perform crm.notifier(array(select user_id from public.owners where id = o.id) || array(select user_id from public.owner_members where owner_id = o.id and active), 'info', 'chart',
      'Relevé de ' || v_mois || ' et facture d’honoraires disponibles.', null, null, '/proprietaire/finance/releve?m=' || to_char(v_m, 'YYYY-MM'), 'fin.owner_statements', s.id);
    perform crm.journal('owner_statement.issued', 'fin.owner_statements', s.id, null, jsonb_build_object('mois', v_m, 'total', s.facture ->> 'total', 'facture', s.facture ->> 'numero'), 'issue-owner-statement', 'cron', null, 'system');
    n := n + 1;
  end loop;
  return n;
end $$;

-- Envoi automatique le 5 : PAS activé par cette migration (il enverrait de vraies factures aux propriétaires en production).
-- À activer par une décision explicite (Steven / Octa), une fois : select cron.schedule('releves-du-5', '30 12 5 * *', 'select crm.emettre_releves()');
-- En attendant, la comptabilité émet un mois depuis Lanceur (lanceur_emettre_releves).

-- Portail 11 : le relevé émis (figé) fait foi; avant le 5, un aperçu calculé.
create or replace function public.portail_releve(p_mois date) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id(); o record; s fin.owner_statements;
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  select ow.full_name, ow.company_name, u.email, (select count(*) from public.units un join public.buildings b on b.id = un.building_id where b.owner_id = ow.id) as logements,
         (select count(*) from public.buildings b where b.owner_id = ow.id) as immeubles into o from public.owners ow left join auth.users u on u.id = ow.user_id where ow.id = v_o;
  select * into s from fin.owner_statements where owner_id = v_o and mois = date_trunc('month', p_mois)::date;
  return jsonb_build_object('numero', coalesce(s.numero, 'REL-' || to_char(p_mois, 'YYYY-MM') || '-' || upper(left(v_o::text, 3))), 'mois', p_mois, 'emis', s.id is not null,
    'emis_le', coalesce(s.emis_le::date, (date_trunc('month', p_mois) + interval '1 month 4 days')::date),
    'destinataire', jsonb_build_object('nom', o.full_name, 'entreprise', o.company_name, 'courriel', o.email, 'logements', o.logements, 'immeubles', o.immeubles),
    'lignes', coalesce(s.lignes, (select jsonb_agg(jsonb_build_object('libelle', e.libelle, 'categorie', e.categorie, 'le', e.le, 'montant', e.montant, 'immeuble', e.immeuble)
        order by e.categorie <> 'Loyers', e.categorie <> 'Loyer partiel', e.le) from crm.ecritures_proprio(v_o, p_mois) e), '[]'::jsonb),
    'facture', coalesce(s.facture, crm.facture_honoraires(v_o, p_mois)));
end $$;

-- Équipe (e45) : relevés émis d'un mois, et émission manuelle (rattrapage) par la comptabilité ou l'admin.
create or replace function public.lanceur_releves(p_mois date default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_m date := coalesce(date_trunc('month', p_mois)::date, (date_trunc('month', current_date) - interval '1 month')::date);
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne permet pas de voir les finances.' using errcode = 'PT403'; end if;
  return jsonb_build_object('mois', v_m, 'parametres', to_jsonb(crm.parametres_honoraires((v_m + interval '1 month - 1 day')::date)),
    'releves', coalesce((select jsonb_agg(jsonb_build_object('proprietaire', o.full_name, 'owner_id', o.id, 'numero', s.numero, 'facture', s.facture, 'emis_le', s.emis_le,
        'courriel', (select status from comms.outbox where id = s.pro05_outbox_id), 'facture_courriel', (select status from comms.outbox where id = s.pro06_outbox_id)) order by o.full_name)
      from fin.owner_statements s join public.owners o on o.id = s.owner_id where s.mois = v_m), '[]'::jsonb),
    'a_emettre', coalesce((select jsonb_agg(jsonb_build_object('proprietaire', o.full_name, 'owner_id', o.id, 'apercu', crm.facture_honoraires(o.id, v_m)) order by o.full_name)
      from public.owners o where exists (select 1 from crm.ecritures_proprio(o.id, v_m)) and not exists (select 1 from fin.owner_statements s where s.owner_id = o.id and s.mois = v_m)), '[]'::jsonb));
end $$;
create or replace function public.lanceur_emettre_releves(p_mois date) returns int language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform crm.require_aal2();
  if not crm.can('finances.ecritures.ecrire') then raise exception 'Votre rôle ne permet pas d’émettre les relevés.' using errcode = 'PT403'; end if;
  if date_trunc('month', p_mois) >= date_trunc('month', current_date) then raise exception 'Un mois se facture une fois terminé.' using errcode = 'PT422'; end if;
  n := crm.emettre_releves(p_mois);
  perform crm.journal('owner_statement.issued_manually', 'fin.owner_statements', null, null, jsonb_build_object('mois', p_mois, 'nombre', n), 'issue-owner-statement');
  return n;
end $$;

revoke all on function crm.parametres_honoraires(date), crm.honoraire_travaux(numeric, date), crm.facture_honoraires(uuid, date), crm.emettre_releves(date) from public, anon, authenticated;
revoke all on function public.portail_releve(date), public.lanceur_releves(date), public.lanceur_emettre_releves(date) from public, anon;
grant execute on function public.portail_releve(date), public.lanceur_releves(date), public.lanceur_emettre_releves(date) to authenticated;
