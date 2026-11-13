-- Phase 1 du plan du portail (rencontre du 12 nov. 2026) : la finance de l'administrateur « en vrac » devient une vue par client et par
-- immeuble, avec des alertes sur les flux de trésorerie et les dépenses inhabituelles; la finance du propriétaire se ventile par immeuble,
-- locataire et type de service (loyer, stationnement, buanderie).
--
-- 1. fin.autres_revenus : les revenus qui ne sont pas un loyer (stationnement, buanderie, autre), saisis par l'équipe, par immeuble.
-- 2. lanceur_finance_vue : par client puis par immeuble (dans la portée choisie), revenus, dépenses, net du mois et alertes.
-- 3. portail_finance : ajoute « ventilation » (par immeuble, par locataire, par service).
-- Seuils des alertes : question ouverte Q04 du plan. Valeurs de départ ci-dessous, modifiables sans code dans config.parametres
-- (clé « finance_alertes »).
create table if not exists fin.autres_revenus (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  type text not null check (type in ('stationnement', 'buanderie', 'autre')),
  montant numeric(10,2) not null check (montant > 0),
  le date not null default current_date,
  note text,
  created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create index if not exists autres_revenus_immeuble on fin.autres_revenus (building_id, le);
alter table fin.autres_revenus enable row level security;
revoke all on fin.autres_revenus from anon, authenticated; grant all on fin.autres_revenus to service_role;

-- 13465 → « 13 465 » (espace insécable, sans décimales) pour les phrases d'alerte.
create or replace function crm.argent_fr(n numeric) returns text language sql immutable set search_path = '' as $$
  select replace(trim(to_char(round(n), 'FM999,999,990')), ',', ' ');
$$;
create or replace function crm.seuils_finance() returns jsonb language sql stable security definer set search_path = '' as $$
  select '{"perception_min_pct": 80, "perception_jour": 10, "depense_facteur": 2, "depense_min": 500, "depense_sans_historique": 2000}'::jsonb
    || coalesce((select valeur from config.parametres where cle = 'finance_alertes'), '{}'::jsonb);
$$;

-- Dépenses d'un immeuble, les mêmes que sur le relevé du propriétaire : travaux terminés, débours, comptes à payer hors bon de travail.
create or replace function crm.depenses_immeubles(p_debut date, p_fin date) returns table (building_id uuid, le date, montant numeric, libelle text, sorte text)
language sql stable security definer set search_path = '' as $$
  select u.building_id, coalesce(w.worker_reported_done_at::date, w.created_at::date), coalesce(w.invoice_total_cents / 100.0, w.estimated_cost),
         coalesce(wk.company_name, wk.name, 'Fournisseur') || ' — ' || left(coalesce(w.description, 'travaux'), 60), 'travaux'
    from portee.work_orders w join portee.units u on u.id = w.unit_id left join public.workers wk on wk.id = w.worker_id
    where w.status = 'completed' and coalesce(w.worker_reported_done_at::date, w.created_at::date) >= p_debut and coalesce(w.worker_reported_done_at::date, w.created_at::date) < p_fin
      and coalesce(w.invoice_total_cents / 100.0, w.estimated_cost) is not null
  union all select d.building_id, d.created_at::date, d.amount, 'Débours — ' || left(d.description, 60), 'debours'
    from portee.external_disbursements d where d.building_id is not null and d.created_at::date >= p_debut and d.created_at::date < p_fin
  union all select pb.building_id, coalesce(pb.due_date, pb.created_at::date), pb.amount, coalesce(pb.vendor_name, 'Fournisseur') || ' — ' || left(coalesce(pb.description, 'facture'), 60), 'facture'
    from portee.payables pb where pb.building_id is not null and pb.work_order_id is null and pb.status in ('approved', 'paid')
      and coalesce(pb.due_date, pb.created_at::date) >= p_debut and coalesce(pb.due_date, pb.created_at::date) < p_fin;
$$;
revoke all on function crm.seuils_finance(), crm.depenses_immeubles(date, date) from public, anon, authenticated;

create or replace function public.lanceur_finance_vue(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_m date := coalesce(date_trunc('month', nullif(p ->> 'mois', '')::date)::date, date_trunc('month', current_date)::date); v_f date := (v_m + interval '1 month')::date;
  s jsonb := crm.seuils_finance(); v_courant boolean := v_m = date_trunc('month', current_date)::date;
  v_pct numeric := (s ->> 'perception_min_pct')::numeric; v_jour int := (s ->> 'perception_jour')::int; v_fact numeric := (s ->> 'depense_facteur')::numeric;
  v_min numeric := (s ->> 'depense_min')::numeric; v_abs numeric := (s ->> 'depense_sans_historique')::numeric;
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  return (
    with loy as (select u.building_id, sum(pa.amount) attendu, coalesce(sum(coalesce(pa.amount_received, pa.amount)) filter (where pa.status = 'paid'), 0) paye,
                   count(*) filter (where pa.status <> 'paid' and pa.due_date < current_date) retards
                 from portee.payments pa join portee.leases l on l.id = pa.lease_id join portee.units u on u.id = l.unit_id where pa.due_date >= v_m and pa.due_date < v_f group by 1),
    aut as (select a.building_id, coalesce(sum(a.montant) filter (where a.type = 'stationnement'), 0) stationnement, coalesce(sum(a.montant) filter (where a.type = 'buanderie'), 0) buanderie,
                   coalesce(sum(a.montant) filter (where a.type = 'autre'), 0) autre
            from fin.autres_revenus a where a.le >= v_m and a.le < v_f and a.building_id in (select id from portee.buildings) group by 1),
    dep as (select * from crm.depenses_immeubles(v_m, v_f)),
    hist as (select h.building_id, count(*) n, (percentile_cont(0.5) within group (order by h.montant))::numeric mediane from crm.depenses_immeubles((v_m - interval '12 months')::date, v_m) h group by 1),
    inhab as (select d.building_id, d.le, d.montant, d.libelle, h.mediane
              from dep d left join hist h on h.building_id = d.building_id
              where d.montant >= v_min and case when coalesce(h.n, 0) >= 3 then d.montant >= v_fact * h.mediane else d.montant >= v_abs end),
    imm as (select b.id, b.owner_id, b.address, (select count(*) from portee.units u where u.building_id = b.id) logements,
              (select count(*) from portee.units u where u.building_id = b.id and exists (select 1 from portee.leases l where l.unit_id = u.id and l.status = 'active')) occupes,
              coalesce(l.attendu, 0) attendu, coalesce(l.paye, 0) paye, coalesce(l.retards, 0) retards,
              coalesce(a.stationnement, 0) stationnement, coalesce(a.buanderie, 0) buanderie, coalesce(a.autre, 0) autre,
              coalesce((select sum(d.montant) from dep d where d.building_id = b.id), 0) depenses
            from portee.buildings b left join loy l on l.building_id = b.id left join aut a on a.building_id = b.id),
    net as (select i.*, i.paye + i.stationnement + i.buanderie + i.autre - i.depenses net,
              (i.attendu > 0 and (not v_courant or extract(day from current_date) >= v_jour) and 100.0 * i.paye / i.attendu < v_pct) perception_faible from imm i),
    alertes as (
      select n.id building_id, n.owner_id, n.address, 'tresorerie' type, 0 ordre, n.net montant,
             'Flux de trésorerie négatif : ' || crm.argent_fr(n.depenses) || ' $ de dépenses pour ' || crm.argent_fr(n.paye + n.stationnement + n.buanderie + n.autre) || ' $ de revenus perçus.' texte
        from net n where n.net < 0 and n.depenses > 0
      union all select n.id, n.owner_id, n.address, 'perception', 1, n.attendu - n.paye,
             'Loyers perçus à ' || round(100.0 * n.paye / n.attendu) || ' % (' || crm.argent_fr(n.attendu - n.paye) || ' $ à percevoir, ' || n.retards || ' en retard) : sous le seuil de ' || v_pct || ' %.'
        from net n where n.perception_faible
      union all select i.building_id, b.owner_id, b.address, 'depense', 2, i.montant,
             'Dépense inhabituelle : ' || i.libelle || ', ' || crm.argent_fr(i.montant) || ' $' ||
             case when i.mediane is not null then ' (médiane des 12 derniers mois : ' || crm.argent_fr(i.mediane) || ' $).' else ' (aucun historique pour comparer).' end
        from inhab i join portee.buildings b on b.id = i.building_id)
    select jsonb_build_object('mois', v_m, 'courant', v_courant, 'seuils', s,
      'total', (select jsonb_build_object('attendu', coalesce(sum(attendu), 0), 'paye', coalesce(sum(paye), 0), 'autres', coalesce(sum(stationnement + buanderie + autre), 0),
                  'depenses', coalesce(sum(depenses), 0), 'net', coalesce(sum(net), 0), 'immeubles', count(*), 'logements', coalesce(sum(logements), 0), 'occupes', coalesce(sum(occupes), 0)) from net),
      'clients', coalesce((select jsonb_agg(c order by c ->> 'nom') from (
          select jsonb_build_object('id', o.id, 'nom', o.full_name, 'attendu', sum(n.attendu), 'paye', sum(n.paye), 'autres', sum(n.stationnement + n.buanderie + n.autre), 'depenses', sum(n.depenses), 'net', sum(n.net),
            'alertes', (select count(*) from alertes a where a.owner_id = o.id),
            'immeubles', jsonb_agg(jsonb_build_object('id', n.id, 'adresse', n.address, 'logements', n.logements, 'occupes', n.occupes, 'attendu', n.attendu, 'paye', n.paye,
              'stationnement', n.stationnement, 'buanderie', n.buanderie, 'autre', n.autre, 'depenses', n.depenses, 'net', n.net,
              'alertes', (select count(*) from alertes a where a.building_id = n.id)) order by n.address)) c
          from net n join portee.owners o on o.id = n.owner_id group by o.id, o.full_name) z), '[]'::jsonb),
      'alertes', coalesce((select jsonb_agg(jsonb_build_object('immeuble_id', a.building_id, 'immeuble', a.address, 'client', o.full_name, 'client_id', a.owner_id, 'type', a.type, 'texte', a.texte, 'montant', a.montant)
                    order by a.ordre, abs(a.montant) desc) from alertes a join portee.owners o on o.id = a.owner_id), '[]'::jsonb),
      -- flux de trésorerie des 6 derniers mois, sur la portée choisie
      'serie', (select jsonb_agg(jsonb_build_object('mois', m::date,
          'revenus', (select coalesce(sum(coalesce(pa.amount_received, pa.amount)), 0) from portee.payments pa where pa.status = 'paid' and pa.due_date >= m and pa.due_date < m + interval '1 month')
                   + (select coalesce(sum(a.montant), 0) from fin.autres_revenus a where a.le >= m and a.le < m + interval '1 month' and a.building_id in (select id from portee.buildings)),
          'depenses', (select coalesce(sum(d.montant), 0) from crm.depenses_immeubles(m::date, (m + interval '1 month')::date) d)) order by m)
        from generate_series(v_m - interval '5 months', v_m, interval '1 month') m),
      'autres_revenus', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'immeuble', b.address, 'type', a.type, 'montant', a.montant, 'le', a.le, 'note', a.note) order by a.le desc, a.created_at desc)
                          from fin.autres_revenus a join portee.buildings b on b.id = a.building_id where a.le >= v_m and a.le < v_f), '[]'::jsonb),
      'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'adresse', b.address) order by b.address) from portee.buildings b), '[]'::jsonb),
      'peut_ecrire', crm.can('finances.paiements.ecrire')));
end $$;

create or replace function public.lanceur_autre_revenu(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v uuid; v_m numeric := coalesce(nullif(p ->> 'montant', '')::numeric, 0); v_le date := coalesce(nullif(p ->> 'le', '')::date, current_date);
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas d’inscrire un revenu.' using errcode = 'PT403'; end if;
  if p ? 'supprimer' then
    delete from fin.autres_revenus where id = (p ->> 'supprimer')::uuid returning id into v;
    if v is null then raise exception 'Revenu introuvable.' using errcode = 'PT404'; end if;
    perform crm.journal('other_income.deleted', 'fin.autres_revenus', v, null, null, 'record-other-income');
    return jsonb_build_object('id', v);
  end if;
  if not exists (select 1 from public.buildings where id = nullif(p ->> 'immeuble', '')::uuid) then raise exception 'Immeuble requis.' using errcode = 'PT422'; end if;
  if coalesce(p ->> 'type', '') not in ('stationnement', 'buanderie', 'autre') then raise exception 'Type de revenu requis : stationnement, buanderie ou autre.' using errcode = 'PT422'; end if;
  if v_m <= 0 then raise exception 'Montant requis.' using errcode = 'PT422'; end if;
  if v_le > current_date then raise exception 'La date ne peut pas être future.' using errcode = 'PT422'; end if;
  if exists (select 1 from fin.closings where mois = date_trunc('month', v_le)) then raise exception 'Ce mois est verrouillé.' using errcode = 'PT409'; end if;
  insert into fin.autres_revenus (building_id, type, montant, le, note, created_by) values ((p ->> 'immeuble')::uuid, p ->> 'type', v_m, v_le, nullif(btrim(p ->> 'note'), ''), auth.uid()) returning id into v;
  perform crm.journal('other_income.recorded', 'fin.autres_revenus', v, null, p, 'record-other-income');
  return jsonb_build_object('id', v);
end $$;
revoke all on function public.lanceur_finance_vue(jsonb), public.lanceur_autre_revenu(jsonb) from public, anon;
grant execute on function public.lanceur_finance_vue(jsonb), public.lanceur_autre_revenu(jsonb) to authenticated;

-- Portail propriétaire : ses revenus du mois par immeuble, par locataire et par type de service.
create or replace function crm.ventilation_proprio(p_owner uuid, p_mois date) returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('immeuble', b.address,
      'loyers', coalesce((select sum(coalesce(pa.amount_received, 0)) from public.payments pa join public.leases l on l.id = pa.lease_id join public.units u on u.id = l.unit_id
                  where u.building_id = b.id and pa.due_date >= date_trunc('month', p_mois) and pa.due_date < date_trunc('month', p_mois) + interval '1 month' and pa.status = 'paid'), 0),
      'stationnement', coalesce((select sum(a.montant) from fin.autres_revenus a where a.building_id = b.id and a.type = 'stationnement' and a.le >= date_trunc('month', p_mois) and a.le < date_trunc('month', p_mois) + interval '1 month'), 0),
      'buanderie', coalesce((select sum(a.montant) from fin.autres_revenus a where a.building_id = b.id and a.type = 'buanderie' and a.le >= date_trunc('month', p_mois) and a.le < date_trunc('month', p_mois) + interval '1 month'), 0),
      'autre', coalesce((select sum(a.montant) from fin.autres_revenus a where a.building_id = b.id and a.type = 'autre' and a.le >= date_trunc('month', p_mois) and a.le < date_trunc('month', p_mois) + interval '1 month'), 0),
      'locataires', coalesce((select jsonb_agg(jsonb_build_object('locataire', t.full_name, 'logement', u.unit_number, 'attendu', pa.amount, 'paye', case when pa.status = 'paid' then coalesce(pa.amount_received, pa.amount) else coalesce(pa.amount_received, 0) end,
                      'statut', case when pa.status = 'paid' then 'paye' when pa.due_date < current_date then 'retard' else 'a_venir' end) order by u.unit_number, t.full_name)
                    from public.payments pa join public.leases l on l.id = pa.lease_id join public.units u on u.id = l.unit_id join public.tenants t on t.id = l.tenant_id
                    where u.building_id = b.id and pa.due_date >= date_trunc('month', p_mois) and pa.due_date < date_trunc('month', p_mois) + interval '1 month'), '[]'::jsonb)) order by b.address), '[]'::jsonb)
  from public.buildings b where b.owner_id = p_owner;
$$;
revoke all on function crm.ventilation_proprio(uuid, date) from public, anon, authenticated;
-- portail_finance : même définition, plus « ventilation ».
CREATE OR REPLACE FUNCTION public.portail_finance(p_mois date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_o uuid := public.auth_owner_id(); v_m date := coalesce(p_mois, (date_trunc('month', current_date) - interval '1 month')::date);
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return jsonb_build_object('mois', v_m, 'ventilation', crm.ventilation_proprio(v_o, v_m), 'taux', (select coalesce(management_rate, 6) from public.owners where id = v_o),
    'ecritures', coalesce((select jsonb_agg(jsonb_build_object('le', e.le, 'libelle', e.libelle, 'categorie', e.categorie, 'montant', e.montant) order by e.le, e.categorie) from crm.ecritures_proprio(v_o, v_m) e), '[]'::jsonb),
    'precedent', (select jsonb_build_object('loyers', coalesce(sum(montant) filter (where montant > 0), 0), 'travaux', coalesce(-sum(montant) filter (where categorie in ('Entretien', 'Coordination')), 0))
      from crm.ecritures_proprio(v_o, (v_m - interval '1 month')::date)),
    'releves', coalesce((select jsonb_agg(to_char(m, 'YYYY-MM') order by m desc) from generate_series(date_trunc('month', current_date) - interval '6 months', date_trunc('month', current_date) - interval '1 month', interval '1 month') m
      where exists (select 1 from crm.ecritures_proprio(v_o, m::date))), '[]'::jsonb),
    'releves_31', coalesce((select jsonb_agg(jsonb_build_object('immeuble', b.address, 'logement', u.unit_number, 'locataire', t.full_name) order by b.address, u.unit_number)
      from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id join public.tenants t on t.id = l.tenant_id
      where b.owner_id = v_o and l.start_date <= make_date(extract(year from current_date)::int, 12, 31) and (l.end_date is null or l.end_date >= make_date(extract(year from current_date)::int, 12, 31))), '[]'::jsonb));
end $function$;
