-- T3 · Import : sans liste « créer quand même », un doublon est bien ignoré (null traité comme faux).
create or replace function crm.import_contacts(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l record; v_source uuid; v_rapport jsonb := '[]'::jsonb; v_mail text; v_tel text; v_portes int; v_dbl uuid; v_contact uuid; v_prospect uuid;
  v_leads int := 0; v_contacts int := 0; v_ignores int := 0; v_erreurs int := 0; v_consent int := 0; v_import uuid := gen_random_uuid();
begin
  perform crm.require_aal2();
  if not crm.can('ventes.mandats.ecrire') then raise exception 'Votre rôle ne permet pas d’importer.' using errcode = 'PT403'; end if;
  if jsonb_array_length(p -> 'lignes') > 2000 then raise exception 'Fichier trop gros (2 000 lignes au plus).' using errcode = 'PT422'; end if;
  if coalesce(btrim(p ->> 'source'), '') = '' then raise exception 'Indiquez la source des contacts.' using errcode = 'PT422'; end if;
  insert into crm.sources (code, name) values ('csv:' || lower(regexp_replace(btrim(p ->> 'source'), '\W+', '-', 'g')), btrim(p ->> 'source'))
  on conflict (code) do update set name = excluded.name returning id into v_source;

  for l in select (x.i - 1)::int as i, x.v from jsonb_array_elements(p -> 'lignes') with ordinality x(v, i) loop
    v_mail := lower(nullif(btrim(l.v ->> 'courriel'), '')); v_tel := crm.normaliser_tel(l.v ->> 'telephone');
    v_portes := case when coalesce(l.v ->> 'portes', '') ~ '^\s*\d{1,4}\s*$' then (l.v ->> 'portes')::int end;
    if coalesce(btrim(l.v ->> 'nom'), '') = '' then
      v_erreurs := v_erreurs + 1; v_rapport := v_rapport || jsonb_build_object('ligne', l.i, 'etat', 'erreur', 'raison', 'Nom manquant'); continue;
    end if;
    if v_mail is not null and v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
      v_erreurs := v_erreurs + 1; v_rapport := v_rapport || jsonb_build_object('ligne', l.i, 'etat', 'erreur', 'raison', 'Courriel incomplet : « ' || v_mail || ' »'); continue;
    end if;
    select x.id into v_dbl from crm.contacts x where x.merged_into is null and x.anonymized_at is null
      and ((v_mail is not null and v_mail = any(x.emails)) or (v_tel is not null and v_tel = any(x.phones_e164))) limit 1;
    if v_dbl is not null and not coalesce(p -> 'creer_doublons', '[]'::jsonb) @> to_jsonb(l.i) then
      v_ignores := v_ignores + 1; v_rapport := v_rapport || jsonb_build_object('ligne', l.i, 'etat', 'ignoree', 'raison', 'Déjà connu', 'contact_id', v_dbl); continue;
    end if;
    if nullif(btrim(l.v ->> 'immeuble'), '') is not null or v_portes is not null then
      insert into public.prospects (full_name, email, phone, num_doors, notes, lead_source, stage)
      values (btrim(l.v ->> 'nom'), v_mail, l.v ->> 'telephone', v_portes, nullif(btrim(l.v ->> 'immeuble'), ''), btrim(p ->> 'source'), 'new') returning id into v_prospect;
      update crm.deals set source_id = v_source, subtitle = coalesce(nullif(btrim(l.v ->> 'immeuble'), ''), subtitle) where prospect_id = v_prospect;
      v_leads := v_leads + 1; v_rapport := v_rapport || jsonb_build_object('ligne', l.i, 'etat', 'lead', 'deal_id', (select id from crm.deals where prospect_id = v_prospect));
    else
      insert into crm.contacts (full_name, emails, phones_e164) values (btrim(l.v ->> 'nom'), array_remove(array[v_mail], null), array_remove(array[v_tel], null)) returning id into v_contact;
      insert into crm.activities (contact_id, type, title, body, author_user_id) values (v_contact, 'creation', 'Contact importé', btrim(p ->> 'source'), auth.uid());
      v_contacts := v_contacts + 1; v_rapport := v_rapport || jsonb_build_object('ligne', l.i, 'etat', 'contact', 'contact_id', v_contact);
    end if;
    if coalesce((p ->> 'consentement_confirme')::boolean, false) and coalesce((l.v ->> 'consentement')::boolean, false) and v_mail is not null then
      insert into comms.consents (channel, address, basis, source, proof)
      values ('email', v_mail, 'express', 'import:' || btrim(p ->> 'source'), jsonb_build_object('fichier', p ->> 'fichier', 'ligne', l.i + 1, 'confirme_par', auth.uid(), 'nom', crm.nom_membre(auth.uid()), 'le', now(), 'import', v_import));
      v_consent := v_consent + 1;
    end if;
  end loop;
  perform crm.journal('contacts.imported', 'crm.contacts', null, null, jsonb_build_object('fichier', p ->> 'fichier', 'source', p ->> 'source', 'leads', v_leads, 'contacts', v_contacts,
    'ignorees', v_ignores, 'erreurs', v_erreurs, 'consentements', v_consent, 'import', v_import), 'create-import');
  return jsonb_build_object('leads', v_leads, 'contacts', v_contacts, 'ignorees', v_ignores, 'erreurs', v_erreurs, 'consentements', v_consent, 'rapport', v_rapport);
end $$;

