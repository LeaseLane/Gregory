-- Nouveau client (Grégory, 2026-11-08) : le courriel d'un LOCATAIRE devient facultatif (un locataire réel n'en a pas toujours; l'ancien
-- admin le permettait). Requis pour un propriétaire, et pour un locataire qu'on invite au portail. Copie de 20261029090000 sinon.

create or replace function public.lanceur_creer_client(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v uuid; v_mail text := nullif(lower(btrim(p ->> 'courriel')), ''); v_inv jsonb; x jsonb;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de créer un client.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(p ->> 'nom', ''))) < 2 then raise exception 'Nom requis.' using errcode = 'PT422'; end if;
  if v_mail is not null and v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Courriel invalide.' using errcode = 'PT422'; end if;
  if v_mail is null and (p ->> 'type' = 'proprietaire' or coalesce((p ->> 'inviter')::boolean, false)) then
    raise exception '%', case when p ->> 'type' = 'proprietaire' then 'Courriel requis pour un propriétaire.' else 'Courriel requis pour inviter au portail.' end using errcode = 'PT422';
  end if;
  if p ->> 'type' = 'proprietaire' then
    if exists (select 1 from public.owners o left join auth.users u on u.id = o.user_id where lower(coalesce(o.email, u.email)) = v_mail) then
      raise exception 'Un propriétaire existe déjà avec ce courriel.' using errcode = 'PT409'; end if;
    insert into public.owners (full_name, company_name, email, phone, language, responsable_id, spending_cap, management_rate)
    values (btrim(p ->> 'nom'), nullif(btrim(p ->> 'entreprise'), ''), v_mail, nullif(btrim(p ->> 'telephone'), ''), coalesce(p ->> 'langue', 'fr'), coalesce((p ->> 'responsable_id')::uuid, auth.uid()),
            500, (crm.parametres_honoraires(current_date)).gestion_pct) returning id into v;
    for x in select * from jsonb_array_elements(coalesce(p -> 'immeubles', '[]'::jsonb)) loop
      if x ? 'id' then update public.buildings set owner_id = v where id = (x ->> 'id')::uuid and owner_id is null;
      elsif char_length(btrim(coalesce(x ->> 'adresse', ''))) >= 5 then
        insert into public.buildings (owner_id, address, unit_count, zone) values (v, btrim(x ->> 'adresse'), greatest(1, coalesce((x ->> 'logements')::int, 1)), nullif(btrim(x ->> 'secteur'), ''));
      end if;
    end loop;
  elsif p ->> 'type' = 'locataire' then
    if exists (select 1 from public.tenants where lower(email) = v_mail and anonymized_at is null) then raise exception 'Un locataire existe déjà avec ce courriel.' using errcode = 'PT409'; end if;
    insert into public.tenants (full_name, email, phone, language) values (btrim(p ->> 'nom'), v_mail, nullif(btrim(p ->> 'telephone'), ''), coalesce(p ->> 'langue', 'fr')) returning id into v;
  else raise exception 'Type de client inconnu.' using errcode = 'PT422'; end if;
  -- Consentements : seulement sur accord exprès déclaré par la personne de l'équipe (date, source et auteur au journal).
  if coalesce((p ->> 'consentement_courriel')::boolean, false) and v_mail is not null then
    insert into comms.consents (channel, address, purpose, basis, source, proof) values ('email', v_mail, 'commercial', 'express', 'lanceur', jsonb_build_object('par', auth.uid(), 'le', now()));
  end if;
  if coalesce((p ->> 'consentement_sms')::boolean, false) and nullif(btrim(p ->> 'telephone'), '') is not null then
    insert into comms.consents (channel, address, purpose, basis, source, proof) values ('sms', btrim(p ->> 'telephone'), 'commercial', 'express', 'lanceur', jsonb_build_object('par', auth.uid(), 'le', now()));
  end if;
  perform crm.journal(case when p ->> 'type' = 'proprietaire' then 'owner.created' else 'tenant.created' end, case when p ->> 'type' = 'proprietaire' then 'public.owners' else 'public.tenants' end, v, null, p - 'telephone', 'create-client');
  if coalesce((p ->> 'inviter')::boolean, false) then
    v_inv := public.lanceur_inviter_portail(case when p ->> 'type' = 'proprietaire' then jsonb_build_object('owner_id', v, 'courriel', v_mail) else jsonb_build_object('tenant_id', v) end);
  end if;
  return jsonb_build_object('id', v, 'type', p ->> 'type', 'invitation', v_inv);
end $$;

