-- Maintenance · Projets de démonstration (maquette e74), PRÉPRODUCTION SEULEMENT. Rejouable.
-- La toiture du 640, 3e Avenue (P-2026-04) avec ses dates décalées sur aujourd'hui (la maquette date du 13 oct.), ses deux soumissions reçues,
-- la troisième attendue; trois autres projets pour la liste. Trois couvreurs fictifs ajoutés à la banque de fournisseurs.
\set ON_ERROR_STOP on
begin;
do $$ begin
  if not exists (select 1 from public.owners where full_name = 'Marie-Josée Bérubé') then raise exception 'Pas la base de démonstration : refusé.'; end if;
end $$;

insert into public.workers (name, company_name, specialty, requires_rbq, rbq_license, insurance_expiry, verification_status, active)
select n, n, 'toiture', true, rbq, current_date + 300, 'verified', true from (values ('Couvreur Capitale', '5701-2290-01'), ('Toitures Laurentides', '5688-4410-01'), ('Toiture Rive-Sud', '5722-0187-01')) v(n, rbq)
where not exists (select 1 from public.workers w where w.name = v.n);

do $$
declare o int := current_date - date '2026-10-13'; v_b uuid := (select id from public.buildings where address = '640, 3e Avenue, Québec'); v_p uuid;
  d date := date '2026-10-13';
begin
  if exists (select 1 from maint.projets where numero = 'P-2026-04') then raise notice 'Projets de démonstration déjà présents.'; return; end if;
  insert into maint.projets (numero, titre, building_id, owner_id, budget_min, budget_max, etape, cadrage_debut, cadrage_fin, approuve_le, approuve_par, approuve_via,
    soumissions_voulues, soumissions_limite, travaux_debut, fin_prevue, besoin, rapport_libelle, exigences, elements, inclus, exclus, exclus_note, reporte, reporte_revision, arbitrages, created_at)
  values ('P-2026-04', 'Réfection de la toiture', v_b, (select owner_id from public.buildings where id = v_b), 38000, 45000, 'soumissions', d - 11 + o, d - 5 + o, d - 3 + o, 'Marie-Josée Bérubé', 'PRO-12',
    3, d + 3 + o, d + 13 + o, d + 33 + o,
    'Infiltration au plafond du 640 — 8 en septembre. Selon l’inspection du ' || to_char(d - 11 + o, 'FMDD') || ' oct., la membrane de 1998 est en fin de vie.',
    'Rapport d’inspection du ' || to_char(d - 11 + o, 'FMDD') || ' oct. (PDF)',
    array['Membrane élastomère 2 couches', 'Garantie de 10 ans', 'Travaux avant le 15 nov., sinon au printemps', 'Accès par la cour', 'Avis de 24 h au locataire du 640 — 8 pour l’inspection intérieure (art. 1931 C.c.Q.)'],
    '[{"code": "membrane", "libelle": "Membrane élastomère 2 couches"}, {"code": "solins", "libelle": "Solins"}, {"code": "plafond", "libelle": "Réparation du plafond du 640 — 8"}]',
    'Membrane complète, solins, réparation du plafond du 640 — 8', 'Puits de lumière', 'en bon état', 'Isolation de l’entretoit', 'révision le 15 mars 2027',
    jsonb_build_array(jsonb_build_object('titre', 'Isolation de l’entretoit reportée au printemps 2027', 'avec', 'Marie-Josée Bérubé', 'le', d - 5 + o, 'raison', 'subvention Rénoclimat à vérifier')),
    (d - 11 + o)::timestamptz) returning id into v_p;
  insert into maint.projet_soumissions (projet_id, worker_id, statut, demandee_le, relance_le, montant, montant_note, couverture, estimation_manquants, garantie, debut, recue_le)
  select v_p, w.id, x.statut, d - 3 + o, x.relance, x.montant, x.note, x.couv::jsonb, x.est, x.gar, x.debut, x.recue
  from (values ('Couvreur Capitale', 'recue', null::date, 41200, null, '{"membrane": true, "solins": true, "plafond": true}', null::numeric, '10 ans', d + 13 + o, d - 1 + o),
               ('Toitures Laurentides', 'recue', null, 36900, 'sans les solins', '{"membrane": true, "solins": false, "plafond": true}', 3400, '10 ans', d + 20 + o, d + o),
               ('Toiture Rive-Sud', 'attendue', d + 2 + o, null, null, '{}', null, null, null, null)) x(nom, statut, relance, montant, note, couv, est, gar, debut, recue)
  join public.workers w on w.name = x.nom;
  insert into maint.projets (numero, titre, building_id, owner_id, budget_min, budget_max, etape, cadrage_debut, cadrage_fin, approuve_le, approuve_par, travaux_debut, fin_prevue, termine_le, besoin, created_at)
  select v.num, v.titre, b.id, b.owner_id, v.bmin, v.bmax, v.etape, current_date + v.c0, current_date + v.c0 + 6, case when v.etape <> 'cadrage' then current_date + v.c0 + 8 end,
    case when v.etape <> 'cadrage' then (select full_name from public.owners where id = b.owner_id) end, case when v.etape in ('travaux', 'termine') then current_date + v.c0 + 20 end,
    current_date + v.c0 + 45, case when v.etape = 'termine' then current_date + v.c0 + 40 end, v.besoin, (current_date + v.c0)::timestamptz
  from (values ('P-2026-01', 'Remplacement des fenêtres', 'termine', 18000, 22000, -120, 'Fenêtres d’origine, condensation l’hiver dans 6 logements.'),
               ('P-2026-02', 'Réfection des balcons arrière', 'travaux', 24000, 30000, -60, 'Garde-corps non conformes signalés à l’inspection municipale.'),
               ('P-2026-03', 'Mise aux normes électriques', 'cadrage', 9000, 14000, -4, 'Panneaux de 60 A dans 4 logements; l’assureur demande une mise à niveau.')) v(num, titre, etape, bmin, bmax, c0, besoin)
  join lateral (select id, owner_id from public.buildings where id <> v_b order by address offset (substr(v.num, 9)::int) limit 1) b on true;
  perform setval('maint.projet_numero', 4);
end $$;

select set_config('request.jwt.claims', jsonb_build_object('sub', (select id from auth.users where email = 'equipe-admin@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select jsonb_array_length(public.lanceur_projets() -> 'projets') projets,
       jsonb_array_length(public.lanceur_projet((select id from maint.projets where numero = 'P-2026-04')) -> 'soumissions') soumissions;
commit;
