-- TP · Fiche locataire : un document déposé par le propriétaire est « ajouté par vous ».
create or replace function public.portail_proprietaire_locataire(p_id uuid) returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare t public.tenants; l record; v_o uuid := public.auth_owner_id();
begin
  perform crm.exiger_niveau_portail(true);
  select le.*, u.unit_number, b.address, b.id as building_id into l from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id
   where le.tenant_id = p_id and b.owner_id = v_o order by le.status = 'active' desc, le.start_date desc limit 1;
  if l.id is null then raise exception 'Locataire introuvable.' using errcode = 'PT404'; end if;
  select * into t from public.tenants where id = p_id;
  perform crm.journal('tenant.read_by_owner', 'public.tenants', t.id, null, null, 'read-tenant', 'portail', p_is_sensitive_read => true);
  return jsonb_build_object('id', t.id, 'nom', t.full_name, 'courriel', t.email, 'telephone', t.phone, 'logement', l.address || ' — logement ' || l.unit_number, 'immeuble_id', l.building_id,
    'depuis', (select min(start_date) from public.leases where tenant_id = t.id and unit_id = l.unit_id), 'bail', jsonb_build_object('id', l.id, 'debut', l.start_date, 'fin', l.end_date, 'loyer', l.monthly_rent, 'statut', l.status),
    'paiement', (select jsonb_build_object('a_jour', not exists (select 1 from public.payments p where p.lease_id = l.id and p.status <> 'paid' and p.due_date < current_date),
        'dernier', (select max(paid_date) from public.payments p where p.lease_id = l.id and p.status = 'paid'),
        'retard', (select sum(p.amount - coalesce(p.amount_received, 0)) from public.payments p where p.lease_id = l.id and p.status <> 'paid' and p.due_date < current_date))),
    'paiements', coalesce((select jsonb_agg(jsonb_build_object('echeance', p.due_date, 'montant', p.amount, 'recu', p.amount_received, 'paye_le', p.paid_date, 'statut', p.status) order by p.due_date desc)
      from (select * from public.payments where lease_id = l.id order by due_date desc limit 12) p), '[]'::jsonb),
    'demandes', coalesce((select jsonb_agg(jsonb_build_object('id', sr.id, 'titre', coalesce(nullif(sr.ai_subcategory, ''), left(sr.description, 60)), 'statut', sr.status, 'recue', sr.created_at) order by sr.created_at desc)
      from public.service_requests sr where sr.tenant_id = t.id and sr.unit_id = l.unit_id), '[]'::jsonb),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'categorie', coalesce(d.category, case d.doc_type when 'bail' then 'Bail et annexes' when 'rapport' then 'Avis et correspondance' else 'Autres' end),
        'taille', d.size_bytes, 'le', d.created_at, 'par', case when d.added_by = auth.uid() then 'vous' when d.added_by is null then 'la plateforme' else crm.nom_membre(d.added_by) end, 'lisible', d.storage_path is not null or d.file_url is not null) order by d.created_at desc)
      from public.documents d where d.owner_id = v_o and (d.lease_id = l.id or d.tenant_id = t.id) and (d.visibility <> 'prive' or d.added_by = auth.uid())), '[]'::jsonb));
end $$;
