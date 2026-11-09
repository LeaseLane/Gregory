-- Importer un bail (2026-11-09) : un bail signé qui commence plus tard (statut « a_venir ») laissait le logement « libre »
-- (Mise en marché, choix de logement d'un autre bail) et le propriétaire ne voyait pas son futur locataire.
-- 1. crm.etat_logement : un bail à venir = logement loué. 2. portail_proprietaire_locataires (copie de 20261113130000) : baux à venir, date d'arrivée.

create or replace function crm.etat_logement(p_unit uuid) returns text language sql stable security definer set search_path = '' as $$
  select case when exists (select 1 from public.leases l where l.unit_id = u.id and l.status = 'a_venir') then 'loue'
              when u.status = 'available' or not exists (select 1 from public.leases l where l.unit_id = u.id and l.status = 'active') then 'vacant'
              when u.status = 'soon_available' or exists (select 1 from public.leases l where l.unit_id = u.id and l.status = 'active' and l.renewal_response = 'refused') then 'preavis'
              else 'loue' end from public.units u where u.id = p_unit;
$$;

create or replace function public.portail_proprietaire_locataires() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id();
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return jsonb_build_object(
    'locataires', coalesce((select jsonb_agg(x order by x ->> 'nom') from (select jsonb_build_object('id', t.id, 'nom', t.full_name, 'immeuble_id', b.id,
        'logement', b.address || ' — ' || u.unit_number, 'loyer', l.monthly_rent, 'depuis', extract(year from (select min(l2.start_date) from public.leases l2 where l2.tenant_id = t.id and l2.unit_id = u.id))::int,
        'retard_jours', (select max(current_date - p.due_date) from public.payments p where p.lease_id = l.id and p.status <> 'paid' and p.due_date < current_date),
        'depart', case when u.status = 'soon_available' and l.status = 'active' then l.end_date end, 'arrivee', case when l.status = 'a_venir' then l.start_date end,
        'paye_ce_mois', exists (select 1 from public.payments p where p.lease_id = l.id and p.status = 'paid' and date_trunc('month', p.due_date) = date_trunc('month', current_date))) x
      from public.leases l join public.tenants t on t.id = l.tenant_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
      where b.owner_id = v_o and l.status in ('active', 'a_venir') and t.anonymized_at is null) z), '[]'::jsonb),
    'occupes', (select count(*) from public.units u join public.buildings b on b.id = u.building_id where b.owner_id = v_o and u.status = 'occupied'),
    'documents', (select count(*) from public.documents d where d.owner_id = v_o and (d.visibility <> 'prive' or d.added_by = auth.uid())),
    'documents_semaine', (select count(*) from public.documents d where d.owner_id = v_o and d.created_at > now() - interval '7 days'),
    'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'adresse', b.address) order by b.address) from public.buildings b where b.owner_id = v_o), '[]'::jsonb));
end $$;
