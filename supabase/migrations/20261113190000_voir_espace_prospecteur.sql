-- « Voir son espace » (Octa, 2026-11-11) : un admin voit l'espace d'un prospecteur comme lui le voit (ses deals, ses stats), sans se
-- connecter à sa place (sa double authentification reste intacte et rien n'est fait en son nom). Chaque consultation est journalisée.
-- lanceur_mes_stats prend un prospecteur optionnel : sans argument, le prospecteur connecté (inchangé).
drop function if exists public.lanceur_mes_stats();
create or replace function public.lanceur_mes_stats(p_caller uuid default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_c uuid := coalesce(p_caller, public.auth_cold_caller_id()); v_auj date := (now() at time zone 'America/Toronto')::date; c public.cold_callers;
begin
  if v_c is null then return null; end if;
  if p_caller is not null then
    perform crm.require_aal2();
    if not crm.can('reglages.equipe') then raise exception 'Réservé aux administrateurs.' using errcode = 'PT403'; end if;
  end if;
  select * into c from public.cold_callers where id = v_c;
  return (select jsonb_build_object(
      'nom', c.full_name, 'user_id', c.user_id,
      'prospects', count(distinct p.id),
      'appels_aujourdhui', count(h.d) filter (where h.d = v_auj),
      'appels_semaine', count(h.d) filter (where h.d > v_auj - 7),
      'relances_retard', count(distinct p.id) filter (where p.next_followup_date < v_auj and coalesce(p.stage, 'new') not in ('signed', 'lost')),
      'relances_aujourdhui', count(distinct p.id) filter (where p.next_followup_date = v_auj and coalesce(p.stage, 'new') not in ('signed', 'lost')))
    from public.prospects p
    left join lateral (select ((x ->> 'date')::timestamptz at time zone 'America/Toronto')::date d
      from jsonb_array_elements(case when jsonb_typeof(p.call_history) = 'array' then p.call_history else '[]'::jsonb end) x where x ->> 'date' is not null) h on true
    where v_c in (p.assigned_caller_id, p.created_by_caller_id) and p.archived_at is null and p.anonymized_at is null);
end $$;
revoke all on function public.lanceur_mes_stats(uuid) from public, anon;
grant execute on function public.lanceur_mes_stats(uuid) to authenticated;

-- Journal de la consultation (appelé par la page « Voir son espace »).
create or replace function public.lanceur_voir_espace_prospecteur(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then raise exception 'Réservé aux administrateurs.' using errcode = 'PT403'; end if;
  perform crm.journal('prospector.space_viewed', 'public.cold_callers', p_id, null, null, 'view-prospector-space');
end $$;
revoke all on function public.lanceur_voir_espace_prospecteur(uuid) from public, anon;
grant execute on function public.lanceur_voir_espace_prospecteur(uuid) to authenticated;
