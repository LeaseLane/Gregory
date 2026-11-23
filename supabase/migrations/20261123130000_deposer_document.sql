-- Clients · Documents : « Déposer un document » en un geste (retour de Greg, 23 nov. 2026 : « déposer un document c'est compliqué »).
-- Avant : aucun bouton sur Clients › Documents; seul le dossier d'un locataire acceptait un fichier, et rien pour un propriétaire.
-- Maintenant : un tiroir (glisser-déposer, plusieurs fichiers) → pour qui (propriétaire, locataire ou immeuble, par recherche) → type
-- (deviné par le nom du fichier) → visible ou non par le client. Les fichiers vont dans le dossier « portail » de la personne.
--  - lanceur_document_cibles(q) : recherche des destinataires (clients.lire);
--  - lanceur_document_deposer(p) : inscrit le document; le chemin doit être celui du dossier de la cible (pas de fichier rangé ailleurs);
--  - stockage : l'équipe écrit et lit aussi dans proprietaires/<id>/documents (n'existait pas);
--  - lanceur_documents : « Reçus » nomme aussi le locataire ou l'immeuble du document.

create or replace function public.lanceur_document_cibles(q text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare m text := '%' || lower(btrim(coalesce(q, ''))) || '%';
begin
  perform crm.require_aal2();
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès aux clients.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(q, ''))) < 2 then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(x) from (
    (select jsonb_build_object('cible', 'proprietaire', 'id', o.id, 'libelle', o.full_name, 'sous', coalesce(o.company_name, o.email)) x from public.owners o
      where lower(o.full_name) like m or lower(coalesce(o.company_name, '')) like m order by o.full_name limit 5)
    union all
    (select jsonb_build_object('cible', 'locataire', 'id', t.id, 'libelle', t.full_name, 'sous', t.email) from public.tenants t
      where t.anonymized_at is null and lower(t.full_name) like m order by t.full_name limit 5)
    union all
    (select jsonb_build_object('cible', 'immeuble', 'id', b.id, 'libelle', b.address, 'sous', (select full_name from public.owners where id = b.owner_id), 'proprietaire_id', b.owner_id) from public.buildings b
      where lower(b.address) like m order by b.address limit 5)) z), '[]'::jsonb);
end $$;

create or replace function public.lanceur_document_deposer(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_cible text := p ->> 'cible'; v_id uuid := nullif(p ->> 'id', '')::uuid; v_chemin text := btrim(coalesce(p ->> 'chemin', ''));
  v_type text := coalesce(nullif(p ->> 'type', ''), 'autre'); v_titre text := nullif(btrim(p ->> 'titre'), ''); v_owner uuid; v_doc uuid; v_prefixe text;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de déposer un document.' using errcode = 'PT403'; end if;
  if v_titre is null then raise exception 'Titre requis.' using errcode = 'PT422'; end if;
  if v_type not in ('bail', 'mandat', 'reglement', 'rapport', 'facture', 'autre') then raise exception 'Type de document inconnu.' using errcode = 'PT422'; end if;
  if v_cible = 'proprietaire' then
    if not exists (select 1 from public.owners where id = v_id) then raise exception 'Propriétaire introuvable.' using errcode = 'PT404'; end if;
    v_owner := v_id; v_prefixe := 'proprietaires/' || v_id || '/documents/';
  elsif v_cible = 'locataire' then
    if not exists (select 1 from public.tenants where id = v_id and anonymized_at is null) then raise exception 'Locataire introuvable.' using errcode = 'PT404'; end if;
    v_prefixe := 'locataires/' || v_id || '/documents/';
  elsif v_cible = 'immeuble' then
    select owner_id into v_owner from public.buildings where id = v_id;
    if v_owner is null then raise exception 'Immeuble introuvable (ou sans propriétaire).' using errcode = 'PT404'; end if;
    v_prefixe := 'proprietaires/' || v_owner || '/immeubles/' || v_id || '/';
  else raise exception 'Choisissez à qui appartient le document.' using errcode = 'PT422'; end if;
  if left(v_chemin, length(v_prefixe)) <> v_prefixe or v_chemin ~ '\.\.' then raise exception 'Fichier hors du dossier du client.' using errcode = 'PT422'; end if;
  insert into public.documents (owner_id, tenant_id, building_id, title, doc_type, category, visibility, storage_bucket, storage_path, file_url, size_bytes, added_by)
  values (v_owner, case when v_cible = 'locataire' then v_id end, case when v_cible = 'immeuble' then v_id end, left(v_titre, 200), v_type, v_type,
          case when coalesce((p ->> 'visible')::boolean, true) then 'tous' else 'prive' end, 'portail', v_chemin, v_chemin, nullif(p ->> 'taille', '')::bigint, auth.uid())
  returning id into v_doc;
  perform crm.journal('document.uploaded', 'public.documents', v_doc, null, jsonb_build_object('cible', v_cible, 'id', v_id, 'type', v_type, 'titre', v_titre), 'upload-document');
  return v_doc;
end $$;

revoke all on function public.lanceur_document_cibles(text), public.lanceur_document_deposer(jsonb) from public, anon;
grant execute on function public.lanceur_document_cibles(text), public.lanceur_document_deposer(jsonb) to authenticated;

drop policy if exists "equipe ecrit dans les documents d'un proprietaire" on storage.objects;
create policy "equipe ecrit dans les documents d'un proprietaire" on storage.objects for insert to authenticated
  with check (bucket_id = 'portail' and (storage.foldername(name))[1] = 'proprietaires' and (storage.foldername(name))[3] = 'documents' and crm.can('clients.ecrire'));
drop policy if exists "equipe lit les documents d'un proprietaire" on storage.objects;
create policy "equipe lit les documents d'un proprietaire" on storage.objects for select to authenticated
  using (bucket_id = 'portail' and (storage.foldername(name))[1] = 'proprietaires' and (storage.foldername(name))[3] = 'documents' and crm.can('clients.lire'));

do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.lanceur_documents()'::regprocedure);
  if position('portee.tenants where id = d.tenant_id' in d) > 0 then return; end if;
  n := replace(d, '(select t.full_name from portee.leases l join portee.tenants t on t.id = l.tenant_id where l.id = d.lease_id))',
    '(select t.full_name from portee.leases l join portee.tenants t on t.id = l.tenant_id where l.id = d.lease_id),
                 (select full_name from portee.tenants where id = d.tenant_id), (select address from portee.buildings where id = d.building_id))');
  if n = d then raise exception 'lanceur_documents : ancre introuvable'; end if;
  execute n;
end $$;
