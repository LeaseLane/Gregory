-- T0, faille #23 (suite) : les quatre déclencheurs restants qui appellent
-- une fonction edge envoient maintenant internal_call_headers() (clé
-- publique + x-internal-call-key quand app.internal_call_secret existe).
-- Corps repris tels quels des dernières migrations ; seul le bloc headers
-- change. Sans secret défini, les en-têtes restent identiques à avant.


CREATE OR REPLACE FUNCTION "public"."notify_new_mandat_inquiry"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.type = 'mandat' then
    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-mandat-inquiry',
      body := jsonb_build_object('inquiry_id', new.id),
      headers := internal_call_headers()
    );
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."notify_new_service_request"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  perform net.http_post(
    url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-service-request',
    body := jsonb_build_object('type', 'INSERT', 'table', 'service_requests', 'record', to_jsonb(NEW)),
    headers := internal_call_headers()
  );
  return NEW;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."notify_worker_new_job"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_cap numeric;
  v_needs_approval boolean := false;
begin
  if new.worker_id is not null
     and (TG_OP = 'INSERT' or old.worker_id is distinct from new.worker_id)
     and coalesce(new.worker_notified, false) = false then

    select o.spending_cap into v_cap
    from owners o
    join buildings b on b.owner_id = o.id
    join units u on u.building_id = b.id
    where u.id = new.unit_id;

    if new.estimated_cost is not null and v_cap is not null and new.estimated_cost > v_cap then
      v_needs_approval := true;
    end if;

    if not v_needs_approval then
      new.worker_notified := true;
      new.worker_notified_at := now();
      new.worker_response := 'pending';
      new.worker_response_token := gen_random_uuid();
      new.worker_response_note := null;
      new.response_reminder_sent := false;
      new.response_escalated := false;

      perform net.http_post(
        url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-worker-job-assigned',
        body := jsonb_build_object('work_order_id', new.id, 'response_token', new.worker_response_token, 'notification_type', 'assigned'),
        headers := internal_call_headers()
      );
    end if;
  end if;
  return new;
end;
$$;

create or replace function process_worker_response_timeouts()
returns void language plpgsql security definer set search_path = public as $$
declare
  wo record;
  v_next_worker_id uuid;
  v_admin_count int;
begin
  for wo in
    select id from work_orders
    where worker_response = 'pending'
    and worker_notified = true
    and coalesce(response_reminder_sent, false) = false
    and worker_notified_at <= now() - interval '30 minutes'
  loop
    perform net.http_post(
      url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-worker-job-assigned',
      body := jsonb_build_object('work_order_id', wo.id, 'notification_type', 'reminder'),
      headers := internal_call_headers()
    );
    update work_orders set response_reminder_sent = true where id = wo.id;
  end loop;

  for wo in
    select w.id, w.worker_id, w.declined_worker_ids, wk.specialty
    from work_orders w
    join workers wk on wk.id = w.worker_id
    where w.worker_response = 'pending'
    and w.worker_notified = true
    and coalesce(w.response_escalated, false) = false
    and w.worker_notified_at <= now() - interval '2 hours'
  loop
    select id into v_next_worker_id
    from worker_verification_status
    where specialty is not distinct from wo.specialty
    and id <> wo.worker_id
    and not (id = any(coalesce(wo.declined_worker_ids, '{}')))
    and coalesce(active, true)
    and not missing_rbq_license
    and not rbq_expired
    and not missing_insurance_doc
    and not insurance_expired
    order by random()
    limit 1;

    if v_next_worker_id is not null then
      insert into automated_decisions (decision_type, subject_type, subject_id, entity_type, entity_id, summary, factors)
      values ('worker_reassigned_timeout', 'worker', wo.worker_id, 'work_orders', wo.id,
        'Ce mandat vous a été retiré automatiquement et réassigné à un autre travailleur, faute de réponse dans le délai prévu.',
        jsonb_build_object('delai_heures', 2, 'nouveau_travailleur_id', v_next_worker_id));

      update work_orders set
        declined_worker_ids = array_append(coalesce(declined_worker_ids, '{}'), worker_id),
        worker_id = v_next_worker_id,
        worker_notified = false
      where id = wo.id;
    else
      update work_orders set response_escalated = true where id = wo.id;

      select count(*) into v_admin_count from users where is_admin = true and email is not null;
      if v_admin_count > 0 then
        perform net.http_post(
          url := 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/handle-worker-job-assigned',
          body := jsonb_build_object('work_order_id', wo.id, 'notification_type', 'all_declined'),
          headers := internal_call_headers()
        );
      end if;
    end if;
  end loop;
end;
$$;
