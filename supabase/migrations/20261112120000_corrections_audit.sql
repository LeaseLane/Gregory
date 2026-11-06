-- Audit du 2026-11-06 (bugs du même genre que ceux trouvés par Grégory et Steven).
-- 1. « Corriger le type » d'un document : les types « licence_rbq » et « autre » (permis par la base depuis 20261112110100) étaient refusés.
create or replace function public.lanceur_document_valider(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare d public.documents;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de valider un document.' using errcode = 'PT403'; end if;
  select * into d from public.documents where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Document introuvable.' using errcode = 'PT404'; end if;
  if p ->> 'decision' = 'rejeter' and char_length(btrim(coalesce(p ->> 'motif', ''))) < 5 then raise exception 'Indiquez le motif du rejet.' using errcode = 'PT422'; end if;
  if p ->> 'decision' = 'corriger' and coalesce(p ->> 'type', '') not in ('bail', 'mandat', 'reglement', 'rapport', 'facture', 'assurance_travailleur', 'reference_travailleur', 'licence_rbq', 'autre') then
    raise exception 'Type de document inconnu.' using errcode = 'PT422'; end if;
  if p ->> 'decision' not in ('valider', 'corriger', 'rejeter') then raise exception 'Décision inconnue.' using errcode = 'PT422'; end if;
  update public.documents set validation_status = case when p ->> 'decision' = 'rejeter' then 'rejete' else 'valide' end, validated_by = auth.uid(), validated_at = now(),
    doc_type = case when p ->> 'decision' = 'corriger' then p ->> 'type' else doc_type end, rejection_reason = case when p ->> 'decision' = 'rejeter' then btrim(p ->> 'motif') end,
    ai_needs_human_validation = false where id = d.id;
  perform crm.journal('document.' || (p ->> 'decision'), 'public.documents', d.id, jsonb_build_object('type', d.doc_type), p, 'confirm-document-type');
end $$;

-- 2. Droit de la personne connectée, pour les fonctions edge (ops-api, onboarding-api) qui n'acceptaient que les comptes « is_admin » :
--    un gestionnaire (maintenance.ecrire) recevait « Accès refusé » sur Voir une pièce jointe, Accès au portail d'un fournisseur, Inviter.
create or replace function public.lanceur_a_le_droit(p_droit text) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt() ->> 'aal') = 'aal2', false) and crm.can(p_droit);
$$;
revoke all on function public.lanceur_a_le_droit(text) from public, anon;
grant execute on function public.lanceur_a_le_droit(text) to authenticated;
