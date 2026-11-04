-- Accord de DPA signé sur papier ou en PDF (Octa, 2026-11-04) : Finances › Prélèvements › « Saisir un accord papier ».
-- L'équipe des finances dépose l'original signé (dossier locataires/<id>/dpa/, jamais visible du propriétaire ni des autres rôles),
-- saisit les coordonnées bancaires, le montant (fixe, ou variable = loyer du bail) et la date de signature. L'accord suit ensuite
-- exactement le chemin d'un accord signé dans le portail : lots BMO, avis de 10 jours, annulation par le locataire dans son portail.
-- Trace : texte conservé tel quel, date de signature, personne qui a saisi, original joint, journal (compte masqué).

alter table public.tenant_pad_authorizations
  add column if not exists signe_le date,
  add column if not exists saisi_par uuid references auth.users(id),
  add column if not exists document_id uuid references public.documents(id) on delete set null;

-- ── Stockage : l'original signé, lu et déposé par les finances seulement (il porte le numéro de compte complet) ──
drop policy if exists "finances depose un accord DPA papier" on storage.objects;
create policy "finances depose un accord DPA papier" on storage.objects for insert to authenticated
  with check (bucket_id = 'portail' and (storage.foldername(name))[1] = 'locataires' and (storage.foldername(name))[3] = 'dpa' and crm.can('finances.paiements.ecrire'));
drop policy if exists "finances lit les accords DPA papier" on storage.objects;
create policy "finances lit les accords DPA papier" on storage.objects for select to authenticated
  using (bucket_id = 'portail' and (storage.foldername(name))[1] = 'locataires' and (storage.foldername(name))[3] = 'dpa' and crm.can('finances.lire'));

-- Un dépôt dont la saisie échoue est effacé aussitôt (aucune coordonnée bancaire orpheline).
drop policy if exists "finances retire un accord DPA papier non saisi" on storage.objects;
create policy "finances retire un accord DPA papier non saisi" on storage.objects for delete to authenticated
  using (bucket_id = 'portail' and (storage.foldername(name))[1] = 'locataires' and (storage.foldername(name))[3] = 'dpa' and crm.can('finances.paiements.ecrire')
         and not exists (select 1 from public.documents d where d.storage_path = storage.objects.name));

-- ── Baux actifs sans prélèvement en vigueur (liste du formulaire) ──
create or replace function public.lanceur_dpa_baux() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas de saisir un accord de prélèvement.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('lease_id', l.id, 'tenant_id', t.id, 'locataire', t.full_name,
      'logement', b.address || coalesce(' — ' || u.unit_number, ''), 'loyer', l.monthly_rent, 'premier', crm.premier_dpa(l.id)) order by t.full_name)
    from public.leases l join public.tenants t on t.id = l.tenant_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
    where l.status = 'active' and t.anonymized_at is null
      and not exists (select 1 from public.tenant_pad_authorizations a where a.lease_id = l.id and a.status = 'active' and a.revoked_at is null and a.texte is not null)), '[]'::jsonb);
end $$;

-- p : lease_id, titulaire, institution, transit, compte, type (fixe | variable), montant (fixe), signe_le (AAAA-MM-JJ),
--     premier (AAAA-MM-JJ, facultatif : jamais plus tôt que le premier loyer à 10 jours), chemin (original déposé), taille.
create or replace function public.lanceur_dpa_papier(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare l public.leases; v_t public.tenants; v_id uuid; v_doc uuid; v_m numeric; v_premier date; v_signe date; v_texte text; v_type text := coalesce(p ->> 'type', 'fixe');
  v_tit text := btrim(coalesce(p ->> 'titulaire', '')); v_inst text := regexp_replace(coalesce(p ->> 'institution', ''), '\D', '', 'g');
  v_tr text := regexp_replace(coalesce(p ->> 'transit', ''), '\D', '', 'g'); v_cpt text := regexp_replace(coalesce(p ->> 'compte', ''), '\D', '', 'g');
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas de saisir un accord de prélèvement.' using errcode = 'PT403'; end if;
  select * into l from public.leases where id = (p ->> 'lease_id')::uuid and status = 'active';
  if not found then raise exception 'Bail actif introuvable.' using errcode = 'PT404'; end if;
  select * into v_t from public.tenants where id = l.tenant_id;
  if v_t.anonymized_at is not null then raise exception 'Ce locataire est anonymisé (Loi 25).' using errcode = 'PT409'; end if;
  if exists (select 1 from public.tenant_pad_authorizations where lease_id = l.id and status = 'active' and revoked_at is null and texte is not null) then
    raise exception 'Un prélèvement est déjà en place pour ce bail.' using errcode = 'PT409';
  end if;
  if length(v_tit) < 2 or length(v_tit) > 30 then raise exception 'Nom du titulaire du compte requis (30 caractères au plus).' using errcode = 'PT422'; end if;
  if v_inst !~ '^\d{3}$' or v_tr !~ '^\d{5}$' or v_cpt !~ '^\d{5,12}$' then
    raise exception 'Coordonnées invalides : institution 3 chiffres, transit 5 chiffres, compte 5 à 12 chiffres.' using errcode = 'PT422';
  end if;
  if v_type not in ('fixe', 'variable') then raise exception 'Montant fixe ou variable ?' using errcode = 'PT422'; end if;
  v_m := case when v_type = 'fixe' then nullif(p ->> 'montant', '')::numeric else l.monthly_rent end;
  if coalesce(v_m, 0) <= 0 then raise exception 'Montant requis (loyer du bail inconnu ?).' using errcode = 'PT422'; end if;
  v_signe := nullif(p ->> 'signe_le', '')::date;
  if v_signe is null or v_signe > current_date or v_signe < current_date - 90 then
    raise exception 'Date de signature requise : aujourd’hui ou dans les 90 derniers jours.' using errcode = 'PT422';
  end if;
  -- Le premier débit vient au moins 10 jours après la confirmation (la saisie rend l'accord visible au locataire dans son portail).
  v_premier := greatest(crm.premier_dpa(l.id), coalesce(nullif(p ->> 'premier', '')::date, '-infinity'::date));
  -- L'original signé est obligatoire : c'est la preuve de l'autorisation.
  if coalesce(p ->> 'chemin', '') not like 'locataires/' || v_t.id || '/dpa/%' or p ->> 'chemin' like '%..%' then
    raise exception 'Joignez l’accord signé (PDF ou photo).' using errcode = 'PT422';
  end if;
  insert into public.documents (owner_id, lease_id, tenant_id, title, category, visibility, storage_bucket, storage_path, size_bytes, added_by)
  values (null, null, v_t.id, 'Accord de DPA signé le ' || to_char(v_signe, 'DD/MM/YYYY'), 'dpa', 'prive', 'portail', p ->> 'chemin', nullif(p ->> 'taille', '')::bigint, auth.uid())
  returning id into v_doc;
  v_texte := crm.texte_dpa(l.id, v_tit, v_inst, v_tr, v_cpt, v_m, v_premier);
  if v_type = 'variable' then
    v_texte := replace(v_texte, 'd’un montant fixe de ' || replace(to_char(v_m, 'FM999990.00'), '.', ',') || ' $',
                       'du loyer prévu au bail en vigueur (montant variable, ' || replace(to_char(v_m, 'FM999990.00'), '.', ',') || ' $ au départ)');
  end if;
  v_texte := v_texte || E'\n\n' || 'Accord signé sur papier par ' || v_tit || ' le ' || to_char(v_signe, 'DD/MM/YYYY') || '; saisi par ' || coalesce(crm.nom_membre(auth.uid()), 'l’équipe Lease Lane')
    || ' le ' || to_char(now() at time zone 'America/Toronto', 'DD/MM/YYYY à HH24:MI') || '. Original conservé au dossier.';
  insert into public.tenant_pad_authorizations (lease_id, tenant_id, status, consented_at, consent_method, processor, revoked_at, titulaire, institution, transit, compte,
    montant, montant_avis_le, premier_prelevement, texte, signe_ip, signe_agent, signe_le, saisi_par, document_id)
  values (l.id, v_t.id, 'active', v_signe::timestamptz, 'papier', 'bmo', null, v_tit, v_inst, v_tr, v_cpt, v_m, null, v_premier, v_texte, null, null, v_signe, auth.uid(), v_doc)
  on conflict (lease_id) do update set tenant_id = excluded.tenant_id, status = 'active', consented_at = excluded.consented_at, consent_method = excluded.consent_method,
    processor = excluded.processor, revoked_at = null, titulaire = excluded.titulaire, institution = excluded.institution, transit = excluded.transit, compte = excluded.compte,
    montant = excluded.montant, montant_avis_le = null, premier_prelevement = excluded.premier_prelevement, texte = excluded.texte, signe_ip = null, signe_agent = null,
    signe_le = excluded.signe_le, saisi_par = excluded.saisi_par, document_id = excluded.document_id
  returning id into v_id;
  perform crm.journal('pad.paper_entered', 'public.tenant_pad_authorizations', v_id, null,
    jsonb_build_object('locataire', v_t.id, 'montant', v_m, 'type', v_type, 'signe_le', v_signe, 'premier', v_premier, 'compte', '••• ' || right(v_cpt, 3), 'document', v_doc), 'enter-paper-pad');
  return jsonb_build_object('premier', v_premier, 'montant', v_m);
end $$;

revoke all on function public.lanceur_dpa_baux(), public.lanceur_dpa_papier(jsonb) from public, anon;
grant execute on function public.lanceur_dpa_baux(), public.lanceur_dpa_papier(jsonb) to authenticated;
