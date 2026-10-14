-- TP · Jalon 4a : inscription par code d'invitation (A2), copropriétaires et comptables (écran 14), lecture seule pour la comptabilité.
--   • public.portal_invitations : code LL-XXXX-XXXX, 14 jours, une seule utilisation, lié au courriel invité. L'équipe invite les locataires et
--     les propriétaires (lanceur_inviter_portail, courriels LOC-01 / PRO-14); le propriétaire invite un copropriétaire ou un comptable
--     (portail_inviter). La création du compte passe par la fonction edge « portail-inscription » (clé de service, jamais le navigateur).
--   • public.owner_members : personnes qui agissent pour un propriétaire. auth_owner_id() les reconnaît; le comptable ne peut rien écrire
--     (crm.proprio_peut_ecrire). Portée par immeuble : pas encore (tous les immeubles du propriétaire).

create table if not exists public.portal_invitations (
  id uuid primary key default gen_random_uuid(), code text not null unique,
  kind text not null check (kind in ('locataire', 'proprietaire', 'coproprietaire', 'comptable')),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'), full_name text,
  tenant_id uuid references public.tenants(id) on delete cascade, owner_id uuid references public.owners(id) on delete cascade,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), expires_at timestamptz not null default now() + interval '14 days',
  used_at timestamptz, used_by uuid references auth.users(id), revoked_at timestamptz,
  check ((kind = 'locataire') = (tenant_id is not null)), check (kind = 'locataire' or owner_id is not null)
);
create index if not exists portal_invitations_tenant_idx on public.portal_invitations (tenant_id);
create index if not exists portal_invitations_owner_idx on public.portal_invitations (owner_id);
create index if not exists portal_invitations_created_by_idx on public.portal_invitations (created_by);
create index if not exists portal_invitations_used_by_idx on public.portal_invitations (used_by);
alter table public.portal_invitations enable row level security;
drop policy if exists "invitations lues par l'equipe et le proprietaire" on public.portal_invitations;
create policy "invitations lues par l'equipe et le proprietaire" on public.portal_invitations for select to authenticated
  using (crm.can('clients.lire') or (owner_id = public.auth_owner_id() and kind in ('coproprietaire', 'comptable')));
revoke all on public.portal_invitations from anon, authenticated; grant select on public.portal_invitations to authenticated; grant all on public.portal_invitations to service_role;

create table if not exists public.owner_members (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.owners(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, role text not null check (role in ('coproprietaire', 'comptable')),
  full_name text not null, active boolean not null default true, invitation_id uuid references public.portal_invitations(id) on delete set null,
  created_at timestamptz not null default now(), removed_at timestamptz, unique (owner_id, user_id)
);
create index if not exists owner_members_user_idx on public.owner_members (user_id);
create index if not exists owner_members_invitation_idx on public.owner_members (invitation_id);
alter table public.owner_members enable row level security;
drop policy if exists "membres lus par le proprietaire et l'equipe" on public.owner_members;
create policy "membres lus par le proprietaire et l'equipe" on public.owner_members for select to authenticated
  using (owner_id = public.auth_owner_id() or user_id = auth.uid() or crm.can('clients.lire'));
revoke all on public.owner_members from anon, authenticated; grant select on public.owner_members to authenticated; grant all on public.owner_members to service_role;

-- Le propriétaire, sinon le propriétaire pour qui la personne agit (membre actif).
create or replace function public.auth_owner_id() returns uuid language sql stable security definer set search_path to 'public' set row_security to 'off' as $$
  select coalesce((select id from owners where user_id = auth.uid()),
                  (select owner_id from owner_members where user_id = auth.uid() and active order by created_at limit 1))
$$;
create or replace function crm.acces_proprio() returns text language sql stable security definer set search_path = '' as $$
  select case when exists (select 1 from public.owners where user_id = auth.uid()) then 'proprietaire'
              else (select role from public.owner_members where user_id = auth.uid() and active order by created_at limit 1) end
$$;
create or replace function crm.proprio_peut_ecrire(p_titulaire boolean default false) returns void language plpgsql stable security definer set search_path = '' as $$
declare v text := crm.acces_proprio();
begin
  if v = 'comptable' then raise exception 'Votre accès est en lecture seulement (comptabilité).' using errcode = 'PT403'; end if;
  if p_titulaire and v is distinct from 'proprietaire' then raise exception 'Réservé au propriétaire titulaire du compte.' using errcode = 'PT403'; end if;
end $$;

create or replace function public.portail_moi() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare o record; t record; m record; v_o uuid := public.auth_owner_id();
begin
  if auth.uid() is null then return null; end if;
  select id, full_name, company_name into o from public.owners where id = v_o;
  select full_name, role into m from public.owner_members where user_id = auth.uid() and owner_id = v_o and active;
  select id, full_name, email, phone into t from public.tenants where user_id = auth.uid() and anonymized_at is null;
  return jsonb_build_object(
    'role', case when o.id is not null then 'proprietaire' when t.id is not null then 'locataire' when crm.is_team_member() then 'equipe' end,
    'acces', case when o.id is null then null when m.role is not null then m.role else 'proprietaire' end, 'pour', case when m.role is not null then o.full_name end,
    'nom', coalesce(m.full_name, o.full_name, t.full_name), 'prenom', split_part(coalesce(m.full_name, o.full_name, t.full_name, ''), ' ', 1),
    'initiales', upper(left(split_part(coalesce(m.full_name, o.full_name, t.full_name, '?'), ' ', 1), 1) || left(split_part(coalesce(m.full_name, o.full_name, t.full_name, ''), ' ', 2), 1)),
    'menu', coalesce((select menu_position from public.portal_preferences where user_id = auth.uid()), 'gauche'),
    'facteur', exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified'),
    'portes', (select count(*) from public.units u join public.buildings b on b.id = u.building_id where b.owner_id = o.id),
    'immeubles', (select count(*) from public.buildings b where b.owner_id = o.id));
end $$;

-- Code d'invitation lisible (sans 0/O/1/I).
create or replace function crm.code_invitation() returns text language plpgsql volatile set search_path = '' as $$
declare a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea := extensions.gen_random_bytes(8); s text := '';
begin
  for i in 0..7 loop s := s || substr(a, (get_byte(b, i) % 32) + 1, 1); end loop;
  return 'LL-' || left(s, 4) || '-' || right(s, 4);
end $$;

-- Courriels d'invitation : LOC-01 (locataire) et PRO-14 (propriétaire, copropriétaire, comptable), avec variables.
update comms.email_templates t set sms_text = v.sms_text, contenu = v.contenu, subject = v.subject, preheader = v.preheader, variables = v.variables, trigger_event = v.trigger_event,
  essential = v.essential, lcap_category = v.lcap_category, active = true
from (values ('LOC-01', 'Locataires', 'Invitation au portail locataire', 'Lease Lane : votre portail locataire est prêt. Code : {code}. Créez votre accès : {lien}',
 '{"subject": "Votre accès au portail locataire Lease Lane", "pre": "Payez votre loyer, faites une demande et retrouvez vos documents au même endroit.", "label": "Portail locataire", "icon": "key", "eyebrow": "Bienvenue", "title": "{prenom}, votre portail locataire est prêt", "intro": "Votre logement : {logement}. Le portail réunit tout ce dont vous aurez besoin.", "blocks": [["bullets", {"items": ["Retrouver vos paiements et vos reçus de loyer", "Faire une demande d’entretien, photo à l’appui", "Relire votre bail et vos documents", "Écrire à votre gestionnaire ou à Cléo"]}], ["kv", {"rows": [["Votre code d’invitation", "{code}"], ["Valable jusqu’au", "{expire}"]]}], ["notice", {"k": "info", "ic": "lock", "title": "Un code personnel", "t": "Il ne fonctionne qu’avec cette adresse courriel, une seule fois. Vous choisirez votre mot de passe."}]], "cta": {"l": "Créer mon accès", "href": "{lien}", "link": "Une question? Répondez simplement à ce courriel."}, "sign": {"ini": "{initiales_gestionnaire}", "name": "{gestionnaire}", "role": "Gestionnaire · Lease Lane"}, "foot": {"reason": "Vous recevez ce courriel parce que vous louez un logement géré par Lease Lane."}, "spec": {"trigger": "Invitation au portail (équipe)", "send": "Automatique", "when": "Immédiat, entre 8 h et 22 h", "lcap": "Transactionnel"}}'::jsonb,
 'Votre accès au portail locataire Lease Lane', 'Payez votre loyer, faites une demande et retrouvez vos documents au même endroit.',
 array['code', 'expire', 'gestionnaire', 'initiales_gestionnaire', 'lien', 'logement', 'prenom']::text[], 'Invitation au portail (équipe)', 'auto', true, 'transactional', false, true)) v(code, audience, name, sms_text, contenu, subject, preheader, variables, trigger_event, send_mode, essential, lcap_category, unsubscribe_required, active) where t.code = v.code;
insert into comms.email_templates (code, audience, name, sms_text, contenu, subject, preheader, variables, trigger_event, send_mode, essential, lcap_category, unsubscribe_required, active)
select * from (values ('PRO-14', 'Propriétaires', 'Invitation au portail propriétaire', 'Lease Lane : votre accès à l’espace propriétaire. Code : {code}. Créez votre accès : {lien}',
 '{"subject": "Votre accès à l’espace propriétaire Lease Lane", "pre": "{intro}", "label": "Espace propriétaire", "icon": "building", "eyebrow": "Invitation", "title": "{prenom}, votre accès est prêt", "intro": "{intro}", "blocks": [["kv", {"rows": [["Votre code d’invitation", "{code}"], ["Accès", "{acces}"], ["Valable jusqu’au", "{expire}"]]}], ["notice", {"k": "info", "ic": "lock", "title": "Double authentification", "t": "Le code ne fonctionne qu’avec cette adresse courriel, une seule fois. À la première connexion, vous activerez la double authentification."}]], "cta": {"l": "Créer mon accès", "href": "{lien}", "link": "Une question? Répondez simplement à ce courriel."}, "sign": {"ini": "{initiales_gestionnaire}", "name": "{gestionnaire}", "role": "Lease Lane"}, "foot": {"reason": "Vous recevez ce courriel parce qu’un accès à l’espace propriétaire Lease Lane a été créé pour vous."}, "spec": {"trigger": "Invitation à l’espace propriétaire", "send": "Automatique", "when": "Immédiat, entre 8 h et 22 h", "lcap": "Transactionnel"}}'::jsonb,
 'Votre accès à l’espace propriétaire Lease Lane', '{intro}',
 array['acces', 'code', 'expire', 'gestionnaire', 'initiales_gestionnaire', 'intro', 'lien', 'prenom']::text[], 'Invitation à l’espace propriétaire', 'auto', true, 'transactional', false, true)) v(code, audience, name, sms_text, contenu, subject, preheader, variables, trigger_event, send_mode, essential, lcap_category, unsubscribe_required, active) where not exists (select 1 from comms.email_templates where code = 'PRO-14');

create or replace function crm.envoyer_invitation(i public.portal_invitations, p_intro text, p_canal text) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_nom text := coalesce(crm.nom_membre(auth.uid()), 'Lease Lane'); o comms.outbox; v_log text;
begin
  if i.kind = 'locataire' then
    select b.address || coalesce(' — logement ' || u.unit_number, '') into v_log from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
     where l.id = crm.bail_locataire(i.tenant_id);
  end if;
  o := comms.enqueue(jsonb_build_object('template_code', case i.kind when 'locataire' then 'LOC-01' else 'PRO-14' end, 'channel', 'email', 'recipient', i.email,
    'entity_type', 'public.portal_invitations', 'entity_id', i.id, 'canal_journal', p_canal, 'idempotency_key', 'invitation:' || i.id,
    'vars', jsonb_build_object('prenom', split_part(coalesce(i.full_name, ''), ' ', 1), 'code', i.code, 'lien', 'https://app.leaselane.ca/espace/inscription?p=' || case i.kind when 'locataire' then 'locataire' else 'proprietaire' end || '&code=' || i.code,
      'expire', to_char(i.expires_at at time zone 'America/Toronto', 'DD/MM/YYYY'), 'logement', coalesce(v_log, 'votre logement'), 'intro', coalesce(p_intro, ''),
      'acces', case i.kind when 'proprietaire' then 'Propriétaire' when 'coproprietaire' then 'Copropriétaire' when 'comptable' then 'Comptabilité (lecture seulement)' else 'Locataire' end,
      'gestionnaire', v_nom, 'initiales_gestionnaire', upper(left(split_part(v_nom, ' ', 1), 1) || left(split_part(v_nom, ' ', 2), 1)))));
  return o.id;
end $$;

-- Équipe : inviter un locataire ou un propriétaire (une invitation ouverte à la fois par personne).
create or replace function public.lanceur_inviter_portail(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare i public.portal_invitations; v_mail text; v_nom text; v_kind text;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas d’inviter.' using errcode = 'PT403'; end if;
  if p ? 'tenant_id' then
    select email, full_name, case when user_id is null then 'locataire' end into v_mail, v_nom, v_kind from public.tenants where id = (p ->> 'tenant_id')::uuid and anonymized_at is null;
  else
    select u.email, o.full_name, case when o.user_id is null then 'proprietaire' end into v_mail, v_nom, v_kind from public.owners o left join auth.users u on u.id = o.user_id where o.id = (p ->> 'owner_id')::uuid;
    v_mail := coalesce(nullif(lower(btrim(p ->> 'courriel')), ''), v_mail);
  end if;
  if v_nom is null then raise exception 'Personne introuvable.' using errcode = 'PT404'; end if;
  if v_kind is null then raise exception 'Cette personne a déjà un accès au portail.' using errcode = 'PT409'; end if;
  if coalesce(v_mail, '') = '' then raise exception 'Ajoutez son courriel avant de l’inviter.' using errcode = 'PT422'; end if;
  update public.portal_invitations set revoked_at = now() where used_at is null and revoked_at is null
    and (tenant_id = (p ->> 'tenant_id')::uuid or (kind = 'proprietaire' and owner_id = (p ->> 'owner_id')::uuid));
  insert into public.portal_invitations (code, kind, email, full_name, tenant_id, owner_id, created_by)
  values (crm.code_invitation(), v_kind, lower(v_mail), v_nom, (p ->> 'tenant_id')::uuid, (p ->> 'owner_id')::uuid, auth.uid()) returning * into i;
  perform crm.envoyer_invitation(i, 'Lease Lane gère vos immeubles; votre espace réunit relevés, accords de dépense et documents.', 'interface');
  perform crm.journal('portal.invitation_sent', 'public.portal_invitations', i.id, null, jsonb_build_object('kind', i.kind), 'invite-portal-user');
  return jsonb_build_object('id', i.id, 'code', i.code, 'expire', i.expires_at);
end $$;

-- Propriétaire titulaire : inviter un copropriétaire ou un comptable; annuler une invitation; retirer un accès.
create or replace function public.portail_inviter(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare i public.portal_invitations; v_o uuid := public.auth_owner_id(); v_mail text := lower(btrim(coalesce(p ->> 'courriel', ''))); v_moi text;
begin
  perform crm.exiger_niveau_portail(true); perform crm.proprio_peut_ecrire(true);
  if p ->> 'role' not in ('coproprietaire', 'comptable') then raise exception 'Rôle inconnu.' using errcode = 'PT422'; end if;
  if char_length(btrim(coalesce(p ->> 'nom', ''))) < 2 then raise exception 'Indiquez le nom de la personne.' using errcode = 'PT422'; end if;
  if v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Courriel invalide.' using errcode = 'PT422'; end if;
  if exists (select 1 from public.owner_members m join auth.users u on u.id = m.user_id where m.owner_id = v_o and m.active and lower(u.email) = v_mail) then
    raise exception 'Cette personne a déjà accès à votre espace.' using errcode = 'PT409'; end if;
  update public.portal_invitations set revoked_at = now() where owner_id = v_o and lower(email) = v_mail and used_at is null and revoked_at is null;
  insert into public.portal_invitations (code, kind, email, full_name, owner_id, created_by) values (crm.code_invitation(), p ->> 'role', v_mail, btrim(p ->> 'nom'), v_o, auth.uid()) returning * into i;
  select full_name into v_moi from public.owners where id = v_o;
  perform crm.envoyer_invitation(i, v_moi || ' vous invite dans son espace propriétaire Lease Lane' || case i.kind when 'comptable' then ', en lecture seulement (finance et relevés).' else ' comme copropriétaire.' end, 'portail');
  perform crm.journal('portal.member_invited', 'public.portal_invitations', i.id, null, jsonb_build_object('role', i.kind), 'invite-portal-user', 'portail');
  return jsonb_build_object('id', i.id, 'expire', i.expires_at);
end $$;
create or replace function public.portail_annuler_invitation(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.exiger_niveau_portail(true); perform crm.proprio_peut_ecrire(true);
  update public.portal_invitations set revoked_at = now() where id = p_id and owner_id = public.auth_owner_id() and kind in ('coproprietaire', 'comptable') and used_at is null and revoked_at is null;
  if not found then raise exception 'Invitation introuvable ou déjà utilisée.' using errcode = 'PT404'; end if;
  perform crm.journal('portal.invitation_revoked', 'public.portal_invitations', p_id, null, null, 'revoke-invitation', 'portail');
end $$;
create or replace function public.portail_retirer_acces(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.exiger_niveau_portail(true); perform crm.proprio_peut_ecrire(true);
  update public.owner_members set active = false, removed_at = now() where id = p_id and owner_id = public.auth_owner_id() and active;
  if not found then raise exception 'Accès introuvable.' using errcode = 'PT404'; end if;
  perform crm.journal('portal.member_removed', 'public.owner_members', p_id, jsonb_build_object('active', true), jsonb_build_object('active', false), 'remove-portal-user', 'portail');
end $$;

-- Inscription (fonction edge « portail-inscription », clé de service) : vérifier puis utiliser le code.
create or replace function public.service_invitation(p_code text, p_courriel text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare i public.portal_invitations;
begin
  select * into i from public.portal_invitations where code = upper(btrim(p_code));
  if not found or i.revoked_at is not null then raise exception 'Code d’invitation inconnu. Vérifiez-le dans votre courriel.' using errcode = 'PT404'; end if;
  if i.used_at is not null then raise exception 'Ce code a déjà servi : connectez-vous.' using errcode = 'PT409'; end if;
  if i.expires_at < now() then raise exception 'Ce code a expiré : demandez une nouvelle invitation à votre gestionnaire.' using errcode = 'PT409'; end if;
  if lower(btrim(p_courriel)) <> i.email then raise exception 'Ce code a été envoyé à une autre adresse courriel : utilisez celle de l’invitation.' using errcode = 'PT422'; end if;
  return jsonb_build_object('id', i.id, 'kind', i.kind, 'nom', i.full_name);
end $$;
create or replace function public.service_invitation_utiliser(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare i public.portal_invitations; v_user uuid := (p ->> 'user_id')::uuid; v_nom text := btrim(concat_ws(' ', btrim(p ->> 'prenom'), btrim(p ->> 'nom')));
begin
  select * into i from public.portal_invitations where code = upper(btrim(p ->> 'code')) for update;
  if not found or i.revoked_at is not null or i.used_at is not null or i.expires_at < now() then raise exception 'Invitation non valide.' using errcode = 'PT409'; end if;
  if i.kind = 'locataire' then
    update public.tenants set user_id = v_user, full_name = coalesce(nullif(v_nom, ''), full_name) where id = i.tenant_id and user_id is null;
  elsif i.kind = 'proprietaire' then
    update public.owners set user_id = v_user, full_name = coalesce(nullif(v_nom, ''), full_name) where id = i.owner_id and user_id is null;
  else
    insert into public.owner_members (owner_id, user_id, role, full_name, invitation_id) values (i.owner_id, v_user, i.kind, coalesce(nullif(v_nom, ''), i.full_name), i.id)
    on conflict (owner_id, user_id) do update set active = true, removed_at = null, role = excluded.role;
  end if;
  if not found then raise exception 'Cet accès est déjà relié à un compte.' using errcode = 'PT409'; end if;
  update public.portal_invitations set used_at = now(), used_by = v_user where id = i.id;
  if coalesce((p ->> 'infolettre')::boolean, false) and not exists (select 1 from comms.consents where lower(address) = i.email and purpose = 'commercial' and withdrawn_at is null) then
    insert into comms.consents (channel, address, purpose, basis, source, proof) values ('email', i.email, 'commercial', 'express', 'inscription_portail',
      jsonb_build_object('texte', 'J’accepte de recevoir l’infolettre et les offres de Lease Lane. Je peux me désabonner en un clic.', 'le', now(), 'ip', p ->> 'ip'));
  end if;
  perform crm.journal('portal.signup', 'public.portal_invitations', i.id, null, jsonb_build_object('kind', i.kind, 'conditions', true, 'infolettre', coalesce((p ->> 'infolettre')::boolean, false)), 'portal-signup', 'api', null, 'system');
  return jsonb_build_object('kind', i.kind);
end $$;

-- Écran 14 : on ajoute les membres (copropriétaires, comptables) et les invitations en attente.
create or replace function public.portail_acces() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id();
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return jsonb_build_object('titulaire', crm.acces_proprio() = 'proprietaire',
    'utilisateurs', (select jsonb_agg(x) from (
        select jsonb_build_object('nom', o.full_name, 'courriel', u.email, 'role', 'Propriétaire', 'portee', 'Tous vos immeubles', 'deux_fa', exists (select 1 from auth.mfa_factors f where f.user_id = u.id and f.status = 'verified'),
          'actif', true, 'derniere', u.last_sign_in_at, 'vous', o.user_id = auth.uid()) x from public.owners o join auth.users u on u.id = o.user_id where o.id = v_o
        union all
        select jsonb_build_object('membre_id', m.id, 'nom', m.full_name, 'courriel', u.email, 'role', case m.role when 'coproprietaire' then 'Copropriétaire' else 'Comptabilité (lecture)' end,
          'portee', case m.role when 'coproprietaire' then 'Tous vos immeubles' else 'Finance et relevés' end, 'deux_fa', exists (select 1 from auth.mfa_factors f where f.user_id = m.user_id and f.status = 'verified'),
          'actif', m.active, 'derniere', u.last_sign_in_at, 'vous', m.user_id = auth.uid())
        from public.owner_members m join auth.users u on u.id = m.user_id where m.owner_id = v_o and m.active
        union all
        select jsonb_build_object('nom', tm.display_name, 'courriel', au.email, 'role', case tm.role when 'gestionnaire' then 'Gestionnaire Lease Lane' when 'location' then 'Location Lease Lane' when 'comptabilite' then 'Comptabilité Lease Lane (lecture)' else 'Administration Lease Lane' end,
          'portee', 'Mandat de gestion', 'deux_fa', exists (select 1 from auth.mfa_factors f where f.user_id = tm.user_id and f.status = 'verified'), 'actif', tm.active, 'derniere', au.last_sign_in_at, 'vous', false, 'equipe', true)
        from crm.team_members tm join auth.users au on au.id = tm.user_id where tm.active and tm.role in ('gestionnaire', 'location', 'comptabilite', 'admin')) z),
    'invitations', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'nom', i.full_name, 'courriel', i.email, 'role', i.kind, 'envoyee', i.created_at, 'expire', i.expires_at) order by i.created_at desc)
      from public.portal_invitations i where i.owner_id = v_o and i.kind in ('coproprietaire', 'comptable') and i.used_at is null and i.revoked_at is null and i.expires_at > now()), '[]'::jsonb),
    'refus', (select count(*) from public.audit_log a where a.actor_id in (select user_id from public.owner_members where owner_id = v_o) and a.action like '%denied%' and a.created_at > now() - interval '30 days'),
    'journal', coalesce((select jsonb_agg(jsonb_build_object('le', a.created_at, 'qui', case when a.actor_kind = 'person' then coalesce(crm.nom_membre(a.actor_id), (select full_name from public.owner_members where user_id = a.actor_id and owner_id = v_o), 'Vous') else 'Cléo (assistante)' end,
        'quoi', case a.action when 'tenant.read_by_owner' then 'Consultation d’une fiche locataire' when 'approval.decided_by_owner' then 'Décision sur une dépense'
          when 'document.added_by_owner' then 'Dépôt d’un document' when 'building.submitted' then 'Immeuble soumis' when 'automated_decision.review_requested' then 'Révision humaine demandée'
          when 'screening.report_read' then 'Lecture d’un rapport de crédit' when 'portal.member_invited' then 'Invitation envoyée' when 'portal.member_removed' then 'Accès retiré'
          when 'portal.invitation_revoked' then 'Invitation annulée' when 'tenant_proposal.created' then 'Locataire proposé' else a.action end,
        'canal', a.channel, 'sensible', a.is_sensitive_read) order by a.created_at desc)
      from (select * from public.audit_log a where a.created_at > now() - interval '90 days' and (
              (a.actor_id = auth.uid()) or (a.actor_id in (select user_id from public.owner_members where owner_id = v_o))
              or (a.entity_type = 'public.tenants' and a.entity_id in (select l.tenant_id from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where b.owner_id = v_o))
              or (a.entity_type = 'public.approvals' and a.entity_id in (select id from public.approvals where owner_id = v_o)))
            order by a.created_at desc limit 20) a), '[]'::jsonb),
    'decisions', coalesce((select jsonb_agg(jsonb_build_object('le', d.decided_at, 'resume', d.summary, 'revision', d.review_requested_at, 'issue', d.review_outcome) order by d.decided_at desc)
      from (select * from public.automated_decisions where subject_type = 'owner' and subject_id = v_o order by decided_at desc limit 10) d), '[]'::jsonb));
end $$;

-- ── Proposer un locataire (écran 05, CONCORDANCE 2.12) : le propriétaire propose, l'équipe valide; il voit le résultat et la raison,
--    jamais la synthèse de solvabilité. ──
create table if not exists public.tenant_proposals (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.owners(id) on delete cascade, unit_id uuid not null references public.units(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120), email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'), phone text, move_in date, note text check (char_length(note) <= 1000),
  status text not null default 'proposee' check (status in ('proposee', 'verification', 'acceptee', 'refusee', 'retiree')),
  decision_reason text, decided_by uuid references auth.users(id), decided_at timestamptz, screening_id uuid references crm.screenings(id) on delete set null,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(),
  check (status <> 'refusee' or char_length(btrim(coalesce(decision_reason, ''))) >= 10)
);
create index if not exists tenant_proposals_owner_idx on public.tenant_proposals (owner_id);
create index if not exists tenant_proposals_unit_idx on public.tenant_proposals (unit_id);
create index if not exists tenant_proposals_decided_by_idx on public.tenant_proposals (decided_by);
create index if not exists tenant_proposals_screening_idx on public.tenant_proposals (screening_id);
create index if not exists tenant_proposals_created_by_idx on public.tenant_proposals (created_by);
alter table public.tenant_proposals enable row level security;
drop policy if exists "propositions lues par le proprietaire et l'equipe" on public.tenant_proposals;
create policy "propositions lues par le proprietaire et l'equipe" on public.tenant_proposals for select to authenticated using (owner_id = public.auth_owner_id() or crm.can('clients.lire'));
revoke all on public.tenant_proposals from anon, authenticated; grant select on public.tenant_proposals to authenticated; grant all on public.tenant_proposals to service_role;

create or replace function public.portail_proposer_locataire(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id(); u record; v uuid; v_mail text := lower(btrim(coalesce(p ->> 'courriel', '')));
begin
  perform crm.exiger_niveau_portail(true); perform crm.proprio_peut_ecrire();
  select un.id, un.status, b.address || ' — logement ' || un.unit_number as lieu into u from public.units un join public.buildings b on b.id = un.building_id where un.id = (p ->> 'unit_id')::uuid and b.owner_id = v_o;
  if u.id is null then raise exception 'Logement introuvable.' using errcode = 'PT404'; end if;
  if u.status = 'occupied' then raise exception 'Ce logement est occupé : proposez un locataire pour un logement libre ou bientôt libre.' using errcode = 'PT409'; end if;
  if char_length(btrim(coalesce(p ->> 'nom', ''))) < 2 then raise exception 'Indiquez le nom du candidat.' using errcode = 'PT422'; end if;
  if v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Courriel du candidat requis : il recevra la demande de consentement à l’enquête (LOC-14).' using errcode = 'PT422'; end if;
  if not coalesce((p ->> 'consentement')::boolean, false) then raise exception 'Confirmez que le candidat accepte d’être contacté par Lease Lane.' using errcode = 'PT422'; end if;
  if exists (select 1 from public.tenant_proposals where unit_id = u.id and lower(email) = v_mail and status in ('proposee', 'verification')) then
    raise exception 'Ce candidat est déjà proposé pour ce logement.' using errcode = 'PT409'; end if;
  insert into public.tenant_proposals (owner_id, unit_id, full_name, email, phone, move_in, note, created_by)
  values (v_o, u.id, btrim(p ->> 'nom'), v_mail, nullif(btrim(p ->> 'telephone'), ''), (p ->> 'date')::date, nullif(btrim(p ->> 'note'), ''), auth.uid()) returning id into v;
  perform crm.creer_tache(jsonb_build_object('title', 'Locataire proposé par le propriétaire : ' || btrim(p ->> 'nom'), 'context', u.lieu || ' · vérifications et solvabilité, puis décision',
    'due_at', now() + interval '2 days', 'assignee_role', 'location', 'source', 'system', 'entity_type', 'public.tenant_proposals', 'entity_id', v, 'canal', 'portail'));
  perform crm.journal('tenant_proposal.created', 'public.tenant_proposals', v, null, p - 'telephone', 'propose-tenant', 'portail');
  return v;
end $$;

create or replace function public.portail_propositions() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id();
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return jsonb_build_object(
    'propositions', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'candidat', t.full_name, 'logement', b.address || ' — logement ' || u.unit_number, 'statut', t.status, 'raison', t.decision_reason,
        'recue', t.created_at, 'decidee', t.decided_at, 'date', t.move_in) order by t.created_at desc)
      from public.tenant_proposals t join public.units u on u.id = t.unit_id join public.buildings b on b.id = u.building_id where t.owner_id = v_o), '[]'::jsonb),
    'logements', coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'libelle', b.address || ' — logement ' || u.unit_number, 'statut', u.status, 'loyer', crm.loyer_logement(u.id)) order by b.address, u.unit_number)
      from public.units u join public.buildings b on b.id = u.building_id where b.owner_id = v_o and u.status <> 'occupied'), '[]'::jsonb));
end $$;

-- Équipe : passer en vérification, accepter ou refuser (raison obligatoire, visible par le propriétaire).
create or replace function public.lanceur_proposition_decider(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare t public.tenant_proposals; v_user uuid;
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas de décider.' using errcode = 'PT403'; end if;
  select * into t from public.tenant_proposals where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Proposition introuvable.' using errcode = 'PT404'; end if;
  if t.status not in ('proposee', 'verification') then raise exception 'Cette proposition est déjà décidée.' using errcode = 'PT409'; end if;
  if p ->> 'decision' not in ('verification', 'acceptee', 'refusee') then raise exception 'Décision inconnue.' using errcode = 'PT422'; end if;
  if p ->> 'decision' = 'refusee' and char_length(btrim(coalesce(p ->> 'raison', ''))) < 10 then raise exception 'Expliquez la raison du refus au propriétaire (10 caractères au moins).' using errcode = 'PT422'; end if;
  update public.tenant_proposals set status = p ->> 'decision', decision_reason = nullif(btrim(p ->> 'raison'), ''), screening_id = coalesce((p ->> 'screening_id')::uuid, screening_id),
    decided_by = case when p ->> 'decision' <> 'verification' then auth.uid() end, decided_at = case when p ->> 'decision' <> 'verification' then now() end where id = t.id;
  select user_id into v_user from public.owners where id = t.owner_id;
  perform crm.notifier(array[v_user] || array(select user_id from public.owner_members where owner_id = t.owner_id and active and role = 'coproprietaire'), 'info', 'users',
    t.full_name || case p ->> 'decision' when 'verification' then ' : vérifications en cours.' when 'acceptee' then ' : candidature validée par l’équipe.' else ' : candidature non retenue.' end,
    nullif(btrim(p ->> 'raison'), ''), null, '/proprietaire/locataires/proposer?p=' || t.id, 'public.tenant_proposals', t.id);
  perform crm.journal('tenant_proposal.decided', 'public.tenant_proposals', t.id, jsonb_build_object('status', t.status), jsonb_build_object('status', p ->> 'decision'), 'decide-tenant-proposal');
end $$;

-- ── Notifications : page complète (90 jours, 200 au plus) ──
create or replace function public.portail_notifications_toutes() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'genre', n.kind, 'icone', n.icon, 'titre', n.title, 'ligne', n.line1, 'lien', n.link, 'le', n.created_at, 'lue', n.read_at is not null) order by n.created_at desc)
    from (select * from crm.notifications where user_id = auth.uid() and created_at > now() - interval '90 days' order by created_at desc limit 200) n), '[]'::jsonb);
end $$;

-- ── Confidentialité (profil) : mes demandes Loi 25, décisions automatisées me concernant, révision humaine ──
create or replace function crm.sujet_portail() returns table (genre text, id uuid) language sql stable security definer set search_path = '' as $$
  select 'tenant', public.auth_tenant_id() where public.auth_tenant_id() is not null
  union all select 'owner', public.auth_owner_id() where crm.acces_proprio() = 'proprietaire'
$$;
create or replace function public.portail_confidentialite() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare s record;
begin
  select * into s from crm.sujet_portail() limit 1;
  if s.id is null then raise exception 'Réservé aux locataires et aux propriétaires titulaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(s.genre = 'owner');
  return jsonb_build_object(
    'demandes', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'type', r.request_type, 'recue', r.created_at, 'echeance', r.created_at + interval '30 days', 'statut', r.status, 'traitee', r.handled_at, 'note', r.resolution_note) order by r.created_at desc)
      from public.personal_data_requests r where r.subject_type = s.genre and r.subject_id = s.id), '[]'::jsonb),
    'decisions', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'le', d.decided_at, 'resume', d.summary, 'revision', d.review_requested_at, 'issue', d.review_outcome, 'reponse', d.review_response) order by d.decided_at desc)
      from (select * from public.automated_decisions where subject_type = s.genre and subject_id = s.id order by decided_at desc limit 20) d), '[]'::jsonb));
end $$;

create or replace function public.portail_demande_loi25(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare s record; v uuid; v_nom text; v_mail text;
begin
  select * into s from crm.sujet_portail() limit 1;
  if s.id is null then raise exception 'Réservé aux locataires et aux propriétaires titulaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(s.genre = 'owner');
  if p ->> 'type' not in ('access', 'rectification', 'deletion') then raise exception 'Type de demande inconnu.' using errcode = 'PT422'; end if;
  if s.genre = 'tenant' then select full_name, email into v_nom, v_mail from public.tenants where id = s.id;
  else select o.full_name, u.email into v_nom, v_mail from public.owners o join auth.users u on u.id = o.user_id where o.id = s.id; end if;
  if exists (select 1 from public.personal_data_requests where subject_type = s.genre and subject_id = s.id and request_type = p ->> 'type' and status in ('received', 'in_progress')) then
    raise exception 'Une demande de ce type est déjà en cours.' using errcode = 'PT409'; end if;
  insert into public.personal_data_requests (request_type, subject_type, subject_id, requester_name, requester_email, request_details)
  values (p ->> 'type', s.genre, s.id, v_nom, v_mail, left(nullif(btrim(p ->> 'details'), ''), 2000)) returning id into v;
  perform crm.creer_tache(jsonb_build_object('title', 'Demande Loi 25 d’un ' || case s.genre when 'tenant' then 'locataire' else 'propriétaire' end || ' (réponse sous 30 jours)', 'context', 'Loi 25 · ' || (p ->> 'type'),
    'due_at', now() + interval '25 days', 'assignee_role', 'admin', 'source', 'system', 'entity_type', 'public.personal_data_requests', 'entity_id', v, 'canal', 'portail'));
  perform crm.journal('privacy_request.created', 'public.personal_data_requests', v, null, jsonb_build_object('type', p ->> 'type'), 'create-privacy-request', 'portail');
  return v;
end $$;

-- Révision humaine d'une décision automatisée me concernant (Loi 25, art. 12.1).
create or replace function public.portail_reviser_decision(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare s record; d public.automated_decisions;
begin
  select * into s from crm.sujet_portail() limit 1;
  if s.id is null then raise exception 'Réservé aux locataires et aux propriétaires titulaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(s.genre = 'owner');
  select * into d from public.automated_decisions where id = (p ->> 'id')::uuid and subject_type = s.genre and subject_id = s.id for update;
  if not found then raise exception 'Décision introuvable.' using errcode = 'PT404'; end if;
  if d.review_requested_at is not null then raise exception 'Une révision est déjà demandée.' using errcode = 'PT409'; end if;
  update public.automated_decisions set review_requested_at = now(), review_note = left(nullif(btrim(p ->> 'note'), ''), 1000) where id = d.id;
  perform crm.creer_tache(jsonb_build_object('title', 'Révision humaine demandée (Loi 25, art. 12.1)', 'context', left(d.summary, 200), 'due_at', now() + interval '2 days', 'assignee_role', 'gestionnaire',
    'source', 'system', 'entity_type', 'public.automated_decisions', 'entity_id', d.id, 'canal', 'portail'));
  perform crm.journal('automated_decision.review_requested', 'public.automated_decisions', d.id, null, p, 'request-human-review', 'portail');
end $$;

-- ── Profil du propriétaire (CONCORDANCE 2.14) : informations, avis (familles du propriétaire) et LCAP ──
create or replace function public.portail_proprietaire_profil() returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare o public.owners; v_mail text; v_acces text := crm.acces_proprio(); m record;
begin
  perform crm.exiger_niveau_portail(true);
  select * into o from public.owners where id = public.auth_owner_id();
  if not found then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  select email into v_mail from auth.users where id = auth.uid();
  select full_name into m from public.owner_members where user_id = auth.uid() and owner_id = o.id and active;
  return jsonb_build_object('acces', v_acces, 'nom_complet', coalesce(m.full_name, o.full_name), 'entreprise', o.company_name, 'telephone', case when v_acces = 'proprietaire' then o.phone end, 'courriel', v_mail,
    'notifications', coalesce((select notifications from public.portal_preferences where user_id = auth.uid()), '{}'::jsonb),
    'lcap', (select jsonb_build_object('le', c.obtained_at) from comms.consents c where lower(c.address) = lower(v_mail) and c.purpose = 'commercial' and c.withdrawn_at is null order by c.obtained_at desc limit 1));
end $$;

create or replace function public.portail_proprietaire_profil_maj(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.owners; v_tel text := nullif(btrim(p ->> 'telephone'), '');
begin
  perform crm.exiger_niveau_portail(true); perform crm.proprio_peut_ecrire(true);
  select * into o from public.owners where id = public.auth_owner_id() for update;
  if char_length(btrim(coalesce(p ->> 'nom', ''))) < 2 then raise exception 'Indiquez votre nom.' using errcode = 'PT422'; end if;
  if v_tel is not null and regexp_replace(v_tel, '\D', '', 'g') !~ '^1?\d{10}$' then raise exception 'Numéro de téléphone invalide (10 chiffres).' using errcode = 'PT422'; end if;
  update public.owners set full_name = btrim(p ->> 'nom'), phone = v_tel, company_name = nullif(btrim(p ->> 'entreprise'), '') where id = o.id;
  perform crm.journal('owner.profile_updated', 'public.owners', o.id, jsonb_build_object('nom', o.full_name, 'telephone', o.phone, 'entreprise', o.company_name), p, 'update-profile', 'portail');
  return public.portail_proprietaire_profil();
end $$;

create or replace function public.portail_proprietaire_preferences(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_mail text; v_prefs jsonb; v_lcap boolean := (p ->> 'lcap')::boolean;
begin
  perform crm.exiger_niveau_portail(true);
  if public.auth_owner_id() is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  select email into v_mail from auth.users where id = auth.uid();
  if p ? 'avis' then
    select coalesce(jsonb_object_agg(k, jsonb_build_object('courriel', coalesce((v ->> 'courriel')::boolean, true), 'sms', coalesce((v ->> 'sms')::boolean, false))), '{}'::jsonb) into v_prefs
      from jsonb_each(p -> 'avis') e(k, v) where k in ('accords', 'finances', 'travaux', 'locataires', 'mandat');   -- urgences : toujours
    insert into public.portal_preferences (user_id, notifications) values (auth.uid(), v_prefs) on conflict (user_id) do update set notifications = excluded.notifications, updated_at = now();
    perform crm.journal('portal.notification_preferences', 'public.owners', public.auth_owner_id(), null, v_prefs, 'update-preferences', 'portail');
  end if;
  if v_lcap is not null then
    if v_lcap and not exists (select 1 from comms.consents where lower(address) = lower(v_mail) and purpose = 'commercial' and withdrawn_at is null) then
      insert into comms.consents (channel, address, purpose, basis, source, proof) values ('email', lower(v_mail), 'commercial', 'express', 'portail_proprietaire',
        jsonb_build_object('texte', 'J’accepte de recevoir les communications de Lease Lane (infolettre, offres). Je peux me désabonner en tout temps.', 'le', now()));
    elsif not v_lcap then update comms.consents set withdrawn_at = now() where lower(address) = lower(v_mail) and purpose = 'commercial' and withdrawn_at is null; end if;
    perform crm.journal(case when v_lcap then 'consent.given' else 'consent.withdrawn' end, 'public.owners', public.auth_owner_id(), null, jsonb_build_object('lcap', v_lcap), 'update-consent', 'portail');
  end if;
  return public.portail_proprietaire_profil();
end $$;

-- ── Écritures du propriétaire : refusées à la comptabilité (lecture seulement) ──
create or replace function public.portail_decider_depense(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.approvals;
begin
  perform crm.proprio_peut_ecrire();   -- comptable : lecture seulement
  perform crm.exiger_niveau_portail(true);
  select * into a from public.approvals where id = (p ->> 'id')::uuid and owner_id = public.auth_owner_id() for update;
  if not found then raise exception 'Demande d’accord introuvable.' using errcode = 'PT404'; end if;
  if a.status <> 'pending' then raise exception 'Vous avez déjà répondu à cette demande.' using errcode = 'PT409'; end if;
  if p ->> 'decision' = 'refuse' and char_length(btrim(coalesce(p ->> 'motif', ''))) < 5 then raise exception 'Indiquez le motif du refus : l’équipe vous proposera une autre solution.' using errcode = 'PT422'; end if;
  update public.approvals set status = case when p ->> 'decision' = 'approuve' then 'approved' else 'rejected' end, decided_at = now(),
    rejection_note = case when p ->> 'decision' = 'refuse' then btrim(p ->> 'motif') end, owner_note = nullif(btrim(p ->> 'note'), '') where id = a.id;
  perform crm.journal('approval.decided_by_owner', 'public.approvals', a.id, jsonb_build_object('status', 'pending'), p, 'decide-expense', 'portail');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.portail_demander_revision(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare sr public.service_requests;
begin
  perform crm.proprio_peut_ecrire();   -- comptable : lecture seulement
  perform crm.exiger_niveau_portail(true);
  select s.* into sr from public.service_requests s join public.units u on u.id = s.unit_id join public.buildings b on b.id = u.building_id where s.id = (p ->> 'id')::uuid and b.owner_id = public.auth_owner_id();
  if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
  perform crm.creer_tache(jsonb_build_object('title', 'Révision humaine demandée par le propriétaire · DEM-' || to_char(sr.created_at, 'YYYY') || '-' || upper(left(sr.id::text, 4)),
    'context', left('Loi 25, art. 12.1 · ' || coalesce(nullif(btrim(p ->> 'note'), ''), 'sans précision'), 200), 'due_at', now() + interval '1 day', 'assignee_role', 'gestionnaire',
    'source', 'system', 'entity_type', 'public.service_requests', 'entity_id', sr.id, 'canal', 'portail'));
  perform crm.journal('automated_decision.review_requested', 'public.service_requests', sr.id, null, p, 'request-human-review', 'portail');
end $$;

create or replace function public.portail_ecrire(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id(); o public.owners; c crm.conversations; v_texte text := btrim(p ->> 'texte'); v_sr uuid;
begin
  perform crm.proprio_peut_ecrire();   -- comptable : lecture seulement
  perform crm.exiger_niveau_portail(true);
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  if coalesce(v_texte, '') = '' or char_length(v_texte) > 5000 then raise exception 'Écrivez votre message (5 000 caractères au plus).' using errcode = 'PT422'; end if;
  if exists (select 1 from jsonb_array_elements(coalesce(p -> 'pieces', '[]')) x where x ->> 'chemin' not like 'proprietaires/' || v_o || '/%') then raise exception 'Pièce hors de votre dossier.' using errcode = 'PT403'; end if;
  select * into o from public.owners where id = v_o;
  if p ? 'conversation_id' then
    select * into c from crm.conversations where id = (p ->> 'conversation_id')::uuid and owner_id = v_o for update;
    if not found then raise exception 'Message introuvable.' using errcode = 'PT404'; end if;
  else
    if p ? 'service_request_id' then
      select s.id into v_sr from public.service_requests s join public.units u on u.id = s.unit_id join public.buildings b on b.id = u.building_id where s.id = (p ->> 'service_request_id')::uuid and b.owner_id = v_o;
    end if;
    insert into crm.conversations (channel, display_name, email, subject, owner_id, service_request_id, last_message_at, last_preview)
    values ('portail', o.full_name || ' (propriétaire)', (select email from auth.users where id = o.user_id), coalesce(nullif(btrim(p ->> 'sujet'), ''), 'Message du portail'), v_o, v_sr, now(), left(v_texte, 140))
    returning * into c;
  end if;
  insert into crm.conversation_messages (conversation_id, direction, channel, author, body, attachments) values (c.id, 'in', 'portail', 'contact', v_texte, coalesce(p -> 'pieces', '[]'));
  update crm.conversations set last_message_at = now(), last_preview = left(v_texte, 140), status = 'open', unread = true, owner_archived = false, updated_at = now() where id = c.id;
  perform crm.journal('conversation.owner_wrote', 'crm.conversations', c.id, null, jsonb_build_object('pieces', jsonb_array_length(coalesce(p -> 'pieces', '[]'))), 'send-portal-message', 'portail');
  return c.id;
end $$;

create or replace function public.portail_archiver_message(p_id uuid, p_archive boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.proprio_peut_ecrire();   -- comptable : lecture seulement
  perform crm.exiger_niveau_portail(true);
  update crm.conversations set owner_archived = p_archive where id = p_id and owner_id = public.auth_owner_id();
end $$;

create or replace function public.portail_soumettre_immeuble(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v uuid; v_o uuid := public.auth_owner_id();
begin
  perform crm.proprio_peut_ecrire();   -- comptable : lecture seulement
  perform crm.exiger_niveau_portail(true);
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(p ->> 'adresse', ''))) < 5 then raise exception 'Adresse de l’immeuble requise.' using errcode = 'PT422'; end if;
  if exists (select 1 from jsonb_array_elements_text(coalesce(p -> 'photos', '[]')) ph where ph not like 'proprietaires/' || v_o || '/%') then
    raise exception 'Photo hors de votre dossier.' using errcode = 'PT403';
  end if;
  insert into public.building_submissions (owner_id, address, zone, kind, units, floors, year_built, expected_rent, heating, parking, notes, photos, rules, created_by)
  values (v_o, btrim(p ->> 'adresse'), nullif(p ->> 'secteur', ''), nullif(p ->> 'type', ''), (p ->> 'logements')::int, (p ->> 'etages')::int, (p ->> 'annee')::int,
          (p ->> 'loyers')::numeric, nullif(p ->> 'chauffage', ''), nullif(p ->> 'stationnement', ''), nullif(btrim(p ->> 'notes'), ''),
          coalesce(array(select jsonb_array_elements_text(p -> 'photos')), '{}'), coalesce(p -> 'regles', '{}'), auth.uid())
  returning id into v;
  perform crm.creer_tache(jsonb_build_object('title', 'Valider l’immeuble soumis : ' || btrim(p ->> 'adresse'), 'context', 'Immeubles · soumis par un propriétaire',
    'due_at', now() + interval '2 days', 'assignee_role', 'location', 'source', 'system', 'entity_type', 'public.building_submissions', 'entity_id', v, 'canal', 'portail'));
  perform crm.journal('building.submitted', 'public.building_submissions', v, null, p - 'notes', 'submit-building', 'portail');
  return v;
end $$;

create or replace function public.portail_ajouter_document(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v uuid; v_o uuid := public.auth_owner_id(); v_lease uuid; v_b uuid;
begin
  perform crm.proprio_peut_ecrire();   -- comptable : lecture seulement
  perform crm.exiger_niveau_portail(true);
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  if (p ->> 'chemin') not like 'proprietaires/' || v_o || '/%' then raise exception 'Fichier hors de votre dossier.' using errcode = 'PT403'; end if;
  if p ? 'tenant_id' then
    select le.id, u.building_id into v_lease, v_b from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id
     where le.tenant_id = (p ->> 'tenant_id')::uuid and b.owner_id = v_o order by le.status = 'active' desc, le.start_date desc limit 1;
    if v_lease is null then raise exception 'Locataire introuvable.' using errcode = 'PT404'; end if;
  elsif p ? 'building_id' then
    select id into v_b from public.buildings where id = (p ->> 'building_id')::uuid and owner_id = v_o;
    if v_b is null then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
  end if;
  insert into public.documents (owner_id, building_id, lease_id, tenant_id, title, category, visibility, storage_bucket, storage_path, size_bytes, added_by)
  values (v_o, v_b, v_lease, (p ->> 'tenant_id')::uuid, left(btrim(p ->> 'titre'), 200), nullif(p ->> 'categorie', ''), coalesce(p ->> 'partage', 'proprietaire_equipe'), 'portail', p ->> 'chemin', (p ->> 'taille')::bigint, auth.uid())
  returning id into v;
  perform crm.journal('document.added_by_owner', 'public.documents', v, null, p, 'add-document', 'portail');
  return v;
end $$;

-- ── Droits ──
revoke all on function crm.acces_proprio(), crm.proprio_peut_ecrire(boolean), crm.code_invitation(), crm.envoyer_invitation(public.portal_invitations, text, text), crm.sujet_portail() from public, anon, authenticated;
revoke all on function public.service_invitation(text, text), public.service_invitation_utiliser(jsonb) from public, anon, authenticated;
grant execute on function public.service_invitation(text, text), public.service_invitation_utiliser(jsonb) to service_role;
revoke all on function public.lanceur_inviter_portail(jsonb), public.lanceur_proposition_decider(jsonb), public.portail_moi(), public.portail_inviter(jsonb), public.portail_annuler_invitation(uuid),
  public.portail_retirer_acces(uuid), public.portail_acces(), public.portail_proposer_locataire(jsonb), public.portail_propositions(), public.portail_notifications_toutes(), public.portail_confidentialite(),
  public.portail_demande_loi25(jsonb), public.portail_reviser_decision(jsonb), public.portail_proprietaire_profil(), public.portail_proprietaire_profil_maj(jsonb), public.portail_proprietaire_preferences(jsonb),
  public.portail_decider_depense(jsonb), public.portail_demander_revision(jsonb), public.portail_ecrire(jsonb), public.portail_archiver_message(uuid, boolean), public.portail_soumettre_immeuble(jsonb),
  public.portail_ajouter_document(jsonb) from public, anon;
grant execute on function public.lanceur_inviter_portail(jsonb), public.lanceur_proposition_decider(jsonb), public.portail_moi(), public.portail_inviter(jsonb), public.portail_annuler_invitation(uuid),
  public.portail_retirer_acces(uuid), public.portail_acces(), public.portail_proposer_locataire(jsonb), public.portail_propositions(), public.portail_notifications_toutes(), public.portail_confidentialite(),
  public.portail_demande_loi25(jsonb), public.portail_reviser_decision(jsonb), public.portail_proprietaire_profil(), public.portail_proprietaire_profil_maj(jsonb), public.portail_proprietaire_preferences(jsonb),
  public.portail_decider_depense(jsonb), public.portail_demander_revision(jsonb), public.portail_ecrire(jsonb), public.portail_archiver_message(uuid, boolean), public.portail_soumettre_immeuble(jsonb),
  public.portail_ajouter_document(jsonb) to authenticated;
