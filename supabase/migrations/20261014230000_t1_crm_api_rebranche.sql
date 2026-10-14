-- T1 · Rebranchement de crm-api (spec § 6) : la voie humaine et la voie des agents passent par les mêmes opérations.
--
-- 1. update_stage (portail admin actuel) → crm.move_prospect_stage, par lanceur_herite_deplacer_prospect.
--    crm-api a déjà vérifié la personne (jeton, is_admin, 2FA selon requireUserWithMfa et sa protection
--    anti-verrouillage : en production, aucun admin n'a encore inscrit de facteur). L'opération ne réexige donc
--    pas l'aal2 sur ce canal hérité : le drapeau crm.via_herite le signale, posé ici seulement, appelable par la
--    clé de service seulement. L'identité de la personne est rétablie (request.jwt.claims) pour crm.can() et le journal.
-- 2. add_call → crm.create_proposal('update-prospect-followup') par lanceur_proposer (clé de service seulement).

create or replace function crm.require_aal2_or_proposal() returns void
language plpgsql stable set search_path = '' as $$
begin
  if coalesce(current_setting('crm.via_proposal', true), '') = 'on' then return; end if;
  if coalesce(current_setting('crm.via_herite', true), '') = 'on' then return; end if; -- crm-api a vérifié la 2FA (voir en-tête)
  perform crm.require_aal2();
end $$;

create or replace function public.lanceur_herite_deplacer_prospect(p jsonb, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v jsonb;
begin
  if p_user is null then raise exception 'Personne inconnue.' using errcode = 'PT403'; end if;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  perform set_config('crm.via_herite', 'on', true);
  v := crm.move_prospect_stage(p);
  perform set_config('crm.via_herite', '', true);
  return v;
end $$;

create or replace function public.lanceur_proposer(p jsonb) returns jsonb
language sql security definer set search_path = '' as $$
  select to_jsonb(crm.create_proposal(p));
$$;

revoke all on function public.lanceur_herite_deplacer_prospect(jsonb, uuid), public.lanceur_proposer(jsonb) from public, anon, authenticated;
grant execute on function public.lanceur_herite_deplacer_prospect(jsonb, uuid), public.lanceur_proposer(jsonb) to service_role;
