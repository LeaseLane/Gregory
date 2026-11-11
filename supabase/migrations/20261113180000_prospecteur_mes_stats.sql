-- Mes prospects · « Mes stats » du prospecteur (comme l'ancien portail, caller-api my_stats) : appels aujourd'hui, 7 derniers jours,
-- relances en retard, prospects. Ses prospects = assignés ou créés par lui. Jours à l'heure du Québec. Null pour qui n'est pas prospecteur.
create or replace function public.lanceur_mes_stats() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_c uuid := public.auth_cold_caller_id(); v_auj date := (now() at time zone 'America/Toronto')::date;
begin
  if v_c is null then return null; end if;
  return (select jsonb_build_object(
      'prospects', count(distinct p.id),
      'appels_aujourdhui', count(h.d) filter (where h.d = v_auj),
      'appels_semaine', count(h.d) filter (where h.d > v_auj - 7),
      'relances_retard', count(distinct p.id) filter (where p.next_followup_date < v_auj and coalesce(p.stage, 'new') not in ('signed', 'lost')),
      'relances_aujourdhui', count(distinct p.id) filter (where p.next_followup_date = v_auj and coalesce(p.stage, 'new') not in ('signed', 'lost')))
    from public.prospects p
    left join lateral (select ((c ->> 'date')::timestamptz at time zone 'America/Toronto')::date d
      from jsonb_array_elements(case when jsonb_typeof(p.call_history) = 'array' then p.call_history else '[]'::jsonb end) c where c ->> 'date' is not null) h on true
    where v_c in (p.assigned_caller_id, p.created_by_caller_id) and p.archived_at is null and p.anonymized_at is null);
end $$;
revoke all on function public.lanceur_mes_stats() from public, anon;
grant execute on function public.lanceur_mes_stats() to authenticated;
