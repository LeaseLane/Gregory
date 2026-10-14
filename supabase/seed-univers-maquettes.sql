-- ============================================================
-- Univers fictif des maquettes (Phase 2, T0 « seed fictif commun ») — PRÉPRODUCTION / DÉMO SEULEMENT
-- ============================================================
-- Source : les données des maquettes de la designer (lease-lane-site/public/espace-proprietaire/data.js,
-- penpot-sources/penpot/blk.js) : Marie-Josée Bérubé, 5 immeubles et 34 portes à Québec, ses locataires,
-- ses demandes (DEM-2026-0148 à 0154) et ses fournisseurs. Tout est fictif.
--
-- Comptes de rôle Lanceur (un par rôle d'équipe) : mot de passe passé par la variable psql mdp_roles
-- (secret GitHub STAGING_ROLES_PASSWORD), jamais écrit ici.
--
-- Garde-fous : refuse une base qui contient de vrais propriétaires; idempotent (ne refait rien s'il est déjà là).
-- Les déclencheurs qui appellent des fonctions edge (annonce par IA, analyse de demande) sont coupés le temps
-- de l'insertion : ils pointent l'adresse de production (ARCHITECTURE.md § 8).
-- Usage : psql "$URL" -v mdp_roles="…" -f supabase/seed-univers-maquettes.sql
-- ============================================================

select set_config('seed.mdp_roles', :'mdp_roles', false);

do $$
begin
  if exists (select 1 from public.owners where full_name not like 'Préprod%' and full_name <> 'Marie-Josée Bérubé') then
    raise exception 'Base avec de vrais propriétaires : univers fictif refusé (préproduction ou démo seulement).';
  end if;
  if length(current_setting('seed.mdp_roles', true)) < 12 then
    raise exception 'mdp_roles manquant ou trop court.';
  end if;
end $$;

alter table public.units disable trigger on_unit_listing_change;
alter table public.service_requests disable trigger on_service_request_insert;

do $$
declare
  v_mdp text := current_setting('seed.mdp_roles');
  v_uid uuid; v_owner uuid; v_bat uuid; v_unite uuid; v_loc uuid; v_bail uuid;
  r record; l record; u record; k int;
begin
  if exists (select 1 from public.owners where full_name = 'Marie-Josée Bérubé') then
    raise notice 'Univers des maquettes déjà présent — rien à faire.';
    return;
  end if;

  -- ── Comptes auth : la propriétaire et un compte par rôle d'équipe ──
  for u in select * from (values
    ('mj.berube@leaselane.test', null::text, 'Marie-Josée Bérubé', 'MB'),
    ('equipe-gestionnaire@leaselane.test', 'gestionnaire', 'Julie Normandeau', 'JN'),
    ('equipe-location@leaselane.test', 'location', 'Camille Desrosiers', 'CD'),
    ('equipe-prospection@leaselane.test', 'prospection', 'Laurence Pelletier', 'LP'),
    ('equipe-comptabilite@leaselane.test', 'comptabilite', 'Marc Thibault', 'MT'),
    ('equipe-lecture@leaselane.test', 'lecture', 'Consultation', 'CO')
  ) as t(courriel, role, nom, initiales)
  loop
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
                            raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', u.courriel,
            crypt(v_mdp, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('full_name', u.nom), '', '', '', '')
    returning id into v_uid;
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid, v_uid::text, jsonb_build_object('sub', v_uid::text, 'email', u.courriel), 'email', now(), now(), now());
    if u.role is null then
      insert into public.owners (user_id, full_name, management_rate, spending_cap, work_coordination_rate)
      values (v_uid, u.nom, 6.00, 500, 10.00) returning id into v_owner;
    else
      update public.users set role = 'admin', is_admin = false where id = v_uid;
      insert into crm.team_members (user_id, display_name, initials, role) values (v_uid, u.nom, u.initiales, u.role);
    end if;
  end loop;

  -- ── Fournisseurs ──
  insert into public.workers (name, specialty, phone, email, requires_rbq, insurance_expiry, specialties, zones, handles_urgent,
                              verification_status, verified_at, availability_status, active)
  select n, s, t, c, false, current_date + 365, array[s], '{Québec}', urg, 'verified', now(), 'maintenant', true
  from (values ('Plomberie Capitale', 'plomberie', '418 555-0610', 'contact@plomberie-capitale.test', true),
               ('Électrique Duval', 'électricité', '418 555-0620', 'contact@electrique-duval.test', true),
               ('Menuiserie Lauzon', 'menuiserie', '418 555-0630', 'contact@menuiserie-lauzon.test', false),
               ('Toitures Beauport', 'toiture', '418 555-0640', 'contact@toitures-beauport.test', false)) as w(n, s, t, c, urg);

  -- ── Immeubles et logements (data.js) ── loyer en dollars; « locataire » null = vacant
  for r in select * from (values
    (1, '1180, avenue Cartier, Québec', 'Montcalm', 8, 1962),
    (2, '640, 3e Avenue, Québec', 'Limoilou', 12, 1978),
    (3, '420, rue Saint-Joseph Est, Québec', 'Saint-Roch', 6, 1995),
    (4, '2880, chemin Sainte-Foy, Québec', 'Sainte-Foy', 5, 2004),
    (5, '41, rue des Roseaux, Québec', 'Beauport', 3, 2015)
  ) as b(n, adresse, secteur, portes, annee)
  loop
    insert into public.buildings (owner_id, address, unit_count, year_built, zone)
    values (v_owner, r.adresse, r.portes, r.annee, r.secteur) returning id into v_bat;

    for l in select * from (values
      (1, '1', '4 1/2', 1380, 'Julie Lévesque', 'ok'), (1, '2', '4 1/2', 1450, 'Samuel Fortin', 'ok'), (1, '3', '3 1/2', 1195, 'Mathieu Roy', 'ok'),
      (1, '4', '4 1/2', 1420, 'Annie Pelletier', 'ok'), (1, '5', '5 1/2', 1780, 'Famille Nguyen', 'ok'), (1, '6', '3 1/2', 1210, 'Chantal Martel', 'ok'),
      (1, '7', '4 1/2', 1405, 'Denis Lachance', 'ok'), (1, '8', '4 1/2', 1400, 'Pierre Simard', 'ok'),
      (2, '1', '3 1/2', 1195, 'Nathalie Tremblay', 'ok'), (2, '2', '3 1/2', 1195, 'Kevin Ouellet', 'ok'), (2, '3', '4 1/2', 1320, 'Nadia Tremblay', 'ok'),
      (2, '4', '4 1/2', 1320, null, 'vacant'), (2, '5', '3 1/2', 1180, 'Raphaël Côté', 'ok'), (2, '6', '3 1/2', 1190, 'France Blais', 'ok'),
      (2, '7', '3 1/2', 1195, 'Gabriel Paquet', 'retard'), (2, '8', '3 1/2', 1180, 'Isabelle Poulin', 'ok'), (2, '9', '4 1/2', 1310, 'Marc-André Lavoie', 'ok'),
      (2, '10', '3 1/2', 1185, 'Sarah Dion', 'ok'), (2, '11', '4 1/2', 1325, 'Étienne Gauthier', 'ok'), (2, '12', '3 1/2', 1190, 'Lucie Fortier', 'ok'),
      (3, '1', '4 1/2', 1320, 'Olivia Gagnon', 'ok'), (3, '2', '4 1/2', 1320, 'Thomas Morin', 'ok'), (3, '3', '3 1/2', 1250, 'Valérie Dubé', 'ok'),
      (3, '4', '3 1/2', 1250, 'Émile Girard', 'ok'), (3, '5', '4 1/2', 1385, 'Olivier Gagnon', 'ok'), (3, '6', '4 1/2', 1385, 'Hélène Bergeron', 'ok'),
      (4, '1', '5 1/2', 1780, 'Léa Bouchard', 'ok'), (4, '2', '4 1/2', 1420, 'Benoît Caron', 'ok'), (4, '3', '3 1/2', 1100, null, 'vacant'),
      (4, '4', '3 1/2', 1100, 'Sophie Ménard', 'retard'), (4, '5', '3 1/2', 1100, 'Yannick Fillion', 'ok'),
      (5, '1', 'Maison', 2050, 'Famille Roy', 'ok'), (5, '2', '4 1/2', 475, 'Gérard Roy', 'ok'), (5, '3', '3 1/2', 475, 'Monique Roy', 'ok')
    ) as x(bat, numero, type, loyer, locataire, etat)
    where x.bat = r.n
    loop
      insert into public.units (building_id, unit_number, unit_type, rent, status)
      values (v_bat, l.numero, l.type, l.loyer, case when l.locataire is null then 'available' else 'occupied' end)
      returning id into v_unite;
      continue when l.locataire is null;

      insert into public.tenants (full_name, email, phone)
      values (l.locataire, lower(translate(replace(l.locataire, ' ', '.'), 'éèêëàâîïôöûüçÉÈ', 'eeeeaaiioouuceE')) || '@courriel.test', '418 555-' || lpad((1000 + r.n * 100 + l.numero::int)::text, 4, '0'))
      returning id into v_loc;
      insert into public.leases (unit_id, tenant_id, start_date, end_date, monthly_rent, status)
      values (v_unite, v_loc, date '2026-07-01', date '2027-06-30', l.loyer, 'active') returning id into v_bail;

      -- Loyers : juillet à septembre payés; octobre payé, sauf les deux retards (12 jours au 13 octobre).
      for k in 0..3 loop
        insert into public.payments (lease_id, amount, due_date, paid_date, status, amount_received)
        values (v_bail, l.loyer, (date '2026-07-01' + make_interval(months => k))::date,
                case when k = 3 and l.etat = 'retard' then null else (date '2026-07-01' + make_interval(months => k))::date end,
                case when k = 3 and l.etat = 'retard' then 'late' else 'paid' end,
                case when k = 3 and l.etat = 'retard' then 0 else l.loyer end);
      end loop;
    end loop;
  end loop;

  -- ── Demandes des maquettes (data.js) ──
  insert into public.service_requests (unit_id, tenant_id, description, status)
  select un.id, le.tenant_id, d.texte, d.statut
  from (values
    ('1180, avenue Cartier, Québec', '2', 'Fuite lente sous l''évier de la cuisine, l''armoire est humide. (DEM-2026-0148)', 'closed'),
    ('640, 3e Avenue, Québec', '3', 'Plus d''eau chaude depuis ce matin. Le réservoir fait un bruit métallique. (DEM-2026-0151)', 'open'),
    ('420, rue Saint-Joseph Est, Québec', '5', 'URGENCE : le détecteur de fumée sonne en continu sans fumée, impossible de l''arrêter. (DEM-2026-0152)', 'open'),
    ('2880, chemin Sainte-Foy, Québec', '1', 'Robinet de baignoire : goutte à goutte constant, même bien fermé. (DEM-2026-0154)', 'open')
  ) as d(adresse, numero, texte, statut)
  join public.buildings bt on bt.address = d.adresse and bt.owner_id = v_owner
  join public.units un on un.building_id = bt.id and un.unit_number = d.numero
  join public.leases le on le.unit_id = un.id and le.status = 'active';

  raise notice 'Univers des maquettes créé : Marie-Josée Bérubé, 5 immeubles, 34 portes, comptes de rôle.';
end $$;

alter table public.units enable trigger on_unit_listing_change;
alter table public.service_requests enable trigger on_service_request_insert;
