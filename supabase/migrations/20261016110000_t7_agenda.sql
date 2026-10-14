-- T7 · Agenda (maquette e05) : la journée de l'équipe (visites, interventions, tâches à heure fixe), le mois en un coup
-- d'œil (jours occupés) et ce qui reste à planifier. Lecture seule : chaque événement vit dans sa propre table.

create or replace function public.lanceur_agenda(p_jour date) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  f text := 'America/Toronto';
  v_debut timestamptz := (p_jour + time '00:00') at time zone f;
  v_fin timestamptz := (p_jour + 1 + time '00:00') at time zone f;
  v_m0 date := date_trunc('month', p_jour)::date;
  v_m1 date := (date_trunc('month', p_jour) + interval '1 month')::date;
begin
  if not crm.can('operations.lire') then raise exception 'Votre rôle ne donne pas accès à l’agenda.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'jour', p_jour,
    'evenements', coalesce((select jsonb_agg(e order by e ->> 'debut') from (
        -- visites (Location)
        select jsonb_build_object('type', 'visite', 'id', v.id, 'debut', v.proposed_at, 'fin', v.proposed_at + interval '1 hour',
          'titre', 'Visite · ' || coalesce(b.address || coalesce(' — ' || u.unit_number, ''), 'logement'),
          'detail', coalesce(v.prospect_name, 'Candidat') || case when v.status = 'proposed' then ' · à confirmer' else '' end,
          'qui', null, 'urgent', false) as e
        from public.visits v left join public.units u on u.id = v.unit_id left join public.buildings b on b.id = u.building_id
        where v.proposed_at >= v_debut and v.proposed_at < v_fin and v.status in ('proposed', 'confirmed', 'completed')
        union all
        -- interventions (Maintenance)
        select jsonb_build_object('type', 'intervention', 'id', w.id, 'debut', w.appointment_at, 'fin', w.appointment_at + interval '1 hour',
          'titre', coalesce(wk.name || ' · ', '') || left(coalesce(w.description, 'Intervention'), 80),
          'detail', coalesce(b.address || coalesce(' — ' || u.unit_number, ''), '') || case when w.is_urgent then ' · urgence' else '' end,
          'qui', null, 'urgent', coalesce(w.is_urgent, false) and w.status <> 'completed')
        from public.work_orders w left join public.workers wk on wk.id = w.worker_id
        left join public.units u on u.id = w.unit_id left join public.buildings b on b.id = u.building_id
        where w.appointment_at >= v_debut and w.appointment_at < v_fin and w.status <> 'cancelled'
        union all
        -- tâches à heure fixe
        select jsonb_build_object('type', 'tache', 'id', t.id, 'debut', t.due_at, 'fin', t.due_at + interval '30 minutes',
          'titre', t.title, 'detail', coalesce(t.context, ''),
          'qui', case when t.assignee_user_id is not null then crm.nom_membre(t.assignee_user_id) end, 'urgent', false)
        from crm.tasks t where t.status = 'open' and not t.due_all_day and t.due_at >= v_debut and t.due_at < v_fin
      ) x), '[]'::jsonb),
    'jours_occupes', coalesce((select jsonb_agg(distinct d order by d) from (
        select (v.proposed_at at time zone f)::date as d from public.visits v where v.proposed_at >= v_m0 and v.proposed_at < v_m1 + 1 and v.status in ('proposed', 'confirmed', 'completed')
        union select (w.appointment_at at time zone f)::date from public.work_orders w where w.appointment_at >= v_m0 and w.appointment_at < v_m1 + 1 and w.status <> 'cancelled'
        union select (t.due_at at time zone f)::date from crm.tasks t where t.status = 'open' and not t.due_all_day and t.due_at >= v_m0 and t.due_at < v_m1 + 1
      ) y where d >= v_m0 and d < v_m1), '[]'::jsonb),
    'a_planifier', coalesce((select jsonb_agg(p) from (
        select jsonb_build_object('type', 'intervention', 'id', w.id, 'titre', left(coalesce(w.description, 'Intervention'), 80),
          'detail', coalesce(b.address || coalesce(' — ' || u.unit_number, ''), '') || case when w.due_by is not null then ' · avant le ' || to_char(w.due_by, 'FMDD') || ' ' || (array['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'])[extract(month from w.due_by)::int] else '' end) as p
        from public.work_orders w left join public.units u on u.id = w.unit_id left join public.buildings b on b.id = u.building_id
        where w.appointment_at is null and w.status in ('open', 'assigned') order by w.due_by nulls last limit 5
      ) z), '[]'::jsonb)
    || coalesce((select jsonb_agg(jsonb_build_object('type', 'tache', 'id', t.id, 'titre', t.title, 'detail', coalesce(t.context, 'Tâche sans date')))
        from crm.tasks t where t.status = 'open' and t.due_at is null), '[]'::jsonb));
end $$;
revoke all on function public.lanceur_agenda(date) from public, anon;
grant execute on function public.lanceur_agenda(date) to authenticated;

-- Planifier depuis l'agenda : une heure précise (due_all_day = false).
-- Réassigner, changer l'échéance.
create or replace function public.lanceur_maj_tache(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_avant crm.tasks; v_apres crm.tasks;
begin
  perform crm.require_aal2();
  if not crm.is_team_member() then raise exception 'Réservé à l’équipe.' using errcode = 'PT403'; end if;
  select * into v_avant from crm.tasks where id = (p ->> 'id')::uuid and status = 'open' for update;
  if not found then raise exception 'Tâche introuvable ou fermée.' using errcode = 'PT404'; end if;
  update crm.tasks set
    due_at = case when p ? 'due_at' then (p ->> 'due_at')::timestamptz else due_at end,
    due_all_day = case when p ? 'due_all_day' then (p ->> 'due_all_day')::boolean else due_all_day end,
    assignee_user_id = case when p ? 'assignee_user_id' then nullif(p ->> 'assignee_user_id', '')::uuid else assignee_user_id end,
    assignee_role = case when p ? 'assignee_role' then nullif(p ->> 'assignee_role', '') else assignee_role end,
    updated_at = now()
   where id = v_avant.id returning * into v_apres;
  perform crm.journal('task.updated', 'crm.tasks', v_avant.id, jsonb_build_object('due_at', v_avant.due_at, 'assignee_user_id', v_avant.assignee_user_id, 'assignee_role', v_avant.assignee_role),
    jsonb_build_object('due_at', v_apres.due_at, 'assignee_user_id', v_apres.assignee_user_id, 'assignee_role', v_apres.assignee_role), 'update-task');
  return to_jsonb(v_apres);
end $$;

