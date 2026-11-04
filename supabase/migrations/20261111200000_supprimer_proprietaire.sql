-- Clients › Propriétaires : supprimer un propriétaire (Grégory, 2026-11-04 : « être capable de supprimer les tests »).
-- Administrateur seulement, 2FA, nom exact tapé pour confirmer. Part avec lui : immeubles, logements, baux, loyers, factures, documents,
-- visites, demandes, accords de prélèvement, et ses locataires qui n'ont aucun autre bail. Inscrit au journal (nom et nombres).
-- Ses dossiers juridiques (TAL) partent aussi : un dossier exige un bail.
-- Refusé s'il existe une trace à conserver : mouvement au compte en fidéicommis (registre immuable) ou relevé 31.
-- ponytail: les fichiers des documents restent dans le stockage (les lignes partent); un nettoyage du stockage viendra au besoin.

create or replace function public.lanceur_proprietaire_supprimer(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.owners; v_imm uuid[]; v_log uuid[]; v_baux uuid[]; v_loc uuid[]; v_t uuid; n_loc int := 0;
begin
  perform crm.require_aal2();
  if not crm.has_role('admin') then raise exception 'Seul un administrateur peut supprimer un propriétaire.' using errcode = 'PT403'; end if;
  select * into o from public.owners where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Propriétaire introuvable.' using errcode = 'PT404'; end if;
  if lower(btrim(coalesce(p ->> 'confirmation', ''))) not in (lower(btrim(o.full_name)), lower(btrim(coalesce(o.company_name, o.full_name)))) then
    raise exception 'Tapez le nom exact du propriétaire pour confirmer.' using errcode = 'PT422';
  end if;
  select coalesce(array_agg(id), '{}') into v_imm from public.buildings where owner_id = o.id;
  select coalesce(array_agg(id), '{}') into v_log from public.units where building_id = any(v_imm);
  select coalesce(array_agg(id), '{}') into v_baux from public.leases where unit_id = any(v_log);
  select coalesce(array_agg(distinct x.t), '{}') into v_loc from (select tenant_id t from public.leases where id = any(v_baux)
    union select tenant_id from public.lease_tenants where lease_id = any(v_baux)) x where x.t is not null;
  if exists (select 1 from public.fiducie_mouvements where owner_id = o.id or building_id = any(v_imm) or lease_id = any(v_baux))
     or exists (select 1 from public.fiducie_lot_lignes where owner_id = o.id)
     or exists (select 1 from fin.rl31_slips where owner_id = o.id or unit_id = any(v_log)) then
    raise exception 'Impossible : ce propriétaire a des mouvements au compte en fidéicommis ou des relevés 31, qui doivent être conservés.' using errcode = 'PT409';
  end if;
  -- Liens qui ne partent pas tout seuls avec le propriétaire.
  update crm.deals set converted_owner_id = null where converted_owner_id = o.id;
  update public.prospects set converted_owner_id = null where converted_owner_id = o.id;
  delete from jur.cases where lease_id = any(v_baux);
  delete from crm.assignments where lease_id = any(v_baux);
  delete from public.approvals where owner_id = o.id;
  delete from public.financial_anomalies where owner_id = o.id;
  delete from public.documents where owner_id = o.id or building_id = any(v_imm) or lease_id = any(v_baux);
  delete from public.visits where unit_id = any(v_log);
  delete from public.inquiries where unit_id = any(v_log);
  delete from public.owners where id = o.id;   -- le reste part en cascade (immeubles, logements, baux, loyers, factures…)
  -- Ses locataires sans aucun autre bail. Un locataire encore lié ailleurs reste.
  foreach v_t in array v_loc loop
    if not exists (select 1 from public.leases where tenant_id = v_t) and not exists (select 1 from public.lease_tenants where tenant_id = v_t) then
      begin
        update public.bank_transactions set ai_suggested_tenant_id = null where ai_suggested_tenant_id = v_t;
        delete from public.tenants where id = v_t;
        n_loc := n_loc + 1;
      exception when foreign_key_violation then null;
      end;
    end if;
  end loop;
  perform crm.journal('owner.deleted', 'public.owners', o.id, jsonb_build_object('nom', o.full_name, 'entreprise', o.company_name),
    jsonb_build_object('immeubles', cardinality(v_imm), 'logements', cardinality(v_log), 'baux', cardinality(v_baux), 'locataires_supprimes', n_loc), 'delete-owner');
  return jsonb_build_object('immeubles', cardinality(v_imm), 'logements', cardinality(v_log), 'baux', cardinality(v_baux), 'locataires', n_loc);
end $$;
revoke all on function public.lanceur_proprietaire_supprimer(jsonb) from public, anon;
grant execute on function public.lanceur_proprietaire_supprimer(jsonb) to authenticated;
