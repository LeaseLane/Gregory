-- TA · Utilisateurs et accès, sécurité des connexions, Mon compte (prototype : UA-01 à UA-15, MC-01 à MC-05; écrans x01 à x04).
-- • Comptes de l'équipe : invitation par code (EQP-05, même parcours que les portails : /espace/inscription?p=equipe), suspension (sessions fermées sur-le-champ),
--   retrait d'accès, rappel 2FA; le dernier administrateur ne peut pas se retirer.
-- • Rôles et permissions : matrice modifiable par l'administrateur (le rôle admin a tout, par crm.can, et ne se modifie pas).
-- • Journal d'accès : connexions autorisées et refusées (lecture seule, 36 mois), adresse IP et navigateur lus dans les en-têtes de la requête.
-- • Sécurité : déconnexion après inactivité, connexions depuis le Canada seulement (exceptions journalisées), longueur minimale du mot de passe.
-- • Sessions : une session révoquée ne peut plus appeler d'opération (crm.require_aal2 vérifie la session du jeton).
-- • Revue trimestrielle : chaque compte actif est confirmé ou retiré avant la fermeture.

alter table crm.team_members add column if not exists removed_at timestamptz, add column if not exists phone text, add column if not exists title text,
  add column if not exists preferences jsonb not null default '{}'::jsonb;
comment on column crm.team_members.phone is 'RP · coordonnées · joindre un membre de l''équipe · durée de l''emploi';

-- ── Session révoquée = plus d'opération ──
create or replace function crm.require_aal2() returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    raise exception 'Deuxième facteur requis : reconnectez-vous avec votre code.' using errcode = 'PT403';
  end if;
  if auth.jwt() ? 'session_id' and not exists (select 1 from auth.sessions s where s.id = (auth.jwt() ->> 'session_id')::uuid) then
    raise exception 'Cette session a été fermée : reconnectez-vous.' using errcode = 'PT401';
  end if;
end $$;

-- ── Invitations de l'équipe (EQP-05) ──
alter table public.portal_invitations add column if not exists team_role text check (team_role is null or team_role in ('admin', 'gestionnaire', 'location', 'prospection', 'comptabilite', 'lecture'));
do $$ declare c record; begin
  for c in select conname from pg_constraint where conrelid = 'public.portal_invitations'::regclass and contype = 'c' and pg_get_constraintdef(oid) ~ 'kind' loop
    execute format('alter table public.portal_invitations drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.portal_invitations add constraint portal_invitations_kind_check check (kind in ('locataire', 'proprietaire', 'coproprietaire', 'comptable', 'equipe')),
  add constraint portal_invitations_cible_check check (case kind when 'locataire' then tenant_id is not null when 'equipe' then team_role is not null else owner_id is not null end);

update comms.email_templates set contenu = '{"subject": "{invite_par} vous invite dans l’admin de Lease Lane", "pre": "Rôle : {role}", "label": "Invitation", "icon": "users", "eyebrow": "Invitation", "title": "Bienvenue dans l’équipe, {prenom}", "blocks": [["kv", {"rows": [["Votre code d’invitation", "{code}"], ["Rôle", "{role}"], ["Accès", "{acces}"], ["Valable jusqu’au", "{expire}"]]}], ["notice", {"k": "info", "ic": "lock", "title": "Double authentification", "t": "Elle est obligatoire pour tous. Gardez votre téléphone à portée de main pour l’étape suivante."}]], "cta": {"l": "Accepter l’invitation", "href": "{lien_invitation}"}, "sign": {"ini": "{initiales_invite_par}", "name": "{invite_par}", "role": "Lease Lane"}, "foot": {"reason": "Vous recevez ce courriel parce que {invite_par} vous a invité dans l’admin de Lease Lane."}, "spec": {"trigger": "Invitation créée (Équipe et permissions)", "send": "Automatique", "when": "Immédiat", "lcap": "Transactionnel"}}'::jsonb,
  subject = '{invite_par} vous invite dans l’admin de Lease Lane', preheader = 'Rôle : {role}', sms_text = 'Lease Lane : votre accès à l’admin. Code : {code}. {lien_invitation}',
  variables = array['prenom', 'role', 'acces', 'code', 'expire', 'lien_invitation', 'invite_par', 'initiales_invite_par']::text[], essential = true, active = true
where code = 'EQP-05';

create or replace function crm.libelle_role(p text) returns text language sql immutable as $$
  select case p when 'admin' then 'Administrateur' when 'gestionnaire' then 'Gestionnaire' when 'location' then 'Location' when 'prospection' then 'Prospection'
    when 'comptabilite' then 'Comptabilité (externe)' when 'lecture' then 'Lecture seule' else p end;
$$;

create or replace function crm.envoyer_invitation(i public.portal_invitations, p_intro text, p_canal text) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_nom text := coalesce(crm.nom_membre(auth.uid()), 'Lease Lane'); o comms.outbox; v_log text; v_ini text;
begin
  v_ini := upper(left(split_part(v_nom, ' ', 1), 1) || left(split_part(v_nom, ' ', 2), 1));
  if i.kind = 'equipe' then
    o := comms.enqueue(jsonb_build_object('template_code', 'EQP-05', 'channel', 'email', 'recipient', i.email, 'entity_type', 'public.portal_invitations', 'entity_id', i.id, 'canal_journal', p_canal,
      'idempotency_key', 'invitation:' || i.id,
      'vars', jsonb_build_object('prenom', split_part(coalesce(i.full_name, ''), ' ', 1), 'code', i.code, 'role', crm.libelle_role(i.team_role),
        'acces', coalesce((select string_agg(distinct split_part(permission, '.', 1), ', ') from crm.role_permissions where role = i.team_role), 'Tous les espaces'),
        'expire', to_char(i.expires_at at time zone 'America/Toronto', 'DD/MM/YYYY'), 'lien_invitation', 'https://app.leaselane.ca/espace/inscription?p=equipe&code=' || i.code,
        'invite_par', v_nom, 'initiales_invite_par', v_ini)));
    return o.id;
  end if;
  if i.kind = 'locataire' then
    select b.address || coalesce(' — logement ' || u.unit_number, '') into v_log from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
     where l.id = crm.bail_locataire(i.tenant_id);
  end if;
  o := comms.enqueue(jsonb_build_object('template_code', case i.kind when 'locataire' then 'LOC-01' else 'PRO-14' end, 'channel', 'email', 'recipient', i.email,
    'entity_type', 'public.portal_invitations', 'entity_id', i.id, 'canal_journal', p_canal, 'idempotency_key', 'invitation:' || i.id,
    'vars', jsonb_build_object('prenom', split_part(coalesce(i.full_name, ''), ' ', 1), 'code', i.code, 'lien', 'https://app.leaselane.ca/espace/inscription?p=' || case i.kind when 'locataire' then 'locataire' else 'proprietaire' end || '&code=' || i.code,
      'expire', to_char(i.expires_at at time zone 'America/Toronto', 'DD/MM/YYYY'), 'logement', coalesce(v_log, 'votre logement'), 'intro', coalesce(p_intro, ''),
      'acces', case i.kind when 'proprietaire' then 'Propriétaire' when 'coproprietaire' then 'Copropriétaire' when 'comptable' then 'Comptabilité (lecture seulement)' else 'Locataire' end,
      'gestionnaire', v_nom, 'initiales_gestionnaire', v_ini)));
  return o.id;
end $$;

create or replace function public.service_invitation_utiliser(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare i public.portal_invitations; v_user uuid := (p ->> 'user_id')::uuid; v_nom text := btrim(concat_ws(' ', btrim(p ->> 'prenom'), btrim(p ->> 'nom')));
begin
  select * into i from public.portal_invitations where code = upper(btrim(p ->> 'code')) for update;
  if not found or i.revoked_at is not null or i.used_at is not null or i.expires_at < now() then raise exception 'Invitation non valide.' using errcode = 'PT409'; end if;
  if i.kind = 'equipe' then
    insert into crm.team_members (user_id, display_name, initials, role, invited_by, invited_at)
    values (v_user, coalesce(nullif(v_nom, ''), i.full_name), upper(left(coalesce(nullif(btrim(p ->> 'prenom'), ''), i.full_name), 1) || left(coalesce(nullif(btrim(p ->> 'nom'), ''), split_part(i.full_name, ' ', 2)), 1)),
            i.team_role, i.created_by, i.created_at)
    on conflict (user_id) do update set active = true, removed_at = null, role = excluded.role;
  elsif i.kind = 'locataire' then
    update public.tenants set user_id = v_user, full_name = coalesce(nullif(v_nom, ''), full_name) where id = i.tenant_id and user_id is null;
  elsif i.kind = 'proprietaire' then
    update public.owners set user_id = v_user, full_name = coalesce(nullif(v_nom, ''), full_name) where id = i.owner_id and user_id is null;
  else
    insert into public.owner_members (owner_id, user_id, role, full_name, invitation_id) values (i.owner_id, v_user, i.kind, coalesce(nullif(v_nom, ''), i.full_name), i.id)
    on conflict (owner_id, user_id) do update set active = true, removed_at = null, role = excluded.role;
  end if;
  if not found then raise exception 'Cet accès est déjà relié à un compte.' using errcode = 'PT409'; end if;
  update public.portal_invitations set used_at = now(), used_by = v_user where id = i.id;
  if i.kind <> 'equipe' and coalesce((p ->> 'infolettre')::boolean, false) and not exists (select 1 from comms.consents where lower(address) = i.email and purpose = 'commercial' and withdrawn_at is null) then
    insert into comms.consents (channel, address, purpose, basis, source, proof) values ('email', i.email, 'commercial', 'express', 'inscription_portail',
      jsonb_build_object('texte', 'J’accepte de recevoir l’infolettre et les offres de Lease Lane. Je peux me désabonner en un clic.', 'le', now(), 'ip', p ->> 'ip'));
  end if;
  perform crm.journal(case when i.kind = 'equipe' then 'team_member.joined' else 'portal.signup' end, 'public.portal_invitations', i.id, null,
    jsonb_build_object('kind', i.kind, 'role', i.team_role, 'conditions', true, 'infolettre', coalesce((p ->> 'infolettre')::boolean, false)), 'portal-signup', 'api', null, 'system');
  return jsonb_build_object('kind', i.kind);
end $$;

-- ── Journal d'accès (lecture seule, 36 mois) ──
create table if not exists crm.access_events (
  id uuid primary key default gen_random_uuid(), at timestamptz not null default now(), user_id uuid references auth.users(id) on delete set null, email text,
  result text not null check (result in ('autorise', 'refuse')), reason text, ip text, user_agent text, country text
);
comment on table crm.access_events is 'Journal d''accès au Lanceur : connexions autorisées et refusées. Lecture seule, conservé 36 mois.';
comment on column crm.access_events.email is 'RP · identification · sécurité des accès · 36 mois';
comment on column crm.access_events.ip is 'RP · technique · sécurité des accès · 36 mois';
comment on column crm.access_events.user_agent is 'RP · technique · sécurité des accès · 36 mois';
create index if not exists access_events_at_idx on crm.access_events (at desc);
create index if not exists access_events_ip_idx on crm.access_events (ip, at desc);
alter table crm.access_events enable row level security;
revoke all on crm.access_events from anon, authenticated; grant all on crm.access_events to service_role;
-- aucune modification : ni mise à jour ni suppression, sauf la purge de conservation (L25)
create or replace function crm.access_events_immuable() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' or (tg_op = 'DELETE' and coalesce(current_setting('crm.purge', true), '') <> 'on') then
    raise exception 'Le journal d’accès est en lecture seule.' using errcode = 'PT403'; end if;
  return old;
end $$;
drop trigger if exists access_events_immuable on crm.access_events;
create trigger access_events_immuable before update or delete on crm.access_events for each row execute function crm.access_events_immuable();

create or replace function crm.entete(p_nom text) returns text language sql stable as $$
  select nullif(btrim(split_part(coalesce(current_setting('request.headers', true), '{}')::json ->> p_nom, ',', 1)), '');
$$;

create or replace function public.lanceur_journal_connexion() returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if crm.role_actuel() is null then return; end if;
  perform crm.journal('auth.sign_in', 'user', auth.uid(), null, null, 'record-sign-in');
  insert into crm.access_events (user_id, email, result, ip, user_agent, country)
  values (auth.uid(), (select email from auth.users where id = auth.uid()), 'autorise', crm.entete('x-forwarded-for'), left(crm.entete('user-agent'), 300),
          coalesce(crm.entete('cf-ipcountry'), crm.entete('x-vercel-ip-country')));
end $$;

-- Connexion refusée (mauvais mot de passe, mauvais code, pays) : appelable sans session; plafonnée à 30 par adresse IP sur 10 minutes.
create or replace function public.journal_acces_refuse(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v_ip text := crm.entete('x-forwarded-for');
begin
  if coalesce(p ->> 'raison', '') not in ('mot_de_passe', 'code_2fa', 'pays', 'compte_suspendu', 'hors_equipe') then return; end if;
  if (select count(*) from crm.access_events where ip is not distinct from v_ip and at > now() - interval '10 minutes') >= 30 then return; end if;
  insert into crm.access_events (user_id, email, result, reason, ip, user_agent, country)
  values (auth.uid(), left(lower(btrim(p ->> 'courriel')), 254), 'refuse', p ->> 'raison', v_ip, left(crm.entete('user-agent'), 300), coalesce(crm.entete('cf-ipcountry'), crm.entete('x-vercel-ip-country'), p ->> 'pays'));
end $$;

create or replace function public.lanceur_journal_acces(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_r text := coalesce(p ->> 'resultat', 'tous'); v_j int := least(coalesce(nullif(p ->> 'jours', '')::int, 30), 1100);
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then raise exception 'Réservé à l’administrateur.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'evenements', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'le', e.at, 'qui', coalesce(tm.display_name, e.email, 'Inconnu'), 'courriel', e.email, 'resultat', e.result, 'raison', e.reason,
        'ip', e.ip, 'navigateur', e.user_agent, 'pays', e.country) order by e.at desc)
      from (select * from crm.access_events where at > now() - make_interval(days => v_j) and (v_r = 'tous' or result = case v_r when 'autorises' then 'autorise' else 'refuse' end) order by at desc limit 1000) e
      left join crm.team_members tm on tm.user_id = e.user_id), '[]'::jsonb),
    'totaux', (select jsonb_build_object('autorises', count(*) filter (where result = 'autorise'), 'refuses', count(*) filter (where result = 'refuse')) from crm.access_events where at > now() - make_interval(days => v_j)));
end $$;

-- ── Réglages de sécurité ──
insert into config.parametres (cle, valeur) values ('securite', '{"inactivite_minutes": 30, "canada_seulement": true, "mdp_min": 12, "exceptions": []}'::jsonb) on conflict (cle) do nothing;
insert into config.parametres (cle, valeur) values ('responsable_prp', 'null'::jsonb) on conflict (cle) do nothing;

create or replace function public.lanceur_politique() returns jsonb language sql stable security definer set search_path = '' as $$
  -- lue par l'interface de l'équipe : déconnexion après inactivité, pays, mot de passe; l'exception d'une personne la concerne seule
  select case when crm.role_actuel() is null then null else
    (select jsonb_build_object('inactivite_minutes', (valeur ->> 'inactivite_minutes')::int, 'canada_seulement', (valeur ->> 'canada_seulement')::boolean, 'mdp_min', (valeur ->> 'mdp_min')::int,
       'exception', exists (select 1 from jsonb_array_elements(coalesce(valeur -> 'exceptions', '[]')) x where x ->> 'user_id' = auth.uid()::text and (x ->> 'jusqu')::date >= current_date))
     from config.parametres where cle = 'securite') end;
$$;

create or replace function public.lanceur_securite() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then raise exception 'Réservé à l’administrateur.' using errcode = 'PT403'; end if;
  return jsonb_build_object('reglages', (select valeur from config.parametres where cle = 'securite'),
    'responsable', (select jsonb_build_object('user_id', tm.user_id, 'nom', tm.display_name, 'courriel', u.email, 'titre', tm.title, 'telephone', tm.phone)
                    from config.parametres c join crm.team_members tm on tm.user_id = (c.valeur ->> 'user_id')::uuid join auth.users u on u.id = tm.user_id where c.cle = 'responsable_prp'),
    'membres', coalesce((select jsonb_agg(jsonb_build_object('user_id', user_id, 'nom', display_name) order by display_name) from crm.team_members where active), '[]'::jsonb),
    'sans_2fa', (select count(*) from crm.team_members tm where tm.active and not exists (select 1 from auth.mfa_factors f where f.user_id = tm.user_id and f.status = 'verified')));
end $$;

create or replace function public.lanceur_securite_maj(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v_avant jsonb; v_ex jsonb := '[]'; x jsonb;
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then raise exception 'Réservé à l’administrateur.' using errcode = 'PT403'; end if;
  select valeur into v_avant from config.parametres where cle = 'securite';
  if coalesce((p ->> 'inactivite_minutes')::int, 0) not between 5 and 480 then raise exception 'Inactivité : entre 5 et 480 minutes.' using errcode = 'PT422'; end if;
  if coalesce((p ->> 'mdp_min')::int, 0) not between 10 and 64 then raise exception 'Mot de passe : 10 à 64 caractères au minimum.' using errcode = 'PT422'; end if;
  for x in select * from jsonb_array_elements(coalesce(p -> 'exceptions', '[]')) loop
    if char_length(btrim(coalesce(x ->> 'raison', ''))) < 5 or (x ->> 'jusqu')::date is null or (x ->> 'jusqu')::date > current_date + 90 then
      raise exception 'Chaque exception demande une raison et une date de fin (90 jours au plus).' using errcode = 'PT422'; end if;
    v_ex := v_ex || jsonb_build_array(jsonb_build_object('user_id', x ->> 'user_id', 'raison', btrim(x ->> 'raison'), 'jusqu', x ->> 'jusqu', 'par', auth.uid()));
  end loop;
  update config.parametres set valeur = jsonb_build_object('inactivite_minutes', (p ->> 'inactivite_minutes')::int, 'canada_seulement', coalesce((p ->> 'canada_seulement')::boolean, true),
    'mdp_min', (p ->> 'mdp_min')::int, 'exceptions', v_ex) where cle = 'securite';
  if p ? 'responsable_prp' then
    if nullif(p ->> 'responsable_prp', '') is not null and not exists (select 1 from crm.team_members where user_id = (p ->> 'responsable_prp')::uuid and active) then
      raise exception 'Le responsable doit être un membre actif de l’équipe.' using errcode = 'PT422'; end if;
    update config.parametres set valeur = case when nullif(p ->> 'responsable_prp', '') is null then 'null'::jsonb else jsonb_build_object('user_id', p ->> 'responsable_prp') end where cle = 'responsable_prp';
  end if;
  perform crm.journal('security.settings_updated', 'config.parametres', null, v_avant, p, 'update-security-settings');
end $$;

-- ── Comptes de l'équipe ──
create or replace function public.lanceur_comptes() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then raise exception 'Réservé à l’administrateur.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'comptes', coalesce((select jsonb_agg(jsonb_build_object('user_id', tm.user_id, 'nom', tm.display_name, 'initiales', tm.initials, 'role', tm.role, 'role_libelle', crm.libelle_role(tm.role),
        'courriel', u.email, 'statut', case when tm.removed_at is not null then 'retire' when not tm.active then 'suspendu' else 'actif' end, 'updated_at', tm.updated_at,
        'deux_facteurs', exists (select 1 from auth.mfa_factors f where f.user_id = tm.user_id and f.status = 'verified'),
        'derniere_connexion', u.last_sign_in_at, 'depuis', tm.created_at, 'titre', tm.title,
        'activite', (select jsonb_agg(jsonb_build_object('action', a.action, 'le', a.created_at)) from (select action, created_at from public.audit_log where actor_id = tm.user_id order by created_at desc limit 5) a))
        order by tm.removed_at nulls first, tm.active desc, tm.display_name)
      from crm.team_members tm join auth.users u on u.id = tm.user_id), '[]'::jsonb),
    'invitations', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'nom', i.full_name, 'courriel', i.email, 'role', i.team_role, 'role_libelle', crm.libelle_role(i.team_role), 'expire', i.expires_at,
        'expiree', i.expires_at < now(), 'par', crm.nom_membre(i.created_by)) order by i.created_at desc)
      from public.portal_invitations i where i.kind = 'equipe' and i.used_at is null and i.revoked_at is null), '[]'::jsonb),
    'roles', (select jsonb_agg(jsonb_build_object('role', r, 'libelle', crm.libelle_role(r), 'permissions', coalesce((select jsonb_agg(permission order by permission) from crm.role_permissions where role = r), '[]'::jsonb)))
              from unnest(array['admin', 'gestionnaire', 'location', 'prospection', 'comptabilite', 'lecture']) r),
    'moi', auth.uid());
end $$;

create or replace function public.lanceur_inviter_equipe(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare i public.portal_invitations; v_mail text := lower(btrim(coalesce(p ->> 'courriel', '')));
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then raise exception 'Seul un administrateur invite dans l’équipe.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(p ->> 'nom', ''))) < 3 or position(' ' in btrim(p ->> 'nom')) = 0 then raise exception 'Nom complet requis (prénom et nom).' using errcode = 'PT422'; end if;
  if v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Courriel invalide.' using errcode = 'PT422'; end if;
  if coalesce(p ->> 'role', '') not in ('admin', 'gestionnaire', 'location', 'prospection', 'comptabilite', 'lecture') then raise exception 'Rôle inconnu.' using errcode = 'PT422'; end if;
  if exists (select 1 from crm.team_members tm join auth.users u on u.id = tm.user_id where lower(u.email) = v_mail and tm.removed_at is null) then
    raise exception 'Cette personne fait déjà partie de l’équipe.' using errcode = 'PT409'; end if;
  update public.portal_invitations set revoked_at = now() where kind = 'equipe' and email = v_mail and used_at is null and revoked_at is null;
  insert into public.portal_invitations (code, kind, email, full_name, team_role, created_by, expires_at)
  values (crm.code_invitation(), 'equipe', v_mail, btrim(p ->> 'nom'), p ->> 'role', auth.uid(), now() + interval '72 hours') returning * into i;
  perform crm.envoyer_invitation(i, null, 'interface');
  perform crm.journal('team_member.invited', 'public.portal_invitations', i.id, null, jsonb_build_object('role', i.team_role, 'courriel', v_mail), 'invite-team-member');
  return jsonb_build_object('id', i.id, 'code', i.code, 'expire', i.expires_at);
end $$;

create or replace function public.lanceur_compte_action(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare tm crm.team_members; v_a text := p ->> 'action'; i public.portal_invitations;
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then raise exception 'Réservé à l’administrateur.' using errcode = 'PT403'; end if;
  if v_a in ('renvoyer', 'annuler_invitation') then
    select * into i from public.portal_invitations where id = (p ->> 'invitation_id')::uuid and kind = 'equipe' and used_at is null and revoked_at is null for update;
    if not found then raise exception 'Invitation introuvable.' using errcode = 'PT404'; end if;
    if v_a = 'annuler_invitation' then update public.portal_invitations set revoked_at = now() where id = i.id;
    else
      update public.portal_invitations set revoked_at = now() where id = i.id;
      insert into public.portal_invitations (code, kind, email, full_name, team_role, created_by, expires_at)
      values (crm.code_invitation(), 'equipe', i.email, i.full_name, i.team_role, auth.uid(), now() + interval '72 hours') returning * into i;
      perform crm.envoyer_invitation(i, null, 'interface');
    end if;
    perform crm.journal('team_member.' || v_a, 'public.portal_invitations', i.id, null, null, 'invite-team-member');
    return;
  end if;
  select * into tm from crm.team_members where user_id = (p ->> 'user_id')::uuid for update;
  if not found then raise exception 'Compte introuvable.' using errcode = 'PT404'; end if;
  if v_a in ('suspendre', 'retirer') then
    if tm.user_id = auth.uid() then raise exception 'Vous ne pouvez pas retirer votre propre accès.' using errcode = 'PT422'; end if;
    if tm.role = 'admin' and (select count(*) from crm.team_members where role = 'admin' and active and removed_at is null and user_id <> tm.user_id) = 0 then
      raise exception 'Il faut garder au moins un administrateur actif.' using errcode = 'PT422'; end if;
    update crm.team_members set active = false, removed_at = case when v_a = 'retirer' then now() else removed_at end, updated_at = now() where user_id = tm.user_id;
    delete from auth.sessions where user_id = tm.user_id;     -- déconnexion immédiate
  elsif v_a = 'reactiver' then
    if tm.removed_at is not null then raise exception 'Un accès retiré se redonne par une nouvelle invitation.' using errcode = 'PT409'; end if;
    update crm.team_members set active = true, updated_at = now() where user_id = tm.user_id;
  elsif v_a = 'rappel_2fa' then
    perform crm.notifier(array[tm.user_id], 'info', 'lock', 'Activez la double authentification', 'Elle est obligatoire pour garder l’accès au Lanceur.', null, '/compte', 'crm.team_members', null);
  elsif v_a = 'reinitialisation' then
    null; -- le lien part par l'authentification (resetPasswordForEmail); on l'inscrit au journal
  else raise exception 'Action inconnue.' using errcode = 'PT422';
  end if;
  perform crm.journal('team_member.' || v_a, 'crm.team_members', tm.user_id, jsonb_build_object('actif', tm.active, 'role', tm.role), p, 'update-team-member');
end $$;

-- ── Rôles et permissions (matrice) ──
create or replace function public.lanceur_permission_maj(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then raise exception 'Réservé à l’administrateur.' using errcode = 'PT403'; end if;
  if coalesce(p ->> 'role', '') not in ('gestionnaire', 'location', 'prospection', 'comptabilite', 'lecture') then raise exception 'Ce rôle ne se modifie pas.' using errcode = 'PT422'; end if;
  if coalesce(p ->> 'permission', '') !~ '^[a-z]+(\.[a-z]+)*$' then raise exception 'Permission invalide.' using errcode = 'PT422'; end if;
  if p ->> 'permission' in ('reglages.equipe', 'ia.routeur') then raise exception 'Droit réservé à l’administrateur.' using errcode = 'PT422'; end if;
  if p ->> 'role' = 'lecture' and p ->> 'permission' !~ '\.lire$' and coalesce((p ->> 'actif')::boolean, false) then raise exception 'Le rôle Lecture seule ne reçoit que des droits de lecture.' using errcode = 'PT422'; end if;
  if coalesce((p ->> 'actif')::boolean, false) then insert into crm.role_permissions (role, permission) values (p ->> 'role', p ->> 'permission') on conflict do nothing;
  else delete from crm.role_permissions where role = p ->> 'role' and permission = p ->> 'permission'; end if;
  perform crm.journal('role.permission_changed', 'crm.role_permissions', null, null, p, 'update-role-permission');
end $$;

-- ── Sessions (Mon compte, et l'administrateur pour un compte) ──
create or replace function public.lanceur_sessions(p_user uuid default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_u uuid := coalesce(p_user, auth.uid());
begin
  perform crm.require_aal2();
  if crm.role_actuel() is null then raise exception 'Réservé à l’équipe.' using errcode = 'PT403'; end if;
  if v_u <> auth.uid() and not crm.can('reglages.equipe') then raise exception 'Réservé à l’administrateur.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'debut', s.created_at, 'activite', coalesce((to_jsonb(s) ->> 'refreshed_at')::timestamptz, s.updated_at, s.created_at), 'navigateur', s.user_agent, 'ip', host(s.ip),
      'actuelle', s.id::text = auth.jwt() ->> 'session_id') order by coalesce((to_jsonb(s) ->> 'refreshed_at')::timestamptz, s.updated_at, s.created_at) desc) from auth.sessions s where s.user_id = v_u), '[]'::jsonb);
end $$;

create or replace function public.lanceur_revoquer_session(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v_u uuid;
begin
  perform crm.require_aal2();
  select user_id into v_u from auth.sessions where id = (p ->> 'id')::uuid;
  if v_u is null then raise exception 'Session introuvable.' using errcode = 'PT404'; end if;
  if v_u <> auth.uid() and not crm.can('reglages.equipe') then raise exception 'Réservé à l’administrateur.' using errcode = 'PT403'; end if;
  delete from auth.sessions where id = (p ->> 'id')::uuid;
  perform crm.journal('auth.session_revoked', 'user', v_u, null, jsonb_build_object('session', p ->> 'id'), 'revoke-session');
end $$;

-- ── Revue trimestrielle des accès ──
create table if not exists crm.access_reviews (
  id uuid primary key default gen_random_uuid(), trimestre text not null unique check (trimestre ~ '^\d{4}-T[1-4]$'), opened_at timestamptz not null default now(), opened_by uuid references auth.users(id),
  closed_at timestamptz, closed_by uuid references auth.users(id)
);
create table if not exists crm.access_review_items (
  review_id uuid not null references crm.access_reviews(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  role text not null, decision text check (decision in ('confirme', 'retire')), decided_by uuid references auth.users(id), decided_at timestamptz, note text, primary key (review_id, user_id)
);
alter table crm.access_reviews enable row level security; alter table crm.access_review_items enable row level security;
revoke all on crm.access_reviews, crm.access_review_items from anon, authenticated; grant all on crm.access_reviews, crm.access_review_items to service_role;

create or replace function crm.trimestre(p date default current_date) returns text language sql immutable as $$ select to_char(p, 'YYYY') || '-T' || extract(quarter from p); $$;

create or replace function public.lanceur_revue_acces() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r crm.access_reviews;
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then raise exception 'Réservé à l’administrateur.' using errcode = 'PT403'; end if;
  select * into r from crm.access_reviews where trimestre = crm.trimestre();
  return jsonb_build_object('trimestre', crm.trimestre(), 'ouverte', r.id is not null, 'fermee_le', r.closed_at, 'fermee_par', crm.nom_membre(r.closed_by),
    'precedente', (select jsonb_build_object('trimestre', trimestre, 'fermee_le', closed_at) from crm.access_reviews where trimestre < crm.trimestre() order by trimestre desc limit 1),
    'comptes', coalesce((select jsonb_agg(jsonb_build_object('user_id', it.user_id, 'nom', tm.display_name, 'role', crm.libelle_role(it.role), 'decision', it.decision, 'par', crm.nom_membre(it.decided_by),
        'derniere_connexion', u.last_sign_in_at) order by tm.display_name) from crm.access_review_items it join crm.team_members tm on tm.user_id = it.user_id join auth.users u on u.id = it.user_id where it.review_id = r.id), '[]'::jsonb));
end $$;

create or replace function public.lanceur_revue_action(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare r crm.access_reviews; it crm.access_review_items;
begin
  perform crm.require_aal2();
  if not crm.can('reglages.equipe') then raise exception 'Réservé à l’administrateur.' using errcode = 'PT403'; end if;
  if p ->> 'action' = 'ouvrir' then
    insert into crm.access_reviews (trimestre, opened_by) values (crm.trimestre(), auth.uid()) on conflict (trimestre) do nothing returning * into r;
    if r.id is not null then
      insert into crm.access_review_items (review_id, user_id, role) select r.id, user_id, role from crm.team_members where active and removed_at is null;
      perform crm.journal('access_review.opened', 'crm.access_reviews', r.id, null, jsonb_build_object('trimestre', r.trimestre), 'access-review');
    end if;
    return;
  end if;
  select * into r from crm.access_reviews where trimestre = crm.trimestre() for update;
  if not found then raise exception 'Ouvrez d’abord la revue du trimestre.' using errcode = 'PT409'; end if;
  if r.closed_at is not null then raise exception 'La revue de ce trimestre est fermée.' using errcode = 'PT409'; end if;
  if p ->> 'action' = 'fermer' then
    if exists (select 1 from crm.access_review_items where review_id = r.id and decision is null) then
      raise exception 'Chaque compte doit être confirmé ou retiré avant de fermer la revue.' using errcode = 'PT422'; end if;
    update crm.access_reviews set closed_at = now(), closed_by = auth.uid() where id = r.id;
    perform crm.journal('access_review.closed', 'crm.access_reviews', r.id, null, null, 'access-review');
    return;
  end if;
  if p ->> 'action' not in ('confirme', 'retire') then raise exception 'Décision inconnue.' using errcode = 'PT422'; end if;
  select * into it from crm.access_review_items where review_id = r.id and user_id = (p ->> 'user_id')::uuid for update;
  if not found then raise exception 'Compte absent de la revue.' using errcode = 'PT404'; end if;
  if p ->> 'action' = 'retire' then perform public.lanceur_compte_action(jsonb_build_object('user_id', it.user_id, 'action', 'retirer')); end if;
  update crm.access_review_items set decision = p ->> 'action', decided_by = auth.uid(), decided_at = now(), note = nullif(btrim(p ->> 'note'), '') where review_id = r.id and user_id = it.user_id;
  perform crm.journal('access_review.' || (p ->> 'action'), 'crm.access_reviews', r.id, null, jsonb_build_object('user_id', it.user_id), 'access-review');
end $$;

-- ── Mon compte ──
create or replace function public.lanceur_mon_compte() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if crm.role_actuel() is null then raise exception 'Réservé à l’équipe.' using errcode = 'PT403'; end if;
  return (select jsonb_build_object('nom', tm.display_name, 'initiales', tm.initials, 'courriel', u.email, 'telephone', tm.phone, 'titre', tm.title, 'role', crm.libelle_role(tm.role),
      'preferences', tm.preferences, 'deux_facteurs', exists (select 1 from auth.mfa_factors f where f.user_id = u.id and f.status = 'verified'),
      'historique', coalesce((select jsonb_agg(jsonb_build_object('le', e.at, 'resultat', e.result, 'raison', e.reason, 'ip', e.ip, 'navigateur', e.user_agent, 'pays', e.country) order by e.at desc)
        from (select * from crm.access_events where user_id = u.id or lower(email) = lower(u.email) order by at desc limit 20) e), '[]'::jsonb),
      'politique', public.lanceur_politique())
    from crm.team_members tm join auth.users u on u.id = tm.user_id where tm.user_id = auth.uid());
end $$;

create or replace function public.lanceur_mon_compte_maj(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare tm crm.team_members; v_nom text := btrim(coalesce(p ->> 'nom', ''));
begin
  perform crm.require_aal2();
  select * into tm from crm.team_members where user_id = auth.uid() for update;
  if not found then raise exception 'Réservé à l’équipe.' using errcode = 'PT403'; end if;
  if char_length(v_nom) not between 2 and 80 then raise exception 'Le nom doit compter de 2 à 80 caractères.' using errcode = 'PT422'; end if;
  if coalesce(p -> 'preferences' ->> 'langue', 'fr') not in ('fr', 'en') or coalesce(p -> 'preferences' ->> 'theme', 'clair') not in ('clair', 'sombre', 'systeme') then
    raise exception 'Préférence inconnue.' using errcode = 'PT422'; end if;
  update crm.team_members set display_name = v_nom, initials = upper(left(split_part(v_nom, ' ', 1), 1) || left(split_part(v_nom, ' ', 2), 1)),
    phone = nullif(btrim(p ->> 'telephone'), ''), title = nullif(btrim(p ->> 'titre'), ''), preferences = coalesce(p -> 'preferences', preferences), updated_at = now() where user_id = tm.user_id;
  perform crm.journal('team_member.profile_updated', 'crm.team_members', tm.user_id, jsonb_build_object('nom', tm.display_name), jsonb_build_object('nom', v_nom), 'update-my-account');
end $$;

-- « Nous joindre » : la demande arrive aux administrateurs comme tâche, avec le message.
create or replace function public.lanceur_nous_joindre(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if crm.role_actuel() is null then raise exception 'Réservé à l’équipe.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(p ->> 'sujet', ''))) < 3 or char_length(btrim(coalesce(p ->> 'message', ''))) < 10 then raise exception 'Sujet et message requis.' using errcode = 'PT422'; end if;
  perform crm.creer_tache(jsonb_build_object('title', 'Aide : ' || left(btrim(p ->> 'sujet'), 150), 'context', crm.nom_membre(auth.uid()) || ' · ' || left(btrim(p ->> 'message'), 400),
    'assignee_role', 'admin', 'due_at', now() + interval '1 day', 'source', 'system', 'entity_type', 'crm.team_members', 'entity_id', auth.uid()));
end $$;

revoke all on function crm.libelle_role(text), crm.entete(text), crm.trimestre(date), crm.access_events_immuable() from public, anon, authenticated;
grant execute on function crm.libelle_role(text), crm.trimestre(date) to authenticated, service_role;
grant execute on function crm.entete(text) to anon, authenticated, service_role;
revoke all on function public.journal_acces_refuse(jsonb) from public; grant execute on function public.journal_acces_refuse(jsonb) to anon, authenticated;
revoke all on function public.lanceur_journal_acces(jsonb), public.lanceur_politique(), public.lanceur_securite(), public.lanceur_securite_maj(jsonb), public.lanceur_comptes(),
  public.lanceur_inviter_equipe(jsonb), public.lanceur_compte_action(jsonb), public.lanceur_permission_maj(jsonb), public.lanceur_sessions(uuid), public.lanceur_revoquer_session(jsonb),
  public.lanceur_revue_acces(), public.lanceur_revue_action(jsonb), public.lanceur_mon_compte(), public.lanceur_mon_compte_maj(jsonb), public.lanceur_nous_joindre(jsonb) from public, anon;
grant execute on function public.lanceur_journal_acces(jsonb), public.lanceur_politique(), public.lanceur_securite(), public.lanceur_securite_maj(jsonb), public.lanceur_comptes(),
  public.lanceur_inviter_equipe(jsonb), public.lanceur_compte_action(jsonb), public.lanceur_permission_maj(jsonb), public.lanceur_sessions(uuid), public.lanceur_revoquer_session(jsonb),
  public.lanceur_revue_acces(), public.lanceur_revue_action(jsonb), public.lanceur_mon_compte(), public.lanceur_mon_compte_maj(jsonb), public.lanceur_nous_joindre(jsonb) to authenticated;
