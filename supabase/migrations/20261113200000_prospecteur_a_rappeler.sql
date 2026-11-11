-- « À rappeler » (Octa, 2026-11-11) : module du prospecteur. Ses prospects (assignés ou créés par lui) à appeler, en quatre groupes :
-- en retard, aujourd'hui, 7 prochains jours, jamais appelés (sans date de rappel). Le dernier appel résumé et la prochaine action
-- aident à reprendre la conversation. Même règle d'accès que lanceur_mes_stats : sans argument, le prospecteur connecté; avec un
-- prospecteur, administrateurs seulement (« Voir son espace »). Jours à l'heure du Québec.
create or replace function public.lanceur_a_rappeler(p_caller uuid default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_c uuid := coalesce(p_caller, public.auth_cold_caller_id()); v_auj date := (now() at time zone 'America/Toronto')::date;
begin
  if v_c is null then return null; end if;
  if p_caller is not null then
    perform crm.require_aal2();
    if not crm.can('reglages.equipe') then raise exception 'Réservé aux administrateurs.' using errcode = 'PT403'; end if;
  end if;
  return jsonb_build_object('aujourdhui', v_auj, 'prospects', coalesce((select jsonb_agg(x order by x ->> 'groupe', x ->> 'relance' nulls last, x ->> 'nom') from (
    select jsonb_build_object('id', p.id, 'nom', p.full_name, 'entreprise', p.company_name, 'tel', p.phone, 'portes', p.num_doors, 'etape', p.stage,
      'relance', p.next_followup_date, 'prochaine_action', p.next_action, 'interet', p.interest_level,
      'groupe', case when p.next_followup_date < v_auj then '1_retard' when p.next_followup_date = v_auj then '2_aujourdhui'
                     when p.next_followup_date is not null then '3_semaine' else '4_jamais' end,
      'dernier_appel', (select jsonb_build_object('le', c ->> 'date', 'resume', coalesce(c ->> 'summary', c ->> 'transcript'))
        from jsonb_array_elements(h.a) c where c ->> 'date' is not null order by c ->> 'date' desc limit 1),
      'deal_id', (select d.id from crm.deals d where d.prospect_id = p.id limit 1)) x
    from public.prospects p
    cross join lateral (select case when jsonb_typeof(p.call_history) = 'array' then p.call_history else '[]'::jsonb end a) h
    where v_c in (p.assigned_caller_id, p.created_by_caller_id) and p.archived_at is null and p.anonymized_at is null
      and coalesce(p.stage, 'new') not in ('signed', 'lost')
      and (p.next_followup_date <= v_auj + 7 or (p.next_followup_date is null and jsonb_array_length(h.a) = 0))) z), '[]'::jsonb));
end $$;
revoke all on function public.lanceur_a_rappeler(uuid) from public, anon;
grant execute on function public.lanceur_a_rappeler(uuid) to authenticated;
