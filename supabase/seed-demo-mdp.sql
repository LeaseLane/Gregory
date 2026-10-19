-- Préproduction seulement : applique le mot de passe des comptes de démonstration (variable psql mdp_roles,
-- secret STAGING_ROLES_PASSWORD) aux 8 comptes de demo.leaselane.ca. Rejouable, jamais écrit ici.
\set ON_ERROR_STOP on
select set_config('seed.mdp_roles', :'mdp_roles', false);
do $$
declare v_mdp text := current_setting('seed.mdp_roles'); n int;
begin
  if length(v_mdp) < 12 then raise exception 'mdp_roles manquant ou trop court.'; end if;
  update auth.users set encrypted_password = crypt(v_mdp, gen_salt('bf')), updated_at = now()
   where email in ('equipe-admin@leaselane.test', 'equipe-gestionnaire@leaselane.test', 'equipe-location@leaselane.test',
                   'equipe-prospection@leaselane.test', 'equipe-comptabilite@leaselane.test', 'equipe-lecture@leaselane.test',
                   'mj.berube@leaselane.test', 'samuel.fortin@leaselane.test');
  get diagnostics n = row_count;
  raise notice 'Mot de passe appliqué à % comptes de démonstration.', n;
end $$;
