-- Tests pgTAP · Prospection, réservation d'un propriétaire par un prospecteur (Grégory, 2026-11-16 : pas de doublons entre prospecteurs).
-- Deux prospecteurs (P1 = equipe-prospection, P2 = equipe-lecture passé prospecteur le temps du test) et un admin. Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(16);

create function pg_temp.qui(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
update crm.team_members set role = 'prospection' where user_id = (select id from auth.users where email = 'equipe-lecture@leaselane.test');
insert into crm.immeubles_role (millesime, municipalite, matricule, adresse, logements, statut, proprietaire) values
  (2026, 'Éssai-Réserve', 'V-1', '1 boulevard Talbot', 40, 'morale', 'Gestion Talbot inc.'),
  (2026, 'Éssai-Réserve', 'V-2', '9 rue Autre', 30, 'morale', 'Gestion Talbot inc.'),
  (2026, 'Éssai-Réserve', 'V-3', '3 boulevard Talbot', 25, 'morale', 'Voisin Talbot inc.'),
  (2026, 'Éssai-Réserve', 'V-4', '5 boulevard Talbot', 20, 'morale', null);
create function pg_temp.voit(p_cle text) returns boolean language sql as $$
  select exists (select 1 from jsonb_array_elements(public.lanceur_recherche_role('{"villes": ["Éssai-Réserve"]}') -> 'resultats') r where r ->> 'cle' = p_cle);
$$;

select pg_temp.qui('equipe-prospection@leaselane.test');
select ok(pg_temp.voit('gestiontalbot') and pg_temp.voit('voisintalbot'), 'au départ, P1 voit tout');
select is(public.lanceur_role_reserver('{"cle": "gestiontalbot"}') ->> 'reserve', 'true', 'P1 réserve Gestion Talbot');
select ok(pg_temp.voit('gestiontalbot'), 'P1 voit encore sa réservation');
select is((select r ->> 'reserve_moi' from jsonb_array_elements(public.lanceur_recherche_role('{"villes": ["Éssai-Réserve"]}') -> 'resultats') r where r ->> 'cle' = 'gestiontalbot'), 'true', '… marquée « Réservé par vous »');

select pg_temp.qui('equipe-lecture@leaselane.test');
select ok(not pg_temp.voit('gestiontalbot'), 'P2 ne voit plus Gestion Talbot');
select ok(pg_temp.voit('voisintalbot'), 'P2 voit encore le voisin de la même rue (règle 2 : le propriétaire, pas la rue)');
select throws_ok($$ select public.lanceur_role_reserver('{"cle": "gestiontalbot"}') $$, 'PT409', null, 'P2 ne peut pas réserver ce que P1 a réservé');
select throws_ok($$ select public.lanceur_recherche_decider('{"cle": "gestiontalbot", "decision": "ajouter"}') $$, 'PT409', null, 'P2 ne peut pas l’ajouter à son pipeline');
select throws_ok($$ select public.lanceur_role_reserver('{"cle": "gestiontalbot", "liberer": true}') $$, 'PT403', null, 'P2 ne peut pas libérer la réservation de P1');
select is((select count(*) from jsonb_array_elements(public.lanceur_role_immeubles('{"ville": "Éssai-Réserve", "vue": "tous"}') -> 'immeubles') i where i ->> 'proprietaire' = 'Gestion Talbot inc.'), 0::bigint,
  'Immeubles du rôle : P2 n’y voit aucun des deux immeubles de Gestion Talbot');

-- règle 2 : propriétaire inconnu → l'adresse
select is(public.lanceur_role_reserver(jsonb_build_object('cle', 'imm:' || (select id from crm.immeubles_role where matricule = 'V-4'))) ->> 'reserve', 'true', 'P2 réserve une adresse sans propriétaire connu');
select pg_temp.qui('equipe-prospection@leaselane.test');
select ok(not pg_temp.voit('imm:' || (select id from crm.immeubles_role where matricule = 'V-4')), 'P1 ne voit plus cette adresse');

-- règle 3 : 14 jours sans action → la réservation tombe
update crm.immeubles_role set reserve_le = now() - interval '15 days' where proprietaire = 'Gestion Talbot inc.';
select pg_temp.qui('equipe-lecture@leaselane.test');
select ok(pg_temp.voit('gestiontalbot'), 'après 15 jours sans action, P2 revoit Gestion Talbot');
select is(public.lanceur_role_reserver('{"cle": "gestiontalbot"}') ->> 'reserve', 'true', '… et peut la reprendre');

-- règle 5 : l'admin voit tout, avec le nom, et libère
select pg_temp.qui('equipe-admin@leaselane.test');
select is((select r ->> 'reserve_nom' from jsonb_array_elements(public.lanceur_recherche_role('{"villes": ["Éssai-Réserve"]}') -> 'resultats') r where r ->> 'cle' = 'gestiontalbot'),
  crm.nom_membre((select id from auth.users where email = 'equipe-lecture@leaselane.test')), 'l’admin voit qui a réservé');
select is(public.lanceur_role_reserver('{"cle": "gestiontalbot", "liberer": true}') ->> 'reserve', 'false', 'l’admin libère');

select * from finish();
rollback;
