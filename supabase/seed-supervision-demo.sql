-- Supervision et Améliorations de démonstration (maquettes e67, e68, e69, e75), PRÉPRODUCTION SEULEMENT. Rejouable.
-- Les vérifications réelles des sites tournent aussi en préproduction (ops.verifier); ce jeu ajoute ce qui n'a pas de source branchée :
-- un incident SMS en cours avec sa chronologie, six parcours rejoués, une comparaison de captures, une analyse du site, neuf demandes d'amélioration.
\set ON_ERROR_STOP on
begin;
do $$ begin
  if not exists (select 1 from public.owners where full_name = 'Marie-Josée Bérubé') then raise exception 'Pas la base de démonstration : refusé.'; end if;
end $$;

-- ── Incident SMS en cours (e68) : mesures des 2 dernières heures, chronologie ──
do $$
declare v uuid; t0 timestamptz := now() - interval '12 minutes'; v_jn uuid := (select user_id from crm.team_members where display_name = 'Julie Normandeau');
begin
  if exists (select 1 from ops.incidents where titre = 'SMS retardés') then raise notice 'Incident de démonstration déjà présent.'; return; end if;
  insert into ops.checks (service, at, lieu, ok, ms)
  select 'sms', now() - make_interval(mins => m), l, m > 12, case when m > 12 then 450 + (abs(hashtext(m::text || l)) % 300) else 8600 + (abs(hashtext(m::text || l)) % 900) end
  from generate_series(0, 120, 4) m cross join (values ('Québec'), ('Montréal'), ('Toronto')) x(l);
  insert into ops.incidents (service, titre, debut, impact, en_attente, repli) values ('sms', 'SMS retardés', t0,
    'Le fournisseur SMS répond en 9 s au lieu de 2 s, vu des 3 emplacements.', 14, 'Repli par courriel actif depuis ' || to_char((t0 + interval '2 minutes') at time zone 'America/Toronto', 'FMHH24 "h" MI'))
  returning id into v;
  insert into ops.incident_events (incident_id, at, type, texte, par) values
    (v, t0, 'ouvert', 'Incident ouvert : les 3 emplacements voient le fournisseur SMS répondre en 9 s (cible 2 s)', null),
    (v, t0 + interval '1 minute', 'alerte', 'Alerte EQP-08 envoyée à Admin Démo et Julie N., par courriel et dans l’admin (pas par SMS)', null),
    (v, t0 + interval '2 minutes', 'repli', 'Repli automatique : les rappels urgents et les codes de connexion partent par courriel', null),
    (v, t0 + interval '6 minutes', 'note', 'Le fournisseur confirme un incident sur son réseau', null),
    (v, t0 + interval '10 minutes', 'pause', 'Julie N. met en pause « Rappels de visite (SMS) » : « éviter les doublons au retour du service »', v_jn);
end $$;

-- ── Parcours critiques rejoués avec des comptes témoins ──
insert into ops.parcours (code, nom, espace, etapes, ordre) values
  ('payer', 'Payer le loyer', 'Espace locataire', 4, 1), ('demande', 'Déposer une demande d’entretien', 'Espace locataire', 5, 2), ('signer', 'Signer un bail', 'eZsign', 3, 3),
  ('depense', 'Approuver une dépense', 'Espace propriétaire', 3, 4), ('visite', 'Demander une visite', 'Site public', 4, 5), ('evaluation', 'Évaluation gratuite', 'Site public', 3, 6)
on conflict (code) do nothing;
insert into ops.parcours_runs (parcours, at, etapes_ok, duree_ms, statut, note)
select p.code, now() - interval '2 minutes', case when p.code = 'visite' then 3 else p.etapes end, (array[3100, 4200, 5800, 2400, null, 2900])[p.ordre], case when p.code = 'visite' then 'ralenti' else 'normal' end,
       case when p.code = 'visite' then 'confirmation par SMS retardée' end
from ops.parcours p where not exists (select 1 from ops.parcours_runs);

-- ── Comparaison des captures (e69) ──
insert into ops.comparaisons (espace, version, reference, deploye_le, captures, identiques, pages, ecarts, interrupteur, interrupteur_par, interrupteur_pct, historique)
select 'Espace locataire', '2.14', '2.13', now() - interval '2 hours 34 minutes', 96, 95,
  array['Payer le loyer', 'Accueil', 'Mes paiements', 'Reçus', 'Mon bail', 'Renouvellement', 'Documents', 'Demandes d’entretien', 'Nouvelle demande', 'Messages', 'Cléo', 'Mon profil',
        'Calendrier', 'Aide', 'Notifications', 'Affichage', 'Mes informations', 'Mode de paiement', 'Relevé 31', 'Logement', 'Cession', 'Sous-location', 'Endossement', 'Connexion'],
  '[{"page": "Payer le loyer", "navigateur": "iPhone", "pixels": 4.2, "titre": "La nouvelle barre cache le bouton de paiement", "texte": "La barre du bas recouvre le bouton « Payer 1 000,00 $ » : le locataire ne peut plus payer depuis un iPhone."}]'::jsonb,
  'Nouvelle barre de navigation', 'Admin Démo', 10,
  jsonb_build_array(jsonb_build_object('at', now() - interval '2 hours 34 minutes', 'texte', 'Version 2.14 déployée, barre ouverte à 10 %'),
                    jsonb_build_object('at', now() - interval '2 hours 23 minutes', 'texte', 'Comparaison : 1 écart, alerte EQP-13 envoyée'),
                    jsonb_build_object('at', now(), 'texte', 'En attente de votre décision'))
where not exists (select 1 from ops.comparaisons);

-- ── Qualité du site ──
insert into ops.qualite_site (at, pages, liens_brises, liens_detail, fautes, fautes_detail, accessibilite, sans_description, erreurs_js, certificat_fin)
select date_trunc('day', now()) + interval '3 hours', 412, 3, '2 dans des guides de quartier, 1 dans le blogue', '2 FR · 1 EN', 'Noms propres ignorés (Limoilou, Lévis…)', 98, 2, 0, current_date + 52
where not exists (select 1 from ops.qualite_site);

-- ── Demandes d'amélioration (e75) ──
insert into crm.ameliorations (titre, source, demandeur, demandes, statut, recue_le, livree_le, prevue_le, besoin, besoin_source, exigences, inclus, exclus, reporte, reporte_revision, arbitrage, accord_n, accord_total, arbitrage_note)
select * from (values
  ('Photos dans les demandes d’entretien', 'locataires', null, 22, 'livree', current_date - 70, current_date - 21, null::date, null, null, '{}'::text[], null, null, null, null, null, null::int, null::int, null),
  ('Payer le loyer en deux versements', 'locataires', null, 14, 'cadree', current_date - 80, null, null, 'Je suis payé aux deux semaines.', 'Conversations avec Cléo, d’août à octobre',
   array['Accord écrit du propriétaire', 'Le total du loyer ne change pas', 'Prélèvements le 1er et le 15'], 'Deux dates de prélèvement, au choix dans l’Espace locataire',
   'Plus de deux versements', 'Paiement par carte de crédit', 'Révision en janvier 2027', 'Offert seulement là où le propriétaire accepte', 9, 14, 'Décidé avec Admin Démo et Julie N.'),
  ('Documents annuels pour le comptable', 'proprietaires', 'Investissements Roy', 6, 'a_cadrer', current_date - 30, null, null, null, null, '{}', null, null, null, null, null, null, null, null),
  ('Relevé mensuel en anglais', 'proprietaires', null, 3, 'en_developpement', current_date - 40, null, current_date + 7, null, null, '{}', null, null, null, null, null, null, null, null),
  ('Export des dépenses par immeuble', 'proprietaires', null, 2, 'a_cadrer', current_date - 17, null, null, null, null, '{}', null, null, null, null, null, null, null, null),
  ('Rappel de vidange du chauffe-eau', 'equipe', 'Julie N.', 1, 'a_cadrer', current_date - 15, null, null, null, null, '{}', null, null, null, null, null, null, null, null),
  ('Signature des renouvellements sur mobile', 'equipe', 'Camille D.', 1, 'a_cadrer', current_date - 14, null, null, null, null, '{}', null, null, null, null, null, null, null, null),
  ('Tableau des clés et des accès', 'equipe', 'Laurence P.', 1, 'a_cadrer', current_date - 14, null, null, null, null, '{}', null, null, null, null, null, null, null, null),
  ('Rappel d’assurance du locataire à l’échéance', 'cleo', null, 1, 'a_cadrer', current_date - 12, null, null, null, null, '{}', null, null, null, null, null, null, null, null)
) as v where not exists (select 1 from crm.ameliorations);

select (select count(*) from ops.incidents where statut = 'en_cours') incidents, (select count(*) from ops.parcours_runs) parcours, (select count(*) from ops.comparaisons) comparaisons,
       (select count(*) from crm.ameliorations) ameliorations, (select count(*) from ops.checks where ok is not null) verifications;
commit;
