-- Ventes › Mes prospects (Octa, 2026-11-04) : le pipeline des mandats limité aux deals dont la personne connectée est responsable.
-- Pas de rôle à part : le prospecteur est un membre de l'équipe (rôle « prospection »). Remplace l'essai 20261111160000.
drop function if exists public.lanceur_prospects_prospecteurs();

-- « Nouveau prospect » depuis Mes prospects : même création qu'un lead des mandats (crm.create_lead), responsable = la personne qui le crée.
create or replace function public.lanceur_creer_mon_prospect(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r jsonb;
begin
  r := crm.create_lead(coalesce(p, '{}'::jsonb) || '{"pipeline":"mandats"}');   -- 2FA, droit ventes.mandats.ecrire, validations, journal
  update crm.deals set owner_user_id = auth.uid(), updated_at = now() where id = (r ->> 'deal_id')::uuid;
  return r || jsonb_build_object('owner', crm.nom_membre(auth.uid()));
end $$;
revoke all on function public.lanceur_creer_mon_prospect(jsonb) from public, anon;
grant execute on function public.lanceur_creer_mon_prospect(jsonb) to authenticated;
