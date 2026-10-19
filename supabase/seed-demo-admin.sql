-- Compte de démonstration « Admin » (préproduction seulement, univers fictif des maquettes).
-- Les 5 autres rôles d'équipe sont créés par seed-univers-maquettes.sql. Mot de passe = variable psql mdp_roles
-- (secret STAGING_ROLES_PASSWORD), jamais écrit ici. Le deuxième facteur est inscrit ensuite par lanceur/scripts/demo-inscrire-admin.mjs.
-- Rejouable. Usage : workflow « SQL en préproduction », fichier supabase/seed-demo-admin.sql.
\set ON_ERROR_STOP on
select set_config('seed.mdp_roles', :'mdp_roles', false);

do $$
declare
  v_mdp text := current_setting('seed.mdp_roles');
  v_uid uuid;
begin
  if length(v_mdp) < 12 then raise exception 'mdp_roles manquant ou trop court.'; end if;
  select id into v_uid from auth.users where email = 'equipe-admin@leaselane.test';
  if v_uid is null then
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
                            raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'equipe-admin@leaselane.test',
            crypt(v_mdp, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Admin Démo"}'::jsonb, '', '', '', '')
    returning id into v_uid;
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid, v_uid::text, jsonb_build_object('sub', v_uid::text, 'email', 'equipe-admin@leaselane.test'), 'email', now(), now(), now());
  end if;
  update public.users set role = 'admin', is_admin = true where id = v_uid;
  if not exists (select 1 from crm.team_members where user_id = v_uid) then
    insert into crm.team_members (user_id, display_name, initials, role) values (v_uid, 'Admin Démo', 'AD', 'admin');
  end if;
  raise notice 'Compte equipe-admin@leaselane.test prêt (%).', v_uid;
end $$;
