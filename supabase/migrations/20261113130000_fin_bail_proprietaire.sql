-- Flux « changement de bail » : quand l'équipe inscrit la fin d'un bail, le propriétaire n'en savait rien (aucun avis, aucune date
-- dans sa liste de locataires). Copies de 20261112140000 (lanceur_bail_terminer, + avis au propriétaire et aux copropriétaires)
-- et de 20261023100000 (portail_proprietaire_locataires, + date de départ quand le logement est en préavis).

create or replace function public.lanceur_bail_terminer(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_bail uuid := nullif(p ->> 'lease_id', '')::uuid; v_fin date := nullif(p ->> 'fin', '')::date; r jsonb;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de mettre fin à un bail.' using errcode = 'PT403'; end if;
  if v_bail is null or not exists (select 1 from public.leases where id = v_bail) then raise exception 'Bail introuvable.' using errcode = 'PT404'; end if;
  if v_fin is null then raise exception 'Date de fin requise.' using errcode = 'PT422'; end if;
  begin
    r := public.bail_terminer(v_bail, v_fin, coalesce(nullif(p ->> 'motif', ''), 'depart'), nullif(btrim(coalesce(p ->> 'note', '')), ''), auth.uid());
  exception when raise_exception then raise exception '%', sqlerrm using errcode = 'PT409';
  end;
  perform crm.journal('lease.ended', 'public.leases', v_bail, null, r || jsonb_build_object('fin', v_fin, 'motif', p ->> 'motif'), 'end-lease');
  -- Le propriétaire (et ses copropriétaires) apprend le départ : nom, logement, date.
  perform crm.notifier(array(select o.user_id from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
        join public.owners o on o.id = b.owner_id where l.id = v_bail and o.user_id is not null
      union select m.user_id from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
        join public.owner_members m on m.owner_id = b.owner_id and m.active and m.role = 'coproprietaire' where l.id = v_bail),
    'info', 'users', (select t.full_name || ' quitte le ' || b.address || ' — ' || u.unit_number from public.leases l join public.tenants t on t.id = l.tenant_id
      join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where l.id = v_bail),
    'Fin du bail le ' || extract(day from v_fin)::int || ' ' || (array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'])[extract(month from v_fin)::int]
      || ' ' || extract(year from v_fin)::int || '. L’équipe s’occupe de relouer le logement.', null, '/proprietaire/locataires', 'public.leases', v_bail);
  return r;
end $$;

create or replace function public.portail_proprietaire_locataires() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id();
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return jsonb_build_object(
    'locataires', coalesce((select jsonb_agg(x order by x ->> 'nom') from (select jsonb_build_object('id', t.id, 'nom', t.full_name, 'immeuble_id', b.id,
        'logement', b.address || ' — ' || u.unit_number, 'loyer', l.monthly_rent, 'depuis', extract(year from (select min(l2.start_date) from public.leases l2 where l2.tenant_id = t.id and l2.unit_id = u.id))::int,
        'retard_jours', (select max(current_date - p.due_date) from public.payments p where p.lease_id = l.id and p.status <> 'paid' and p.due_date < current_date),
        'depart', case when u.status = 'soon_available' then l.end_date end,
        'paye_ce_mois', exists (select 1 from public.payments p where p.lease_id = l.id and p.status = 'paid' and date_trunc('month', p.due_date) = date_trunc('month', current_date))) x
      from public.leases l join public.tenants t on t.id = l.tenant_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
      where b.owner_id = v_o and l.status = 'active' and t.anonymized_at is null) z), '[]'::jsonb),
    'occupes', (select count(*) from public.units u join public.buildings b on b.id = u.building_id where b.owner_id = v_o and u.status = 'occupied'),
    'documents', (select count(*) from public.documents d where d.owner_id = v_o and (d.visibility <> 'prive' or d.added_by = auth.uid())),
    'documents_semaine', (select count(*) from public.documents d where d.owner_id = v_o and d.created_at > now() - interval '7 days'),
    'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'adresse', b.address) order by b.address) from public.buildings b where b.owner_id = v_o), '[]'::jsonb));
end $$;
