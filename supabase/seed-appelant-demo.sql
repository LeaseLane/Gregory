-- Préproduction seulement : compte fictif d'un prospecteur téléphonique HORS équipe (appelant-demo@leaselane.test), pour
-- Ventes › Mes prospects (Grégory, 2026-11-04). Il reprend la fiche « Appelant Démo (fictif) » et ses prospects.
-- Mot de passe : variable psql mdp_roles (secret STAGING_ROLES_PASSWORD), jamais écrit ici. Rejouable.
-- Le deuxième facteur s'inscrit ensuite par lanceur/scripts/demo-inscrire-appelant.mjs.
\set ON_ERROR_STOP on
select set_config('seed.mdp_roles', :'mdp_roles', false);
do $$
declare v_mdp text := current_setting('seed.mdp_roles'); v_id uuid; v_courriel text := 'appelant-demo@leaselane.test';
begin
  if length(v_mdp) < 12 then raise exception 'mdp_roles manquant ou trop court.'; end if;
  select id into v_id from auth.users where email = v_courriel;
  if v_id is null then
    v_id := '00000000-0000-4000-a000-0000000a9901';
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                            created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_courriel, extensions.crypt(v_mdp, extensions.gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}', '{"full_name":"Appelant Démo (fictif)"}', now(), now(), '', '', '', '');
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', v_courriel, 'email_verified', true), 'email', now(), now(), now());
  else
    update auth.users set encrypted_password = extensions.crypt(v_mdp, extensions.gen_salt('bf')), updated_at = now() where id = v_id;
  end if;
  -- Jamais membre de l'équipe : c'est ce qui le limite à ses prospects (la base refuse le reste de l'admin).
  delete from crm.team_members where user_id = v_id;
  update public.cold_callers set user_id = v_id, email = v_courriel where full_name = 'Appelant Démo (fictif)';
  if not found then
    insert into public.cold_callers (user_id, full_name, email, active) values (v_id, 'Appelant Démo (fictif)', v_courriel, true);
  end if;
  raise notice 'Prospecteur fictif prêt (hors équipe).';
end $$;
select c.full_name, u.email, exists (select 1 from crm.team_members t where t.user_id = u.id) as dans_equipe,
       (select count(*) from public.prospects p where p.assigned_caller_id = c.id or p.created_by_caller_id = c.id) as prospects
from public.cold_callers c join auth.users u on u.id = c.user_id where c.full_name = 'Appelant Démo (fictif)';
