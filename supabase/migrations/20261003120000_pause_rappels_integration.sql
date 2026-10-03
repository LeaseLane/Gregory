-- Rappels d'intégration aux propriétaires en pause jusqu'au 3 novembre 2026
-- (le marquage « intégration complétée » continue de tourner).
create or replace function public.flag_incomplete_onboarding()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r record;
begin
  update owners o
  set onboarding_completed_at = now()
  from owner_onboarding_checklist c
  where c.owner_id = o.id
    and o.onboarding_completed_at is null
    and not c.missing_phone
    and not c.missing_buildings
    and not c.missing_units
    and c.units_missing_rent_count = 0
    and c.occupied_units_missing_lease_count = 0
    and c.active_leases_missing_tenant_contact_count = 0
    and c.active_leases_missing_bail_doc_count = 0;

  -- Pause demandée par Octa le 2026-10-03 : aucun rappel aux propriétaires
  -- avant le 3 novembre 2026. Reprend tout seul ensuite.
  if now() < timestamptz '2026-11-03 00:00:00-04' then
    return;
  end if;

  for r in
    select c.owner_id
    from owner_onboarding_checklist c
    join owners o on o.id = c.owner_id
    where o.onboarding_completed_at is null
      and o.created_at <= now() - interval '3 days'
      and (o.onboarding_reminder_sent_at is null or o.onboarding_reminder_sent_at <= now() - interval '5 days')
      and (
        c.missing_phone or c.missing_buildings or c.missing_units
        or c.units_missing_rent_count > 0
        or c.occupied_units_missing_lease_count > 0
        or c.active_leases_missing_tenant_contact_count > 0
        or c.active_leases_missing_bail_doc_count > 0
      )
  loop
    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/send-onboarding-reminder',
      body := jsonb_build_object('owner_id', r.owner_id),
      headers := internal_call_headers(),
      timeout_milliseconds := 60000
    );
  end loop;
end;
$function$;
