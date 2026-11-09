-- Préproduction seulement : remet à zéro la 2FA du compte de démonstration mj.berube (secret désynchronisé pendant les essais du 2026-11-09).
-- La prochaine connexion inscrit un nouveau facteur. Aucun autre compte touché.
delete from auth.mfa_factors where user_id = (select id from auth.users where email = 'mj.berube@leaselane.test');
select count(*) as facteurs_restants from auth.mfa_factors where user_id = (select id from auth.users where email = 'mj.berube@leaselane.test');
