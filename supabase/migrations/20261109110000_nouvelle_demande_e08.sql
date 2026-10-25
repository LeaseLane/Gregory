-- Opérations · Nouvelle demande (e08) complète : photos déposées par l'équipe, avis SMS au locataire (LOC-02), suggestion de Cléo (fonction classer-demande).
-- Corrige aussi les SMS de LOC-02 et LOC-03 : ils gardaient le texte d'exemple de la maquette (DEM-2026-0161, Plomberie Capitale) au lieu de variables.

-- L'équipe dépose les photos d'une demande dans le dossier du locataire (ou du logement s'il est vacant), comme le portail.
drop policy if exists "equipe depose les photos de demande" on storage.objects;
create policy "equipe depose les photos de demande" on storage.objects for insert to authenticated
  with check (bucket_id = 'service-request-photos' and crm.can('maintenance.ecrire'));

update comms.email_templates set sms_text = 'Lease Lane : demande {numero_demande} reçue ({priorite}). Un technicien vous écrira avant de passer.'
where code = 'LOC-02' and sms_text like '%DEM-2026-0161%';
update comms.email_templates set sms_text = 'Lease Lane : {fournisseur} passera le {quand} ({demande}). Répondez 1 pour confirmer.'
where code = 'LOC-03' and sms_text like '%Plomberie Capitale%';

-- Locataire du logement choisi : nom, dossier des photos, et si l'avis SMS peut partir (téléphone, pas de STOP, gabarit LOC-02 actif).
create or replace function public.lanceur_demande_locataire(p_unit uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare t public.tenants;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas d’ouvrir une demande.' using errcode = 'PT403'; end if;
  select tn.* into t from public.leases l join public.tenants tn on tn.id = l.tenant_id where l.unit_id = p_unit and l.status = 'active' order by l.start_date desc limit 1;
  return jsonb_build_object('dossier', coalesce(t.id, p_unit), 'nom', t.full_name, 'telephone', t.phone is not null,
    'stop', t.phone is not null and exists (select 1 from comms.suppressions s where s.channel = 'sms' and s.address = crm.normaliser_tel(t.phone)),
    'consentement', t.phone is not null and exists (select 1 from comms.consents c where c.channel = 'sms' and c.address in (t.phone, crm.normaliser_tel(t.phone)) and c.withdrawn_at is null),
    'gabarit_actif', exists (select 1 from comms.email_templates where code = 'LOC-02' and active));
end $$;

create or replace function public.lanceur_creer_demande(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_unite uuid := (p ->> 'unit_id')::uuid; v_desc text := btrim(coalesce(p ->> 'description', '')); v_urg text := coalesce(p ->> 'urgence', 'normale'); v_loc uuid; v uuid;
  v_photos jsonb := '[]'; v_tel text; v_sms text;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas d’ouvrir une demande.' using errcode = 'PT403'; end if;
  if v_unite is null or not exists (select 1 from public.units where id = v_unite) then raise exception 'Choisissez le logement.' using errcode = 'PT422'; end if;
  if char_length(v_desc) < 10 then raise exception 'Décrivez le problème en une phrase ou deux.' using errcode = 'PT422'; end if;
  if v_urg not in ('normale', 'elevee', 'urgence') then raise exception 'Niveau d’urgence inconnu.' using errcode = 'PT422'; end if;
  select tenant_id into v_loc from public.leases where unit_id = v_unite and status = 'active' order by start_date desc limit 1;
  -- Photos : seulement des chemins du dossier de ce locataire (ou de ce logement), déjà déposés
  select coalesce(jsonb_agg(x), '[]') into v_photos from jsonb_array_elements_text(coalesce(p -> 'photos', '[]')) x
  where x like coalesce(v_loc, v_unite)::text || '/%' and exists (select 1 from storage.objects o where o.bucket_id = 'service-request-photos' and o.name = x);
  if jsonb_array_length(v_photos) > 10 then raise exception '10 photos au plus.' using errcode = 'PT422'; end if;
  insert into public.service_requests (unit_id, tenant_id, kind, title, tenant_urgency, description, ai_category, tache_responsable, photo_urls)
  values (v_unite, v_loc, 'travaux', nullif(btrim(coalesce(p ->> 'titre', '')), ''), v_urg, v_desc, nullif(p ->> 'categorie', ''), auth.uid(), v_photos)
  returning id into v;
  insert into public.audit_log (actor_type, actor_id, action, entity_type, entity_id, details)
  values ('admin', auth.uid(), 'service_request.create', 'service_requests', v, jsonb_build_object('par', 'equipe', 'declaree_par', coalesce(p ->> 'declaree_par', 'locataire'),
    'photos', jsonb_array_length(v_photos), 'suggestion_cleo', p -> 'suggestion'));
  -- Avis SMS LOC-02 : seulement si demandé, téléphone connu, pas de STOP, gabarit actif (la file applique fenêtre et coupe-circuit)
  if coalesce((p ->> 'aviser')::boolean, false) and v_loc is not null then
    select phone into v_tel from public.tenants where id = v_loc;
    if v_tel is not null and exists (select 1 from comms.email_templates where code = 'LOC-02' and active)
       and not exists (select 1 from comms.suppressions s where s.channel = 'sms' and s.address = crm.normaliser_tel(v_tel)) then
      perform comms.enqueue(jsonb_build_object('template_code', 'LOC-02', 'channel', 'sms', 'recipient', crm.normaliser_tel(v_tel), 'idempotency_key', 'demande-recue:' || v,
        'vars', jsonb_build_object('numero_demande', crm.numero_demande(v, now()), 'priorite', case v_urg when 'urgence' then 'urgence' when 'elevee' then 'prioritaire' else 'normale' end),
        'entity_type', 'public.service_requests', 'entity_id', v, 'canal_journal', 'interface'));
      v_sms := 'en_file';
    else v_sms := 'non_envoye';
    end if;
  end if;
  return jsonb_build_object('id', v, 'numero', crm.numero_demande(v, now()), 'sms', v_sms);
end $$;

revoke all on function public.lanceur_demande_locataire(uuid) from public, anon;
grant execute on function public.lanceur_demande_locataire(uuid) to authenticated;
