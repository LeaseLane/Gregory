-- T3 · Raisons de perte actives pour la fenêtre e14 (schéma crm non exposé à l'API).
create or replace function public.lanceur_raisons_perte() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when crm.is_team_member() then coalesce((select jsonb_agg(jsonb_build_object('code', code, 'label', label) order by sort) from crm.loss_reasons where active), '[]'::jsonb) else '[]'::jsonb end
$$;
revoke all on function public.lanceur_raisons_perte() from public, anon;
grant execute on function public.lanceur_raisons_perte() to authenticated;
