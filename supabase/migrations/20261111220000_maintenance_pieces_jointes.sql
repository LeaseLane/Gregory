-- Maintenance : pièces jointes dans le nouvel admin (Grégory, 2026-11-05 : « on n'est pas capable de linker des pièces jointes »).
-- L'ancien admin les envoyait par ops-api; ici le navigateur dépose le fichier dans le bucket « documents » (mêmes dossiers que
-- l'ancien admin et que la Loi 25 : workers/<id>/ pour un fournisseur, <owner_id>/ pour une facture), puis la base vérifie et rattache.
--   • fiche fournisseur : attestation d'assurance (met à jour l'échéance), licence RBQ, autre document;
--   • bon de travail : facture du fournisseur (visible du propriétaire), rattachée à la dépense du bon.

-- ── Stockage ──
drop policy if exists "maintenance depose une piece" on storage.objects;
create policy "maintenance depose une piece" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and crm.can('maintenance.ecrire') and (
    (storage.foldername(name))[1] = 'workers'
    or exists (select 1 from public.owners o where o.id::text = (storage.foldername(name))[1])));
-- Un dépôt dont le rattachement échoue est effacé aussitôt (jamais un fichier orphelin).
drop policy if exists "maintenance retire une piece non rattachee" on storage.objects;
create policy "maintenance retire une piece non rattachee" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and crm.can('maintenance.ecrire')
         and not exists (select 1 from public.documents d where d.storage_path = storage.objects.name or d.file_url = storage.objects.name));

-- p : worker_id, type (assurance | rbq | autre), titre (autre), expiration (AAAA-MM-JJ, facultatif), chemin, taille.
create or replace function public.lanceur_fournisseur_document(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare w public.workers; v_type text := coalesce(p ->> 'type', 'autre'); v_exp date := nullif(p ->> 'expiration', '')::date; v_id uuid; v_titre text;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un fournisseur.' using errcode = 'PT403'; end if;
  select * into w from public.workers where id = (p ->> 'worker_id')::uuid;
  if not found then raise exception 'Fournisseur introuvable.' using errcode = 'PT404'; end if;
  if v_type not in ('assurance', 'rbq', 'autre') then raise exception 'Type de document inconnu.' using errcode = 'PT422'; end if;
  if coalesce(p ->> 'chemin', '') not like 'workers/' || w.id || '/%' or p ->> 'chemin' like '%..%' then
    raise exception 'Fichier hors du dossier de ce fournisseur.' using errcode = 'PT403';
  end if;
  v_titre := case v_type when 'assurance' then 'Attestation d’assurance' when 'rbq' then 'Licence RBQ' else coalesce(nullif(left(btrim(p ->> 'titre'), 200), ''), 'Document') end
    || case when v_exp is not null then ' · au ' || to_char(v_exp, 'DD/MM/YYYY') else '' end;
  insert into public.documents (worker_id, title, doc_type, visibility, storage_bucket, storage_path, file_url, size_bytes, added_by)
  values (w.id, v_titre, case v_type when 'assurance' then 'assurance_travailleur' when 'rbq' then 'licence_rbq' else 'autre' end, 'prive',
          'documents', p ->> 'chemin', p ->> 'chemin', nullif(p ->> 'taille', '')::bigint, auth.uid())
  returning id into v_id;
  if v_type = 'assurance' then
    update public.workers set insurance_document_id = v_id, insurance_expiry = coalesce(v_exp, insurance_expiry) where id = w.id;
  elsif v_type = 'rbq' and v_exp is not null then
    update public.workers set rbq_license_expiry = v_exp where id = w.id;
  end if;
  perform crm.journal('worker.document_added', 'public.workers', w.id, null, jsonb_build_object('document', v_id, 'type', v_type, 'expiration', v_exp), 'add-worker-document');
  return v_id;
end $$;

-- p : id (bon de travail), chemin (<owner_id>/…), taille.
create or replace function public.lanceur_bon_facture(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare wo public.work_orders; v_owner uuid; v_building uuid; v_id uuid;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un bon de travail.' using errcode = 'PT403'; end if;
  select * into wo from public.work_orders where id = (p ->> 'id')::uuid;
  if not found then raise exception 'Bon de travail introuvable.' using errcode = 'PT404'; end if;
  select b.owner_id, b.id into v_owner, v_building from public.units u join public.buildings b on b.id = u.building_id where u.id = wo.unit_id;
  if v_owner is null then raise exception 'Logement du bon introuvable.' using errcode = 'PT404'; end if;
  if coalesce(p ->> 'chemin', '') not like v_owner || '/%' or p ->> 'chemin' like '%..%' then
    raise exception 'Fichier hors du dossier du propriétaire.' using errcode = 'PT403';
  end if;
  if not exists (select 1 from public.expenses where work_order_id = wo.id) then
    raise exception 'Marquez d’abord le bon réalisé (montant de la facture) : la facture se joint à sa dépense.' using errcode = 'PT422';
  end if;
  if not exists (select 1 from public.expenses where work_order_id = wo.id and receipt_document_id is null) then
    raise exception 'Une facture est déjà jointe à ce bon.' using errcode = 'PT409';
  end if;
  insert into public.documents (owner_id, building_id, title, doc_type, visibility, storage_bucket, storage_path, file_url, size_bytes, added_by)
  values (v_owner, v_building, left('Facture — ' || coalesce(wo.description, 'travaux'), 200), 'facture', 'proprietaire_equipe',
          'documents', p ->> 'chemin', p ->> 'chemin', nullif(p ->> 'taille', '')::bigint, auth.uid())
  returning id into v_id;
  update public.expenses set receipt_document_id = v_id where work_order_id = wo.id and receipt_document_id is null;
  perform crm.journal('work_order.invoice_attached', 'public.work_orders', wo.id, null, jsonb_build_object('document', v_id), 'attach-work-order-invoice');
  return v_id;
end $$;

-- Factures jointes d'un bon (pour les afficher et les ouvrir) et dossier où déposer la prochaine (celui du propriétaire).
create or replace function public.lanceur_bon_factures(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'dossier', (select b.owner_id::text from public.work_orders wo join public.units u on u.id = wo.unit_id join public.buildings b on b.id = u.building_id where wo.id = p_id),
    'depense', exists (select 1 from public.expenses where work_order_id = p_id),
    'factures', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'le', d.created_at) order by d.created_at)
      from public.documents d join public.expenses e on e.receipt_document_id = d.id where e.work_order_id = p_id), '[]'::jsonb));
end $$;

-- Chemin d'un document de maintenance (fournisseur ou facture d'un bon), pour le lien signé : jamais un chemin venu du navigateur.
create or replace function public.lanceur_maintenance_document(p_id uuid) returns text language plpgsql stable security definer set search_path = '' as $$
declare d public.documents;
begin
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  select * into d from public.documents where id = p_id
    and (worker_id is not null or exists (select 1 from public.workers w where w.insurance_document_id = p_id)
         or exists (select 1 from public.expenses e where e.receipt_document_id = p_id and e.work_order_id is not null));
  if not found then raise exception 'Document introuvable.' using errcode = 'PT404'; end if;
  return coalesce(d.storage_path, d.file_url);
end $$;

revoke all on function public.lanceur_fournisseur_document(jsonb), public.lanceur_bon_facture(jsonb), public.lanceur_bon_factures(uuid), public.lanceur_maintenance_document(uuid) from public, anon;
grant execute on function public.lanceur_fournisseur_document(jsonb), public.lanceur_bon_facture(jsonb), public.lanceur_bon_factures(uuid), public.lanceur_maintenance_document(uuid) to authenticated;
