-- « Inscriptions du site » dans l'admin (Maintenance › Recrutement), dispatch d'abord (Grégory, 2026-11-04) : l'équipe voit les
-- entreprises inscrites (nom, métiers, secteurs, RBQ, coordonnées), les met « à compléter » ou les écarte. « Inviter » et la preuve
-- d'assurance passent par les fonctions existantes (onboarding-api inviter_inscription, ops-api inscription_document).
create or replace function public.lanceur_inscriptions() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'entreprise', i.entreprise, 'courriel', i.courriel, 'telephone', i.telephone, 'poste', i.poste,
      'metiers', i.metiers, 'secteurs', i.secteurs, 'rbq', i.rbq, 'statut', i.statut, 'note', i.note, 'recue', i.created_at, 'assurance', i.fichier_chemin is not null,
      'fournisseur', i.worker_id) order by (i.statut in ('recue', 'a_completer')) desc, i.created_at desc)
    from public.inscriptions_entreprises i where i.created_at > now() - interval '12 months'), '[]'::jsonb);
end $$;

-- p : id, statut (a_completer | ecartee | recue), note.
create or replace function public.lanceur_inscription_statut(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de traiter une inscription.' using errcode = 'PT403'; end if;
  if coalesce(p ->> 'statut', '') not in ('a_completer', 'ecartee', 'recue') then raise exception 'Statut invalide.' using errcode = 'PT422'; end if;
  update public.inscriptions_entreprises x set statut = p ->> 'statut', note = coalesce(nullif(left(btrim(p ->> 'note'), 2000), ''), x.note), updated_at = now()
   where x.id = (p ->> 'id')::uuid;
  if not found then raise exception 'Inscription introuvable.' using errcode = 'PT404'; end if;
  perform crm.journal('company_signup.status', 'public.inscriptions_entreprises', (p ->> 'id')::uuid, null, jsonb_build_object('statut', p ->> 'statut'), 'company-signup-status');
end $$;

revoke all on function public.lanceur_inscriptions(), public.lanceur_inscription_statut(jsonb) from public, anon;
grant execute on function public.lanceur_inscriptions(), public.lanceur_inscription_statut(jsonb) to authenticated;
