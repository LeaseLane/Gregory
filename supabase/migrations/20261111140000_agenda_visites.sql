-- Agenda de l'admin (Opérations › Agenda), visites en calendrier (Grégory, 2026-11-04) :
--   • une visite y prend sa vraie durée (15 min; visite libre : sa plage, 3 h par défaut) au lieu d'une heure fixe; la visite libre est signalée;
--   • vue Semaine : lanceur_agenda_semaine (sept jours de lanceur_agenda);
--   • « + Visite libre » : lanceur_visite_libre sur un logement à louer (lanceur_logements_a_louer). Le chevauchement est refusé par
--     visits_plage (migration 20261111120000), le message remonte tel quel à l'écran.
-- lanceur_agenda : corps repris de 20261016110000_t7_agenda.sql; seule la ligne des visites change.

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
        select jsonb_build_object('type', 'visite', 'id', v.id, 'debut', v.proposed_at, 'fin', coalesce(v.ends_at, v.proposed_at + interval '15 minutes'),
          'titre', case when v.kind = 'visite_libre' then 'Visite libre · ' else 'Visite · ' end || coalesce(b.address || coalesce(' — ' || u.unit_number, ''), 'logement'),
          'detail', case when v.kind = 'visite_libre' then 'Sans rendez-vous' else coalesce(v.prospect_name, 'Candidat') || case when v.status = 'proposed' then ' · à confirmer' else '' end end,
          'qui', null, 'urgent', false, 'libre', v.kind = 'visite_libre') as e
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

create or replace function public.lanceur_agenda_semaine(p_lundi date) returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(e order by e ->> 'debut'), '[]'::jsonb)
  from generate_series(p_lundi, p_lundi + 6, interval '1 day') d, jsonb_array_elements(public.lanceur_agenda(d::date) -> 'evenements') e
$$;

-- Logements libres ou bientôt libres (choix du logement d'une visite libre).
create or replace function public.lanceur_logements_a_louer() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('operations.lire') then raise exception 'Votre rôle ne donne pas accès à l’agenda.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'libelle', b.address || coalesce(' — ' || u.unit_number, '')) order by b.address, u.unit_number)
    from public.units u join public.buildings b on b.id = u.building_id where u.status in ('available', 'soon_available')), '[]'::jsonb);
end $$;

-- p : unit_id, debut (horodatage), duree (minutes, 180 par défaut). Rend l'id de la visite libre.
create or replace function public.lanceur_visite_libre(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_debut timestamptz := (p ->> 'debut')::timestamptz; v_duree int := coalesce(nullif(p ->> 'duree', '')::int, 180);
begin
  perform crm.require_aal2();
  if not crm.can('operations.ecrire') then raise exception 'Votre rôle ne permet pas de planifier une visite.' using errcode = 'PT403'; end if;
  if not exists (select 1 from public.units where id = (p ->> 'unit_id')::uuid and status in ('available', 'soon_available')) then
    raise exception 'Choisissez un logement à louer.' using errcode = 'PT422';
  end if;
  insert into public.visits (unit_id, kind, proposed_at, ends_at, status)
  values ((p ->> 'unit_id')::uuid, 'visite_libre', v_debut, v_debut + make_interval(mins => v_duree), 'confirmed')
  returning id into v_id;
  perform crm.journal('visit.open_house_created', 'public.visits', v_id, null, jsonb_build_object('debut', v_debut, 'duree', v_duree), 'create-open-house');
  return v_id;
end $$;

revoke all on function public.lanceur_agenda_semaine(date), public.lanceur_logements_a_louer(), public.lanceur_visite_libre(jsonb) from public, anon;
grant execute on function public.lanceur_agenda_semaine(date), public.lanceur_logements_a_louer(), public.lanceur_visite_libre(jsonb) to authenticated;
