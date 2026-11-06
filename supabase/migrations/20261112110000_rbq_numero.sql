-- Grégory, 2026-11-06 : « Je suis pas capable de mettre une licence RBQ dans la plateforme. » Le dépôt « Licence RBQ » de la fiche
-- fournisseur prenait un fichier et une date, jamais le NUMÉRO : la fiche restait « Requise · manquante ». Maintenant : le numéro
-- (10 chiffres, écrit 1234-5678-90) est enregistré sur le fournisseur; le fichier devient facultatif pour une licence RBQ (le numéro
-- se vérifie au registre public de la RBQ).
create or replace function public.lanceur_fournisseur_document(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare w public.workers; v_type text := coalesce(p ->> 'type', 'autre'); v_exp date := nullif(p ->> 'expiration', '')::date; v_id uuid; v_titre text;
  v_chemin text := nullif(p ->> 'chemin', ''); v_num text := regexp_replace(coalesce(p ->> 'numero', ''), '\D', '', 'g');
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un fournisseur.' using errcode = 'PT403'; end if;
  select * into w from public.workers where id = (p ->> 'worker_id')::uuid;
  if not found then raise exception 'Fournisseur introuvable.' using errcode = 'PT404'; end if;
  if v_type not in ('assurance', 'rbq', 'autre') then raise exception 'Type de document inconnu.' using errcode = 'PT422'; end if;
  if v_type = 'rbq' then
    if v_num = '' and w.rbq_license is null then raise exception 'Le numéro de licence RBQ est requis.' using errcode = 'PT422'; end if;
    if v_num <> '' and length(v_num) <> 10 then raise exception 'Le numéro RBQ a 10 chiffres (1234-5678-90).' using errcode = 'PT422'; end if;
  elsif v_chemin is null then raise exception 'Fichier requis.' using errcode = 'PT422';
  end if;
  if v_chemin is not null and (v_chemin not like 'workers/' || w.id || '/%' or v_chemin like '%..%') then
    raise exception 'Fichier hors du dossier de ce fournisseur.' using errcode = 'PT403';
  end if;
  if v_type = 'rbq' then
    update public.workers set rbq_license = case when v_num <> '' then substr(v_num, 1, 4) || '-' || substr(v_num, 5, 4) || '-' || substr(v_num, 9, 2) else rbq_license end,
      rbq_license_expiry = coalesce(v_exp, rbq_license_expiry), requires_rbq = true where id = w.id;
  end if;
  if v_chemin is not null then
    v_titre := case v_type when 'assurance' then 'Attestation d’assurance' when 'rbq' then 'Licence RBQ' else coalesce(nullif(left(btrim(p ->> 'titre'), 200), ''), 'Document') end
      || case when v_exp is not null then ' · au ' || to_char(v_exp, 'DD/MM/YYYY') else '' end;
    insert into public.documents (worker_id, title, doc_type, visibility, storage_bucket, storage_path, file_url, size_bytes, added_by)
    values (w.id, v_titre, case v_type when 'assurance' then 'assurance_travailleur' when 'rbq' then 'licence_rbq' else 'autre' end, 'prive',
            'documents', v_chemin, v_chemin, nullif(p ->> 'taille', '')::bigint, auth.uid())
    returning id into v_id;
  end if;
  if v_type = 'assurance' then
    update public.workers set insurance_document_id = v_id, insurance_expiry = coalesce(v_exp, insurance_expiry) where id = w.id;
  end if;
  perform crm.journal('worker.document_added', 'public.workers', w.id, null, jsonb_build_object('document', v_id, 'type', v_type, 'expiration', v_exp, 'rbq', nullif(v_num, '')), 'add-worker-document');
  return v_id;
end $$;
