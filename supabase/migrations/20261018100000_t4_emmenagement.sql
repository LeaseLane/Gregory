-- T4 · Emménagement (maquette l09, modèle « Emménagement », 7 étapes). Spec : ordre-des-tranches.md § T4 (« puis emménagement »).
--   • Démarre seul à la création d'un bail qui commence aujourd'hui ou plus tard (et pour les baux futurs déjà là).
--   • Une tâche par étape, datée par rapport au début du bail (rôle et décalage dans le modèle). Terminer la tâche dans
--     Opérations › Tâches fait avancer le processus; « Étape faite » dans la fiche ferme la tâche et avance aussi.
--   • Un seul emménagement actif par bail (index unique de T4). Aucun paramètre légal en jeu.
-- ponytail: étapes cochées à la main (enquête de crédit : T5; signature : T6; premier loyer : pas encore lu des paiements).

-- Le modèle v1 n'a encore aucune instance : on le complète en place (tâches par étape) et il devient exécutable.
update crm.process_templates set executable = true, definition = '{"etapes": ["Candidature acceptée", "Enquête de crédit", "Signature du bail", "Premier loyer", "Accès au portail", "Remise des clés", "État des lieux d’entrée"],
  "taches": [null,
    {"titre": "Vérifier la solvabilité de {prenom} (enquête de crédit)", "role": "location", "jours": -21},
    {"titre": "Faire signer le bail de {prenom}", "role": "location", "jours": -14},
    {"titre": "Confirmer le premier loyer de {prenom}", "role": "comptabilite", "jours": -1},
    {"titre": "Inviter {prenom} au portail locataire", "role": "gestionnaire", "jours": -3},
    {"titre": "Remettre les clés à {prenom}", "role": "gestionnaire", "jours": 0},
    {"titre": "Faire l’état des lieux d’entrée avec {prenom}", "role": "gestionnaire", "jours": 3}]}'
 where code = 'emmenagement' and version = 1 and not exists (select 1 from crm.processes p where p.code = 'emmenagement');

-- Tâche de l'étape courante (aucune pour l'étape 0, déjà faite au démarrage). Retourne l'échéance.
create or replace function crm.tache_etape(p_process uuid) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare pr crm.processes; d jsonb; l public.leases; v_prenom text; v_lieu text; v_due timestamptz; t crm.tasks;
begin
  select * into pr from crm.processes where id = p_process;
  select definition -> 'taches' -> pr.step into d from crm.process_templates where id = pr.template_id;
  if d is null or jsonb_typeof(d) <> 'object' then return null; end if;
  select * into l from public.leases where id = pr.lease_id;
  select split_part(tn.full_name, ' ', 1), b.address || coalesce(' — ' || u.unit_number, '') into v_prenom, v_lieu
    from public.tenants tn, public.units u join public.buildings b on b.id = u.building_id where tn.id = l.tenant_id and u.id = l.unit_id;
  v_due := (greatest(l.start_date + (d ->> 'jours')::int, current_date) + time '17:00') at time zone 'America/Toronto';
  t := crm.creer_tache(jsonb_build_object('title', replace(d ->> 'titre', '{prenom}', coalesce(v_prenom, 'le locataire')), 'context', 'Clients · emménagement · ' || coalesce(v_lieu, ''),
    'due_at', v_due, 'assignee_role', d ->> 'role', 'source', 'system', 'entity_type', 'crm.processes', 'entity_id', pr.id,
    'canal', case when auth.uid() is null then 'cron' else 'interface' end));
  update crm.tasks set process_id = pr.id where id = t.id;
  update crm.processes set due_at = v_due where id = pr.id;
  return v_due;
end $$;

create or replace function crm.demarrer_emmenagement(p_lease uuid, p_par uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare l public.leases; t crm.process_templates; v uuid; v_owner uuid;
begin
  select * into l from public.leases where id = p_lease;
  if not found or l.start_date is null then raise exception 'Bail avec une date de début requis.' using errcode = 'PT422'; end if;
  select * into t from crm.process_templates where code = 'emmenagement' and active and executable order by version desc limit 1;
  if not found then return null; end if;
  select b.owner_id into v_owner from public.units u join public.buildings b on b.id = u.building_id where u.id = l.unit_id;
  insert into crm.processes (template_id, code, template_version, lease_id, owner_id, started_by, step, data)
  values (t.id, t.code, t.version, l.id, v_owner, p_par, 1, jsonb_build_object('debut_bail', l.start_date, 'loyer_actuel', l.monthly_rent))
  returning id into v;
  insert into crm.process_events (process_id, step, action, by_user) values (v, 0, 'candidature acceptée (bail créé)', p_par);
  perform crm.tache_etape(v);
  return v;
end $$;

-- Étape faite : ferme la tâche ouverte de l'étape, avance, crée la tâche suivante ou clôt le processus.
create or replace function crm.avancer_emmenagement(p_process uuid, p_note text, p_par uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare pr crm.processes; n int;
begin
  select * into pr from crm.processes where id = p_process and status = 'active' and code = 'emmenagement' for update;
  if not found then raise exception 'Processus introuvable ou fermé.' using errcode = 'PT404'; end if;
  select jsonb_array_length(definition -> 'etapes') into n from crm.process_templates where id = pr.template_id;
  perform set_config('crm.avance_processus', '1', true);
  update crm.tasks set status = 'done', done_at = now(), done_by = p_par, updated_at = now() where process_id = pr.id and status = 'open';
  perform set_config('crm.avance_processus', '', true);
  insert into crm.process_events (process_id, step, action, note, by_user)
  values (pr.id, pr.step, 'étape faite : ' || ((select definition -> 'etapes' ->> pr.step from crm.process_templates where id = pr.template_id)), nullif(btrim(p_note), ''), p_par);
  if pr.step + 1 >= n then
    update crm.processes set step = n, status = 'done', done_at = now(), due_at = null where id = pr.id;
  else
    update crm.processes set step = pr.step + 1 where id = pr.id;
    perform crm.tache_etape(pr.id);
  end if;
  perform crm.journal('move_in.step_done', 'crm.processes', pr.id, jsonb_build_object('step', pr.step), jsonb_build_object('step', pr.step + 1, 'note', p_note), 'advance-move-in',
    case when auth.uid() is null then 'cron' else 'interface' end);
  return jsonb_build_object('step', least(pr.step + 1, n), 'termine', pr.step + 1 >= n);
end $$;

-- Démarrage automatique : bail créé qui commence aujourd'hui ou plus tard.
create or replace function crm.bail_cree_emmenagement() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.start_date >= current_date and new.status = 'active' then perform crm.demarrer_emmenagement(new.id, auth.uid()); end if;
  return new;
end $$;
drop trigger if exists bail_cree_emmenagement on public.leases;
create trigger bail_cree_emmenagement after insert on public.leases for each row execute function crm.bail_cree_emmenagement();

-- Tâche terminée dans Opérations › Tâches → l'étape est faite (sauf si c'est la fiche qui ferme la tâche).
create or replace function crm.tache_processus_terminee() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(current_setting('crm.avance_processus', true), '') = '1' then return new; end if;
  if exists (select 1 from crm.processes p where p.id = new.process_id and p.status = 'active' and p.code = 'emmenagement')
     and not exists (select 1 from crm.tasks t where t.process_id = new.process_id and t.status = 'open') then
    perform crm.avancer_emmenagement(new.process_id, 'tâche terminée', new.done_by);
  end if;
  return new;
end $$;
drop trigger if exists tache_processus_terminee on crm.tasks;
create trigger tache_processus_terminee after update of status on crm.tasks for each row
  when (old.status = 'open' and new.status = 'done' and new.process_id is not null) execute function crm.tache_processus_terminee();

create or replace function public.lanceur_etape_emmenagement(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de faire avancer un processus.' using errcode = 'PT403'; end if;
  return crm.avancer_emmenagement((p ->> 'process_id')::uuid, p ->> 'note', auth.uid());
end $$;
create or replace function public.lanceur_demarrer_emmenagement(p_lease uuid) returns uuid language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de démarrer un processus.' using errcode = 'PT403'; end if;
  return crm.demarrer_emmenagement(p_lease, auth.uid());
end $$;

revoke all on function crm.tache_etape(uuid), crm.demarrer_emmenagement(uuid, uuid), crm.avancer_emmenagement(uuid, text, uuid), crm.bail_cree_emmenagement(), crm.tache_processus_terminee()
  from public, anon, authenticated;
grant execute on function crm.tache_etape(uuid), crm.demarrer_emmenagement(uuid, uuid), crm.avancer_emmenagement(uuid, text, uuid) to service_role;
revoke all on function public.lanceur_etape_emmenagement(jsonb), public.lanceur_demarrer_emmenagement(uuid) from public, anon;
grant execute on function public.lanceur_etape_emmenagement(jsonb), public.lanceur_demarrer_emmenagement(uuid) to authenticated;

-- Baux futurs déjà en place : leur emménagement démarre maintenant.
do $$ declare r record; begin
  for r in select l.id from public.leases l where l.status = 'active' and l.start_date >= current_date
             and not exists (select 1 from crm.processes p where p.lease_id = l.id and p.code = 'emmenagement') loop
    perform crm.demarrer_emmenagement(r.id, null);
  end loop;
end $$;
