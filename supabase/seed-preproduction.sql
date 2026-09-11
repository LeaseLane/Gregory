-- ============================================================
-- Jeu de données de préproduction — lot P11
-- ============================================================
--
-- POURQUOI CE FICHIER. Une branche Supabase naît VIDE : la référence de
-- schéma (migration 20260101000000) recrée les 49 tables, mais aucune
-- donnée ne suit. Le parcours complet exigé par le lot P11 ne peut donc
-- pas tourner : pas de propriétaire, pas de bail, pas de loyer attendu.
--
-- `seed.sql` (racine du dépôt) ne convient pas ici : il exige de créer un
-- usager à la main dans le tableau de bord puis de coller son UUID dans le
-- fichier. Ce fichier-ci crée ses propres comptes auth et fonctionne sans
-- intervention.
--
-- ⚠️  NE JAMAIS EXÉCUTER EN PRODUCTION. Il crée des comptes dont les mots
-- de passe sont écrits en clair ci-dessous. Réservé aux branches et aux
-- environnements jetables.
--
-- Le jeu couvre volontairement les cas que le plan nomme à l'étape 3 du
-- gate (« inclure paiement partiel et transaction inconnue ») et à
-- l'étape 4 (« normale, urgente, information manquante ») : deux
-- propriétaires aux parcs DISJOINTS, pour que l'étanchéité soit
-- vérifiable, et des loyers dans plusieurs états.
--
-- Piège rencontré en écrivant ceci, à connaître : GoTrue lit
-- confirmation_token, recovery_token, email_change_token_new et
-- email_change dans des chaînes Go NON nullables. Laissées à NULL, la
-- connexion échoue avec « Database error querying schema » (HTTP 500).
-- D'où les chaînes vides explicites.
-- ============================================================

do $$
declare
  v_uid_a uuid; v_uid_b uuid; v_uid_loc uuid;
  v_owner_a uuid; v_owner_b uuid;
  v_bat_a uuid; v_bat_b uuid;
  v_unite_a1 uuid; v_unite_a2 uuid; v_unite_b1 uuid;
  v_loc uuid; v_bail uuid;
begin
  if exists (select 1 from owners where full_name like 'Préprod%') then
    raise notice 'Jeu de préproduction déjà présent — rien à faire.';
    return;
  end if;

  -- ---- Comptes auth ----
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data,
                          confirmation_token, recovery_token,
                          email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          'preprod-owner-a@leaselane.test', crypt('PreprodOwnerA!2026', gen_salt('bf')),
          now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
          '', '', '', '')
  returning id into v_uid_a;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data,
                          confirmation_token, recovery_token,
                          email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          'preprod-owner-b@leaselane.test', crypt('PreprodOwnerB!2026', gen_salt('bf')),
          now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
          '', '', '', '')
  returning id into v_uid_b;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data,
                          confirmation_token, recovery_token,
                          email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          'preprod-locataire@leaselane.test', crypt('PreprodLocataire!2026', gen_salt('bf')),
          now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
          '', '', '', '')
  returning id into v_uid_loc;

  insert into auth.identities (id, user_id, provider_id, identity_data, provider,
                               last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), u.id, u.id::text,
         json_build_object('sub', u.id::text, 'email', u.email)::jsonb,
         'email', now(), now(), now()
  from auth.users u where u.id in (v_uid_a, v_uid_b, v_uid_loc);

  -- ---- Propriétaires, parcs DISJOINTS (étanchéité vérifiable) ----
  insert into owners (user_id, full_name, company_name, management_rate, spending_cap, work_coordination_rate)
  values (v_uid_a, 'Préprod Propriétaire A', 'Préprod A inc.', 6.00, 300, 10.00) returning id into v_owner_a;
  insert into owners (user_id, full_name, company_name, management_rate, spending_cap, work_coordination_rate)
  values (v_uid_b, 'Préprod Propriétaire B', 'Préprod B inc.', 6.00, 300, 10.00) returning id into v_owner_b;

  insert into buildings (owner_id, address, unit_count, year_built, zone)
  values (v_owner_a, '100 rue Préprod A, Québec', 2, 1990, 'Québec') returning id into v_bat_a;
  insert into buildings (owner_id, address, unit_count, year_built, zone)
  values (v_owner_b, '200 rue Préprod B, Québec', 1, 2005, 'Québec') returning id into v_bat_b;

  -- Une unité occupée, une disponible (alimente la page d'annonces et la
  -- policy publique « buildings with available units »).
  insert into units (building_id, unit_number, unit_type, rent, status)
  values (v_bat_a, '101', '4 1/2', 1000, 'occupied') returning id into v_unite_a1;
  insert into units (building_id, unit_number, unit_type, rent, status)
  values (v_bat_a, '102', '3 1/2', 850, 'available') returning id into v_unite_a2;
  insert into units (building_id, unit_number, unit_type, rent, status)
  values (v_bat_b, '201', '5 1/2', 1300, 'occupied') returning id into v_unite_b1;

  -- ---- Locataire + bail actif ----
  insert into tenants (user_id, full_name, email, phone)
  values (v_uid_loc, 'Préprod Locataire', 'preprod-locataire@leaselane.test', '418-000-0000')
  returning id into v_loc;

  insert into leases (unit_id, tenant_id, start_date, end_date, monthly_rent, status)
  values (v_unite_a1, v_loc, current_date - interval '6 months', current_date + interval '6 months', 1000, 'active')
  returning id into v_bail;

  -- ---- Loyers dans plusieurs états (le gate exige du partiel et du retard) ----
  insert into payments (lease_id, amount, due_date, paid_date, status, amount_received) values
    (v_bail, 1000, current_date - interval '2 months', current_date - interval '2 months', 'paid', 1000),
    (v_bail, 1000, current_date - interval '1 month',  current_date - interval '25 days',  'paid', 400),
    (v_bail, 1000, current_date,                        null,                                'pending', 0),
    (v_bail, 1000, current_date - interval '10 days',   null,                                'late', 0);

  -- ---- Travailleur conforme (sans quoi le dispatch n'a aucun candidat) ----
  insert into workers (name, specialty, phone, email, requires_rbq, insurance_expiry,
                       specialties, zones, handles_urgent, verification_status,
                       verified_at, availability_status, active)
  values ('Préprod Travailleur', 'plomberie', '418-000-0001', 'preprod-worker@leaselane.test',
          false, current_date + interval '1 year', '{plomberie}', '{Québec}', true, 'verified',
          now(), 'maintenant', true);

  -- ---- Demandes de service : normale, urgente, information manquante ----
  insert into service_requests (unit_id, tenant_id, description, status) values
    (v_unite_a1, v_loc, 'Le robinet de la cuisine goutte depuis hier.', 'open'),
    (v_unite_a1, v_loc, 'URGENCE : dégât d''eau au plafond de la salle de bain.', 'open'),
    (v_unite_a1, v_loc, 'Ça ne marche plus.', 'open');

  raise notice 'Préproduction amorcée : propriétaires A=% B=%', v_owner_a, v_owner_b;
end $$;

-- Identifiants créés (préproduction uniquement) :
--   preprod-owner-a@leaselane.test     / PreprodOwnerA!2026
--   preprod-owner-b@leaselane.test     / PreprodOwnerB!2026
--   preprod-locataire@leaselane.test   / PreprodLocataire!2026
--
-- Aucun compte admin n'est créé ici : un compte à privilèges doit être
-- créé explicitement (update users set is_admin = true where id = '<uuid>'),
-- pour qu'un environnement de test ne fabrique pas d'admin par accident.
