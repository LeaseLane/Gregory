-- T2 · Coupe-circuit (maquette e70) : durée choisie (jusqu'à la réactivation, 1 heure, jusqu'à demain 8 h) avec reprise
-- automatique, et état des envois pour la page Automatisations (l18).

alter table config.kill_switch add column if not exists until timestamptz;

-- Reprise automatique à l'échéance (appelée chaque minute par comms.declencher_envois, et à la lecture de l'état).
create or replace function comms.expirer_coupe_circuit() returns void
language plpgsql security definer set search_path = '' as $$
declare v config.kill_switch;
begin
  select * into v from config.kill_switch where active and until is not null and until <= now() for update;
  if not found then return; end if;
  update config.kill_switch set active = false, reason = null, activated_by = null, activated_at = null, until = null, updated_at = now() where id;
  update comms.outbox set status = 'queued', updated_at = now() where status = 'held_kill_switch';
  perform crm.journal('kill_switch.expired', 'kill_switch', null, jsonb_build_object('active', true, 'jusqu_a', v.until),
    jsonb_build_object('active', false), 'set-kill-switch', 'cron', null, 'system');
end $$;

create or replace function comms.declencher_envois() returns void
language plpgsql security definer set search_path = '' as $$
declare v_url text;
begin
  perform comms.expirer_coupe_circuit();
  if not exists (select 1 from comms.outbox where status in ('queued', 'held_window', 'held_kill_switch') and scheduled_for <= now()) then return; end if;
  begin
    select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url' limit 1;
  exception when others then v_url := null;
  end;
  if coalesce(v_url, '') = '' then return; end if;
  perform net.http_post(url := rtrim(v_url, '/') || '/functions/v1/envoyer-courriels', body := '{}'::jsonb, headers := public.internal_call_headers());
end $$;

-- Envois non essentiels en attente (ce que le coupe-circuit retient), par canal.
create or replace function comms.envois_retenus() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('total', count(*), 'sms', count(*) filter (where o.channel = 'sms'), 'email', count(*) filter (where o.channel = 'email'))
  from comms.outbox o
  where o.status in ('queued', 'held_window', 'held_kill_switch')
    and not exists (select 1 from comms.email_templates t where t.code = o.template_code and t.essential);
$$;

create or replace function public.lanceur_coupe_circuit(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_actif boolean := (p ->> 'active')::boolean; v_avant config.kill_switch; m record; v_jusqua timestamptz; v_duree text;
  v_retenus jsonb := comms.envois_retenus();
begin
  perform crm.require_aal2();
  if not crm.can('envois.suspendre') then raise exception 'Votre rôle ne permet pas de suspendre les envois.' using errcode = 'PT403'; end if;
  if v_actif is null then raise exception 'active requis.' using errcode = 'PT422'; end if;
  if v_actif and coalesce(btrim(p ->> 'reason'), '') = '' then raise exception 'Indiquez la raison de la suspension.' using errcode = 'PT422'; end if;
  case coalesce(p ->> 'duree', 'reactivation')
    when 'reactivation' then v_jusqua := null; v_duree := 'Jusqu’à la réactivation';
    when '1h' then v_jusqua := now() + interval '1 hour'; v_duree := 'Pendant 1 heure (jusqu’à ' || to_char(v_jusqua at time zone 'America/Toronto', 'FMHH24 "h" MI') || ')';
    when 'demain8h' then v_jusqua := ((now() at time zone 'America/Toronto')::date + 1 + time '08:00') at time zone 'America/Toronto'; v_duree := 'Jusqu’à demain 8 h';
    else raise exception 'Durée inconnue.' using errcode = 'PT422';
  end case;
  select * into v_avant from config.kill_switch for update;
  update config.kill_switch set active = v_actif, reason = case when v_actif then btrim(p ->> 'reason') end,
    activated_by = case when v_actif then auth.uid() end, activated_at = case when v_actif then now() end,
    until = case when v_actif then v_jusqua end, updated_at = now() where id;
  if v_actif and not v_avant.active then
    for m in select u.email from crm.team_members tm join auth.users u on u.id = tm.user_id where tm.active and tm.role in ('admin', 'gestionnaire') and u.email is not null loop
      perform comms.enqueue(jsonb_build_object('template_code', 'EQP-11', 'recipient', m.email, 'canal_journal', 'interface',
        'vars', jsonb_build_object('raison', btrim(p ->> 'reason'), 'par', crm.nom_membre(auth.uid()), 'duree', v_duree,
          'heure', to_char(now() at time zone 'America/Toronto', 'FMHH24 "h" MI'), 'envois_retenus', v_retenus ->> 'total'),
        'idempotency_key', 'EQP-11:' || to_char(now(), 'YYYYMMDDHH24MISS') || ':' || m.email));
    end loop;
  elsif not v_actif and v_avant.active then
    update comms.outbox set status = 'queued', updated_at = now() where status = 'held_kill_switch';
  end if;
  perform crm.journal(case when v_actif then 'kill_switch.activated' else 'kill_switch.deactivated' end, 'kill_switch', null,
    jsonb_build_object('active', v_avant.active), jsonb_build_object('active', v_actif, 'raison', p ->> 'reason', 'jusqu_a', v_jusqua), 'set-kill-switch');
  return jsonb_build_object('active', v_actif, 'until', v_jusqua);
end $$;

-- État pour l18 / e70 : coupe-circuit, envois retenus, règles automatiques réelles (7 jours, réussite 30 jours), dernier échec.
create or replace function public.lanceur_envois_etat() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare k config.kill_switch; v_loyer boolean;
begin
  if not crm.is_team_member() then raise exception 'Réservé à l’équipe.' using errcode = 'PT403'; end if;
  perform comms.expirer_coupe_circuit();
  select * into k from config.kill_switch;
  v_loyer := coalesce((select valeur from config.parametres where cle = 'rappels_loyer'), 'false'::jsonb) = 'true'::jsonb;
  return jsonb_build_object(
    'coupe_circuit', jsonb_build_object('active', k.active, 'reason', k.reason, 'par', case when k.activated_by is not null then crm.nom_membre(k.activated_by) end,
                                        'depuis', k.activated_at, 'until', k.until),
    'retenus', comms.envois_retenus(),
    'peut_suspendre', crm.can('envois.suspendre'),
    'regles', jsonb_build_array(jsonb_build_object(
      'nom', 'Relance de loyer', 'resume', 'Loyer impayé · SMS J+1, courriel J+7', 'active', v_loyer,
      'jours', (select jsonb_agg((select count(*) from comms.outbox o where o.template_code in ('LOC-05', 'LOC-06') and o.status = 'sent'
                   and (o.sent_at at time zone 'America/Toronto')::date = d::date) order by d)
                from generate_series(((now() at time zone 'America/Toronto')::date - 6)::timestamp, (now() at time zone 'America/Toronto')::date::timestamp, interval '1 day') d),
      'envoyes_30j', (select count(*) from comms.outbox where template_code in ('LOC-05', 'LOC-06') and status = 'sent' and sent_at > now() - interval '30 days'),
      'echecs_30j', (select count(*) from comms.outbox where template_code in ('LOC-05', 'LOC-06') and status = 'failed' and updated_at > now() - interval '30 days'))),
    'dernier_echec', (select jsonb_build_object('gabarit', o.template_code, 'nom', t.name, 'canal', o.channel, 'erreur', o.last_error, 'essais', o.attempts,
                        'cree', o.created_at, 'echoue', o.updated_at)
                      from comms.outbox o left join comms.email_templates t on t.code = o.template_code and t.version = 1
                      where o.status = 'failed' and o.updated_at > now() - interval '7 days' order by o.updated_at desc limit 1));
end $$;

revoke all on function comms.expirer_coupe_circuit(), comms.envois_retenus() from public, anon, authenticated;
grant execute on function comms.expirer_coupe_circuit(), comms.envois_retenus() to service_role;
revoke all on function public.lanceur_envois_etat() from public, anon;
grant execute on function public.lanceur_envois_etat() to authenticated;
