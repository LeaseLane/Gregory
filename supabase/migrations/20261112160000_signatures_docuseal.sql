-- Signature électronique par DocuSeal (code ouvert, Coolify de TWIM) au lieu d'eZsign (2026-11-09, décision d'Octa).
-- La fonction « signatures » crée la soumission DocuSeal (sans courriel de DocuSeal) puis appelle service_inviter_signataires :
-- le lien Lease Lane de chaque signataire est gardé et LOC-11 (« Document à signer ») lui est envoyé par la file.
alter table crm.signature_signers add column if not exists lien text, add column if not exists provider_submitter_id text;

create or replace function public.service_inviter_signataires(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r crm.signature_requests; x jsonb; s crm.signature_signers; n int := 0;
  mois text[] := array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
begin
  select * into r from crm.signature_requests where id = (p ->> 'id')::uuid;
  if not found then raise exception 'Enveloppe introuvable.' using errcode = 'PT404'; end if;
  for x in select * from jsonb_array_elements(coalesce(p -> 'signataires', '[]'::jsonb)) loop
    update crm.signature_signers set lien = x ->> 'lien', provider_submitter_id = x ->> 'submitter_id'
     where request_id = r.id and ord = (x ->> 'ord')::int returning * into s;
    continue when s.id is null or coalesce(s.email, '') = '';
    perform comms.enqueue(jsonb_build_object('template_code', 'LOC-11', 'channel', 'email', 'recipient', s.email, 'entity_type', 'crm.signature_requests', 'entity_id', r.id,
      'canal_journal', 'interface', 'idempotency_key', 'loc11:' || s.id || ':' || coalesce(x ->> 'submitter_id', ''),
      'vars', jsonb_build_object('prenom', split_part(s.name, ' ', 1),
        'type_document', case r.kind when 'mandat' then 'mandat de gestion' when 'bail' then 'bail' when 'avenant_cession' then 'avenant de cession'
                                     when 'avis_renouvellement' then 'avis de renouvellement' else 'document' end,
        'document', r.title, 'details_document', coalesce(r.subtitle, ''),
        'date_envoi', extract(day from now() at time zone 'America/Toronto')::int || ' ' || mois[extract(month from now() at time zone 'America/Toronto')::int],
        'gestionnaire', crm.nom_membre(r.sent_by),
        'initiales_gestionnaire', upper(left(split_part(crm.nom_membre(r.sent_by), ' ', 1), 1) || left(split_part(crm.nom_membre(r.sent_by), ' ', 2), 1)),
        'lien_signature', x ->> 'lien')));
    n := n + 1;
  end loop;
  perform crm.journal('signature.invitations', 'crm.signature_requests', r.id, null, jsonb_build_object('courriels', n, 'fournisseur', r.provider), 'send-signature-request', 'api', null, 'system');
  return jsonb_build_object('invitations', n);
end $$;

create or replace function public.service_signature_dossier(p_id uuid) returns text language sql stable security definer set search_path = '' as $$
  select provider_folder_id from crm.signature_requests where id = p_id and provider = 'docuseal'
$$;

revoke all on function public.service_inviter_signataires(jsonb), public.service_signature_dossier(uuid) from public, anon, authenticated;
grant execute on function public.service_inviter_signataires(jsonb), public.service_signature_dossier(uuid) to service_role;
