-- ============================================================
-- Univers des maquettes, côté Lanceur (admin) — PRÉPRODUCTION / DÉMO SEULEMENT
-- ============================================================
-- Complète seed-univers-maquettes.sql (Marie-Josée Bérubé, 5 immeubles) avec le reste du parc des maquettes Drive
-- (ADMIN PORTAL, 23 oct. 2026) : 14 clients, ~38 immeubles, ~210 logements, bons de travail, fournisseurs, factures
-- fournisseurs, rapprochement bancaire, anomalies, pipelines de vente. Tout est fictif.
--
-- Ajout seulement : rien n'est supprimé ni modifié hors de ces données fictives (les restes d'essais se retirent à part,
-- avec seed-demo-purge-essais.sql, sur décision).
-- Déclencheurs qui appellent des fonctions edge (adresse de production) ou qui avertissent : coupés le temps du seed.
-- Rejouable : chaque bloc ne refait rien si ses données existent déjà.
-- Usage : gh workflow run preproduction-sql.yml -f fichier=supabase/seed-demo-univers-admin.sql
-- ============================================================
\set ON_ERROR_STOP on
begin;

do $$
begin
  if not exists (select 1 from public.owners where full_name = 'Marie-Josée Bérubé') then
    raise exception 'Univers des maquettes absent (seed-univers-maquettes.sql) : base refusée.';
  end if;
  if (select count(*) from public.owners) > 40 then raise exception 'Trop de propriétaires pour une base de démonstration : refusé.'; end if;
end $$;

-- ── 2. Déclencheurs coupés pendant la création ──
alter table public.units disable trigger on_unit_listing_change;
alter table public.service_requests disable trigger on_service_request_insert;
alter table public.service_requests disable trigger notif_proprio_urgence;
alter table public.work_orders disable trigger on_work_order_worker_assigned;
alter table public.work_orders disable trigger notif_urgence;
alter table public.work_orders disable trigger notif_locataire;
alter table public.payments disable trigger notif_locataire;
alter table public.leases disable trigger bail_cree_emmenagement;
alter table crm.deals disable trigger notif_nouveau_deal;

-- ── 3. Parc : 13 propriétaires, leurs immeubles, logements, locataires, baux et loyers ──
do $$
declare
  v_owner uuid; v_bat uuid; v_unite uuid; v_loc uuid; v_bail uuid; o record; b record; i int; k int; n int := 0;
  v_type text; v_loyer numeric; v_nom text; v_fin date; v_debut date;
  prenoms text[] := array['Alexandre','Amélie','Antoine','Audrey','Benjamin','Camille','Catherine','Charles','Chloé','David','Élise','Émilie','Félix',
    'Florence','Gabrielle','Guillaume','Isabelle','Jacob','Jasmine','Jérémie','Julie','Justin','Laurie','Louis','Maude','Maxime','Mélissa','Nathan',
    'Noémie','Olivier','Patrick','Rosalie','Samuel','Sandrine','Simon','Sophie','Thomas','Valérie','Vincent','Zoé'];
  noms text[] := array['Bergeron','Bernier','Bilodeau','Boucher','Boudreau','Brassard','Carrier','Champagne','Cloutier','Côté','Daigle','Demers',
    'Desjardins','Dion','Dufour','Dumont','Fortin','Fournier','Gagné','Gauthier','Gilbert','Girard','Hamel','Hébert','Labbé','Lachance','Lapointe',
    'Leblanc','Lemieux','Lévesque','Martel','Mercier','Michaud','Morin','Nadeau','Ouellet','Paradis','Poirier','Roy','Vachon'];
  types text[] := array['4 1/2','3 1/2','4 1/2','5 1/2','3 1/2','4 1/2','2 1/2','3 1/2'];
begin
  if exists (select 1 from public.owners where full_name = 'Pierre Bouchard') then
    raise notice 'Parc des maquettes déjà présent — création sautée.'; return;
  end if;

  for o in select * from (values
    ('Pierre Bouchard', null, date '2019-03-12', 'pierre.bouchard@courriel.test', '418 555-0711', false),
    ('Hélène Caron', null, date '2022-05-02', 'helene.caron@courriel.test', '418 555-0712', true),
    ('Denis Lachance', null, date '2020-01-20', 'denis.lachance@courriel.test', '418 555-0713', false),
    ('Sylvie Morin', 'Placements Morin', date '2026-10-03', 'sylvie@placements-morin.test', '418 555-0714', true),
    ('Annie Bélanger', 'Gestion Bélanger', date '2020-06-15', 'annie@gestion-belanger.test', '418 555-0715', false),
    ('Chantal Giguère', null, date '2021-09-01', 'chantal.giguere@courriel.test', '418 555-0716', false),
    ('Luc Thibault', 'Placements Thibault', date '2018-04-10', 'luc@placements-thibault.test', '418 555-0717', false),
    ('Marc Tessier', 'Habitations Tessier', date '2020-02-03', 'marc@habitations-tessier.test', '418 555-0718', false),
    ('Robert Gingras', 'Immeubles Gingras', date '2017-11-21', 'robert@immeubles-gingras.test', '418 555-0719', false),
    ('Lucie Fortin', null, date '2023-07-04', 'lucie.fortin@courriel.test', '418 555-0720', true),
    ('Marc Lavallée', 'Gestion Lavallée', date '2019-08-26', 'marc@gestion-lavallee.test', '418 555-0721', false),
    ('Nicole Dufour', null, date '2024-03-18', 'nicole.dufour@courriel.test', '418 555-0722', false),
    ('Jacques Côté', null, date '2022-10-11', 'jacques.cote@courriel.test', '418 555-0723', false)
  ) as t(nom, entreprise, depuis, courriel, tel, invite)
  loop
    insert into public.owners (full_name, company_name, email, phone, management_rate, spending_cap, work_coordination_rate, created_at, onboarding_completed_at, language)
    values (o.nom, o.entreprise, o.courriel, o.tel, 6.00, 500, 10.00, o.depuis, o.depuis + 14, 'fr') returning id into v_owner;
    if o.invite then
      insert into public.portal_invitations (code, kind, email, full_name, owner_id, created_at, expires_at)
      values ('LL-' || upper(substr(md5(o.nom), 1, 4)) || '-' || upper(substr(md5(o.courriel), 1, 4)), 'proprietaire', o.courriel, o.nom, v_owner, now() - interval '2 days', now() + interval '12 days');
    end if;

    for b in select * from (values
      ('Pierre Bouchard', '2910, chemin Sainte-Foy, Québec', 'Sainte-Foy', 6, 1988),
      ('Hélène Caron', '380, rue de la Couronne, Québec', 'Saint-Roch', 5, 1925),
      ('Denis Lachance', '1095, avenue des Érables, Québec', 'Montcalm', 6, 1948),
      ('Sylvie Morin', '88, rue Wolfe, Lévis', 'Lévis', 6, 1972),
      ('Annie Bélanger', '710, rue Saint-Vallier Est, Québec', 'Saint-Roch', 6, 1931),
      ('Annie Bélanger', '1340, chemin Saint-Louis, Québec', 'Montcalm', 6, 1956),
      ('Annie Bélanger', '255, rue du Roi, Québec', 'Saint-Roch', 6, 1912),
      ('Chantal Giguère', '75, rue Saint-Vallier Ouest, Québec', 'Saint-Roch', 4, 1920),
      ('Luc Thibault', '1450, boulevard de la Rive-Sud, Lévis', 'Lévis', 12, 1991),
      ('Marc Tessier', '1215, avenue Turnbull, Québec', 'Montcalm', 6, 1939),
      ('Marc Tessier', '540, rue Saint-François Est, Québec', 'Saint-Roch', 6, 1928),
      ('Marc Tessier', '1170, avenue De Bougainville, Québec', 'Montcalm', 6, 1951),
      ('Marc Tessier', '620, rue Caron, Québec', 'Saint-Roch', 6, 1930),
      ('Robert Gingras', '3155, avenue Royale, Québec', 'Beauport', 6, 1979),
      ('Robert Gingras', '2240, boulevard Louis-XIV, Québec', 'Beauport', 6, 1985),
      ('Robert Gingras', '780, rue Seigneuriale, Québec', 'Beauport', 4, 1997),
      ('Robert Gingras', '135, rue du Chanoine-Côté, Québec', 'Beauport', 4, 2003),
      ('Robert Gingras', '1020, boulevard des Chutes, Québec', 'Beauport', 6, 1990),
      ('Lucie Fortin', '1475, 4e Avenue, Québec', 'Limoilou', 4, 1946),
      ('Lucie Fortin', '1260, 3e Avenue, Québec', 'Limoilou', 6, 1950),
      ('Lucie Fortin', '890, 8e Rue, Québec', 'Limoilou', 4, 1938),
      ('Marc Lavallée', '45, rue Saint-Laurent, Lévis', 'Lévis', 6, 1968),
      ('Marc Lavallée', '1270, chemin du Fleuve, Lévis', 'Lévis', 4, 1983),
      ('Marc Lavallée', '6000, rue Saint-Georges, Lévis', 'Lévis', 6, 1977),
      ('Marc Lavallée', '320, côte du Passage, Lévis', 'Lévis', 4, 1959),
      ('Marc Lavallée', '1710, boulevard Alphonse-Desjardins, Lévis', 'Lévis', 6, 2008),
      ('Nicole Dufour', '2650, rue Einstein, Québec', 'Sainte-Foy', 4, 1994),
      ('Nicole Dufour', '965, avenue Roland-Beaudin, Québec', 'Sainte-Foy', 4, 1987),
      ('Nicole Dufour', '3340, rue de la Pérade, Québec', 'Sainte-Foy', 4, 1976),
      ('Jacques Côté', '1555, 1re Avenue, Québec', 'Limoilou', 6, 1949),
      ('Jacques Côté', '720, 18e Rue, Québec', 'Limoilou', 6, 1955),
      ('Jacques Côté', '2480, avenue Saint-David, Québec', 'Beauport', 4, 1972),
      ('Jacques Côté', '1085, boulevard Raymond, Québec', 'Beauport', 6, 1981)
    ) as x(proprio, adresse, secteur, portes, annee) where x.proprio = o.nom
    loop
      insert into public.buildings (owner_id, address, unit_count, year_built, zone, city, created_at)
      values (v_owner, b.adresse, b.portes, b.annee, b.secteur, case when b.adresse like '%Lévis' then 'Lévis' else 'Québec' end, greatest(o.depuis, date '2017-01-01'))
      returning id into v_bat;

      for i in 1..b.portes loop
        n := n + 1;
        v_type := types[1 + ((n + i) % array_length(types, 1))];
        v_loyer := round((case v_type when '2 1/2' then 900 when '3 1/2' then 1080 when '4 1/2' then 1290 else 1560 end)
                   * (case b.secteur when 'Montcalm' then 1.10 when 'Sainte-Foy' then 1.08 when 'Limoilou' then 1.0 when 'Saint-Roch' then 1.02 when 'Beauport' then 0.93 else 0.90 end)
                   * (0.96 + ((n * 37) % 9) / 100.0) / 5) * 5;
        -- Logements des maquettes : noms et loyers imposés (e21, e28, e40, e42)
        v_nom := case b.adresse || ' — ' || i
          when '380, rue de la Couronne, Québec — 5' then 'Luc Morin'
          when '1095, avenue des Érables, Québec — 3' then 'Martin Gagnon'
          when '2910, chemin Sainte-Foy, Québec — 1' then 'Julien Côté'
          when '2910, chemin Sainte-Foy, Québec — 2' then 'Josée Lemieux'
          when '2910, chemin Sainte-Foy, Québec — 4' then 'Félix Gauthier'
          when '1095, avenue des Érables, Québec — 6' then 'Olivier Dion'
          when '710, rue Saint-Vallier Est, Québec — 2' then 'Antoine Pelletier'
          when '75, rue Saint-Vallier Ouest, Québec — 3' then 'Chloé Bergeron'
          when '1450, boulevard de la Rive-Sud, Lévis — 4' then 'Rachel Poirier'
          when '1260, 3e Avenue, Québec — 2' then 'Léa Bouchard'
          when '1260, 3e Avenue, Québec — 4' then 'Marc-André Simard'
          when '1475, 4e Avenue, Québec — 2' then 'Jérôme Pelletier'
          -- vacants (8 au parc avec les 2 de Marie-Josée Bérubé)
          when '75, rue Saint-Vallier Ouest, Québec — 1' then null
          when '1450, boulevard de la Rive-Sud, Lévis — 9' then null
          when '3155, avenue Royale, Québec — 5' then null
          when '6000, rue Saint-Georges, Lévis — 2' then null
          when '1555, 1re Avenue, Québec — 4' then null
          when '540, rue Saint-François Est, Québec — 6' then null
          else prenoms[1 + ((n * 7) % 40)] || ' ' || noms[1 + ((n * 11 + i) % 40)] end;
        if b.adresse || ' — ' || i = '75, rue Saint-Vallier Ouest, Québec — 1' then v_type := '2 1/2'; v_loyer := 925; end if;
        if b.adresse || ' — ' || i = '1450, boulevard de la Rive-Sud, Lévis — 9' then v_type := '3 1/2'; v_loyer := 1040; end if;
        if v_nom = 'Luc Morin' then v_type := '3 1/2'; v_loyer := 1140; end if;
        if v_nom = 'Martin Gagnon' then v_type := '4 1/2'; v_loyer := 1245; end if;
        if v_nom = 'Julien Côté' then v_type := '3 1/2'; v_loyer := 1095; end if;
        if v_nom = 'Josée Lemieux' then v_type := '4 1/2'; v_loyer := 1095; end if;
        if v_nom = 'Olivier Dion' then v_type := '4 1/2'; v_loyer := 1310; end if;
        if v_nom = 'Léa Bouchard' then v_type := '4 1/2'; v_loyer := 1310; end if;
        if v_nom = 'Rachel Poirier' then v_type := '4 1/2'; v_loyer := 1380; end if;
        if v_nom = 'Chloé Bergeron' then v_type := '4 1/2'; v_loyer := 1415; end if;

        insert into public.units (building_id, unit_number, unit_type, rent, status, created_at)
        values (v_bat, i::text, v_type, v_loyer, case when v_nom is null then 'available' else 'occupied' end, greatest(o.depuis, date '2017-01-01'))
        returning id into v_unite;
        continue when v_nom is null;

        insert into public.tenants (full_name, email, phone, language, created_at)
        values (v_nom, lower(translate(replace(v_nom, ' ', '.'), 'éèêëàâîïôöûüçÉÈÎ', 'eeeeaaiioouuceEI')) || '.' || n || '@courriel.test',
                '418 555-' || lpad((2000 + n)::text, 4, '0'), 'fr', now() - interval '1 year')
        returning id into v_loc;
        v_debut := make_date(2019 + ((n * 3) % 7), 7, 1);
        v_fin := case v_nom when 'Luc Morin' then date '2026-10-31' when 'Jérôme Pelletier' then date '2026-11-30' when 'Martin Gagnon' then date '2027-03-31' else date '2027-06-30' end;
        insert into public.leases (unit_id, tenant_id, start_date, end_date, monthly_rent, status, created_at,
                                   renewal_response, renewal_notice_sent_at)
        values (v_unite, v_loc, v_debut, v_fin, v_loyer, 'active', v_debut - 20,
                case when v_nom in ('Luc Morin', 'Jérôme Pelletier') then 'refused' end,
                case when v_nom = 'Martin Gagnon' then timestamptz '2026-10-10 10:00-04' end)
        returning id into v_bail;

        -- Loyers juillet à octobre payés (Olivier Dion et Josée Lemieux : octobre reçu à la banque, pas encore rapproché)
        for k in 0..3 loop
          insert into public.payments (lease_id, amount, due_date, paid_date, status, amount_received, created_at, collection_status)
          values (v_bail, v_loyer, (date '2026-07-01' + make_interval(months => k))::date,
                  case when k = 3 and v_nom in ('Olivier Dion', 'Josée Lemieux') then null else (date '2026-07-01' + make_interval(months => k))::date end,
                  case when k = 3 and v_nom in ('Olivier Dion', 'Josée Lemieux') then 'pending' else 'paid' end,
                  case when k = 3 and v_nom in ('Olivier Dion', 'Josée Lemieux') then 0 else v_loyer end,
                  (date '2026-06-20' + make_interval(months => k))::timestamptz,
                  case when (n % 5) < 4 then 'collected' else 'manual' end);
        end loop;
        -- 4 baux sur 5 au prélèvement (PAD)
        if (n % 5) < 4 then
          insert into public.tenant_pad_authorizations (lease_id, tenant_id, status, consented_at, consent_method, processor)
          values (v_bail, v_loc, 'active', v_debut - 10, 'portail', 'optimal');
        end if;
      end loop;
    end loop;
  end loop;

  -- Nadia Tremblay (640, 3e Avenue — 3) : prélèvement d'octobre refusé (e21, e40)
  update public.payments pa set collection_status = 'failed', collection_error = 'Fonds insuffisants', status = 'late', paid_date = null, amount_received = 0
  from public.leases l join public.tenants t on t.id = l.tenant_id
  where pa.lease_id = l.id and t.full_name = 'Nadia Tremblay' and pa.due_date = date '2026-10-01';

  raise notice 'Parc créé : % logements ajoutés.', n;
end $$;

-- ── 4. Fournisseurs (e34) ──
insert into public.workers (name, company_name, specialty, specialties, phone, email, requires_rbq, rbq_license, insurance_expiry, zones, handles_urgent,
                            verification_status, verified_at, availability_status, active, hourly_rate)
select n, n, s, sp, t, c, rbq is not null, rbq, ass, z, urg, 'verified', now() - interval '6 months', 'semaine', true, taux
from (values
  ('Thermo-Pro', 'chauffage', array['chauffage','ventilation'], '418 555-0650', 'service@thermo-pro.test', '5590-4410-01', date '2026-10-31', array['Québec','Lévis'], true, 95),
  ('Serrurerie Express', 'serrurerie', array['serrurerie'], '418 555-0660', 'info@serrurerie-express.test', null, date '2026-09-30', array['Québec'], true, 80),
  ('Les Plombiers de Lévis', 'plomberie', array['plomberie'], '418 555-0670', 'bureau@plombiers-levis.test', '5712-0098-01', date '2027-04-30', array['Lévis'], true, 90),
  ('Déneigement Côté', 'déneigement', array['déneigement'], '418 555-0680', 'info@deneigement-cote.test', null, date '2026-09-15', array['Lévis'], false, 65),
  ('Peinture Rive-Nord', 'peinture', array['peinture'], '418 555-0690', 'info@peinture-rive-nord.test', '5634-2201-01', date '2027-02-28', array['Québec'], false, 60),
  ('Vitrerie Laurentienne', 'vitrerie', array['vitrerie','portes et fenêtres'], '418 555-0700', 'info@vitrerie-laurentienne.test', '5688-1102-01', date '2027-05-31', array['Québec'], false, 75),
  ('Extermination Québec', 'extermination', array['extermination'], '418 555-0701', 'info@extermination-qc.test', null, date '2027-01-31', array['Québec','Lévis'], true, 85),
  ('Électro-Ménagers Gagnon', 'électroménagers', array['électroménagers'], '418 555-0702', 'service@em-gagnon.test', null, date '2027-03-31', array['Québec'], false, 70),
  ('Paysagement Bélair', 'paysagement', array['paysagement','déneigement'], '418 555-0703', 'info@paysagement-belair.test', null, date '2027-04-30', array['Québec'], false, 55),
  ('Nettoyage Pro-Net', 'nettoyage', array['nettoyage'], '418 555-0704', 'info@pro-net.test', null, date '2027-06-30', array['Québec','Lévis'], false, 45),
  ('Ventilation Boréale', 'ventilation', array['ventilation','chauffage'], '418 555-0705', 'info@ventilation-boreale.test', '5741-3320-01', date '2027-02-28', array['Québec'], false, 90),
  ('Maçonnerie Giroux', 'maçonnerie', array['maçonnerie'], '418 555-0706', 'info@maconnerie-giroux.test', '5602-8871-01', date '2027-05-31', array['Québec'], false, 85),
  ('Gypse Lapointe', 'plâtrerie', array['plâtrerie','peinture'], '418 555-0707', 'info@gypse-lapointe.test', '5655-0912-01', date '2027-01-31', array['Québec'], false, 65),
  ('Planchers Dubé', 'revêtements de sol', array['revêtements de sol'], '418 555-0708', 'info@planchers-dube.test', '5677-4410-01', date '2027-03-31', array['Québec','Lévis'], false, 70),
  ('Électricité Rive-Sud', 'électricité', array['électricité'], '418 555-0709', 'info@electricite-rive-sud.test', '5729-6651-01', date '2027-06-30', array['Lévis'], true, 95)
) as w(n, s, sp, t, c, rbq, ass, z, urg, taux)
where not exists (select 1 from public.workers x where x.name = w.n);
update public.workers set rbq_license = v.rbq, requires_rbq = true, specialties = v.sp, zones = v.z, company_name = coalesce(company_name, name)
from (values ('Plomberie Capitale', '5678-1234-01', array['plomberie','chauffe-eau'], array['Québec','Lévis']),
             ('Électrique Duval', '5701-2288-01', array['électricité','alarmes'], array['Québec']),
             ('Toitures Beauport', '5623-7781-01', array['toiture'], array['Québec']),
             ('Menuiserie Lauzon', '5618-9030-01', array['menuiserie','portes et fenêtres'], array['Québec'])) as v(n, rbq, sp, z)
where name = v.n;

-- ── 5. Bons de travail (e32), soumissions, factures fournisseurs (e44), notes (e34) ──
do $$
declare
  v_jn uuid := (select user_id from crm.team_members where display_name = 'Julie Normandeau');
  v_cd uuid := (select user_id from crm.team_members where display_name = 'Camille Desrosiers');
  v_mt uuid := (select user_id from crm.team_members where display_name = 'Marc Thibault');
  v_aujourdhui timestamptz := date_trunc('day', now() at time zone 'America/Toronto') at time zone 'America/Toronto';
  r record; v_id uuid; v_sr uuid; v_unite uuid; v_w uuid; i int := 0;
begin
  if exists (select 1 from public.work_orders where id::text like '0125%') then raise notice 'Bons des maquettes déjà présents.'; return; end if;

  for r in select * from (values
    -- id (préfixe = numéro BT), titre, adresse, logement, fournisseur, statut, rendez-vous (heures depuis aujourd'hui 0 h), urgent, coût estimé, fait le (heures), confirmé, demande liée, créé il y a (jours)
    ('0125', 'Robinet de baignoire', '2880, chemin Sainte-Foy, Québec', '1', null, 'open', null, false, 220, null, false, 'DEM-2026-0154', 1),
    ('0123', 'Peinture avant relocation', '420, rue Saint-Joseph Est, Québec', '5', null, 'open', null, false, 1150, null, false, null, 2),
    ('0122', 'Calfeutrage des fenêtres', '1180, avenue Cartier, Québec', '1', null, 'open', null, false, 620, null, false, null, 3),
    ('0119', 'Fenêtre de chambre', '1180, avenue Cartier, Québec', '3', 'Menuiserie Lauzon', 'assigned', 33, false, 480, null, false, null, 4),
    ('0120', 'Entretien de la chaudière', '2880, chemin Sainte-Foy, Québec', '2', 'Thermo-Pro', 'assigned', 61, false, 260, null, false, null, 5),
    ('0121', 'Changement de serrure', '75, rue Saint-Vallier Ouest, Québec', '1', 'Serrurerie Express', 'assigned', 82, false, 245, null, false, null, 5),
    ('0124', 'Détecteur de fumée', '420, rue Saint-Joseph Est, Québec', '5', 'Électrique Duval', 'in_progress', 12, true, 420, null, false, 'DEM-2026-0152', 0),
    ('0116', 'Inspection de toiture', '1180, avenue Cartier, Québec', '8', 'Toitures Beauport', 'in_progress', 11.5, false, 350, null, false, null, 6),
    ('0112', 'Fuite sous l''évier', '1475, 4e Avenue, Québec', '2', 'Plomberie Capitale', 'completed', -48, false, 290, -20, false, null, 8),
    -- historique (terminés, confirmés) : coût du mois, délai, notes, factures payées
    ('0117', 'Panne d''éclairage', '2880, chemin Sainte-Foy, Québec', '2', 'Électrique Duval', 'completed', -330, false, 486.30, -320, true, null, 16),
    ('0115', 'Cylindre de serrure', '2880, chemin Sainte-Foy, Québec', '1', 'Serrurerie Express', 'completed', -360, false, 245, -355, true, null, 18),
    ('0109', 'Thermopompe', '1180, avenue Cartier, Québec', '4', 'Thermo-Pro', 'completed', -400, false, 1120, -396, true, null, 20),
    ('0108', 'Solins de toiture', '75, rue Saint-Vallier Ouest, Québec', '2', 'Toitures Beauport', 'completed', -430, false, 1697.17, -425, true, null, 22),
    ('0104', 'Fuite sous l''évier', '420, rue Saint-Joseph Est, Québec', '2', 'Plomberie Capitale', 'completed', -600, false, 612.45, -596, true, null, 30),
    ('0101', 'Robinetterie de cuisine', '2880, chemin Sainte-Foy, Québec', '5', 'Les Plombiers de Lévis', 'completed', -640, false, 389, -636, true, null, 32),
    ('0098', 'Éclairage du stationnement', '2880, chemin Sainte-Foy, Québec', '1', 'Électrique Duval', 'completed', -700, false, 1054.62, -696, true, null, 35),
    ('0093', 'Remplacement de la hotte', '640, 3e Avenue, Québec', '9', 'Électro-Ménagers Gagnon', 'completed', -900, false, 410, -896, true, null, 45),
    ('0089', 'Traitement contre les fourmis', '1260, 3e Avenue, Québec', '1', 'Extermination Québec', 'completed', -1100, false, 280, -1096, true, null, 52),
    ('0084', 'Peinture du corridor', '1450, boulevard de la Rive-Sud, Lévis', '3', 'Peinture Rive-Nord', 'completed', -1400, false, 940, -1390, true, null, 64),
    ('0079', 'Vitre thermos', '1095, avenue des Érables, Québec', '2', 'Vitrerie Laurentienne', 'completed', -1700, false, 365, -1696, true, null, 76)
  ) as x(pre, titre, adresse, numero, fournisseur, statut, rdv, urgent, cout, fait, confirme, dem, age)
  loop
    i := i + 1;
    select u.id into v_unite from public.units u join public.buildings b on b.id = u.building_id where b.address = r.adresse and u.unit_number = r.numero;
    if v_unite is null then raise exception 'Logement introuvable : % — %', r.adresse, r.numero; end if;
    v_w := (select id from public.workers where name = r.fournisseur limit 1);
    v_sr := null;
    if r.dem is not null then
      select sr.id into v_sr from public.service_requests sr where sr.description like '%(' || r.dem || ')%' limit 1;
    elsif r.statut <> 'completed' or r.age < 40 then
      insert into public.service_requests (unit_id, tenant_id, description, status, created_at, ai_category, ai_urgency, ai_status, kind, title)
      values (v_unite, (select tenant_id from public.leases where unit_id = v_unite and status = 'active' limit 1), r.titre || ' — signalé par le locataire.',
              case when r.statut = 'completed' and r.confirme then 'closed' else 'in_progress' end, now() - make_interval(days => r.age) - interval '2 days 3 hours',
              'entretien', case when r.urgent then 'urgent' else 'normal' end, 'ok', 'travaux', r.titre)
      returning id into v_sr;
    end if;
    v_id := (r.pre || substr(md5(r.titre || r.adresse || r.numero), 1, 4) || '-' || substr(md5(r.titre), 1, 4) || '-4' || substr(md5(r.adresse), 1, 3) || '-8' || substr(md5(r.numero || r.titre), 1, 3) || '-' || substr(md5(r.pre || r.titre), 1, 12))::uuid;
    insert into public.work_orders (id, service_request_id, unit_id, worker_id, description, estimated_cost, status, created_at, appointment_at, is_urgent,
                                    worker_reported_done_at, tenant_confirmed, worker_response, worker_response_at, dispatch_mode, responsable_id,
                                    invoice_subtotal_cents, photo_after_urls, coordination_rate)
    values (v_id, v_sr, v_unite, v_w, r.titre, r.cout, r.statut, now() - make_interval(days => r.age),
            case when r.rdv is not null then v_aujourdhui + make_interval(secs => r.rdv * 3600) end, r.urgent,
            case when r.fait is not null then v_aujourdhui + make_interval(secs => r.fait * 3600) end, r.confirme,
            case when v_w is not null then 'accepted' end, case when v_w is not null then now() - make_interval(days => r.age) + interval '3 hours' end, 'manual',
            case when r.pre in ('0121', '0124') or i % 3 = 0 then coalesce(v_cd, v_jn) else v_jn end,
            case when r.statut = 'completed' then (r.cout * 100)::bigint end,
            case when r.statut = 'completed' then '["avant.jpg","apres.jpg"]'::jsonb else '[]'::jsonb end, 10);
    if r.statut = 'completed' and r.confirme and v_w is not null then
      insert into public.worker_ratings (work_order_id, worker_id, rated_by_type, stars, created_at)
      values (v_id, v_w, 'tenant', case when r.fournisseur in ('Serrurerie Express', 'Déneigement Côté') then 4 else 5 end, now() - make_interval(days => r.age - 1));
    end if;
  end loop;

  -- Accords créés par le déclencheur (coût > plafond) : déjà donnés par les propriétaires pour ces bons
  update public.approvals set status = 'approved', decided_at = created_at + interval '1 day'
  where status = 'pending' and work_order_id in (select id from public.work_orders where id::text ~ '^0(0|1)[0-9]{2}');
  -- Peinture et calfeutrage : en soumissions (budget fixé, soumissions reçues)
  update public.work_orders set quote_budget = estimated_cost where id::text like '0123%' or id::text like '0122%';
  insert into maint.quotes (work_order_id, worker_id, amount, available_on, scope, status, source, created_at)
  select w.id, wk.id, a, current_date + d, s, 'received', 'fournisseur', now() - interval '1 day'
  from (values ('0123', 'Peinture Rive-Nord', 1090, 6, 'Deux couches, murs et plafonds, 4½'), ('0123', 'Gypse Lapointe', 1240, 9, 'Réparations de gypse et peinture complète'),
               ('0122', 'Vitrerie Laurentienne', 595, 12, 'Calfeutrage extérieur de 32 fenêtres')) as q(pre, f, a, d, s)
  join public.work_orders w on w.id::text like q.pre || '%' join public.workers wk on wk.name = q.f;

  -- Factures fournisseurs (e44) : 2 à approuver, 3 planifiées, 3 payées
  insert into public.payables (owner_id, building_id, work_order_id, vendor_name, description, amount, category, due_date, status, approved_by, approved_at, paid_at, created_at)
  select b.owner_id, b.id, w.id, p.f, p.descr, p.montant, 'entretien', current_date + p.ech, p.st,
         case when p.st in ('approved', 'paid') then v_mt end, case when p.st in ('approved', 'paid') then now() - interval '2 days' end,
         case when p.st = 'paid' then now() + make_interval(days => p.ech) end, now() - make_interval(days => p.recue)
  from (values ('0117', 'Électrique Duval', 'F-20931 · Panne d''éclairage', 486.30, 2, 'pending_approval', 4),
               (null, 'Déneigement Côté', 'DC-2026-14 · Déneigement, 1er versement (contrat saisonnier)', 663.93, 3, 'pending_approval', 5),
               ('0109', 'Thermo-Pro', 'TP-5520 · Thermopompe', 1120.00, 0, 'approved', 4),
               ('0115', 'Serrurerie Express', '1182 · Cylindre', 245.00, 1, 'approved', 5),
               ('0108', 'Toitures Beauport', 'TB-7781 · Solins', 1697.17, 3, 'approved', 6),
               ('0104', 'Plomberie Capitale', 'PC-4471 · Fuite sous l''évier', 612.45, -4, 'paid', 13),
               ('0101', 'Les Plombiers de Lévis', 'PL-0388 · Robinetterie', 389.00, -6, 'paid', 15),
               ('0098', 'Électrique Duval', 'F-20874 · Éclairage du stationnement', 1054.62, -8, 'paid', 18)) as p(pre, f, descr, montant, ech, st, recue)
  left join public.work_orders w on w.id::text like p.pre || '%'
  left join public.units u on u.id = w.unit_id
  left join public.buildings b on b.id = coalesce(u.building_id, (select id from public.buildings where address = '1450, boulevard de la Rive-Sud, Lévis'));
  raise notice 'Bons de travail, soumissions et factures fournisseurs créés.';
end $$;

-- ── 6. Rapprochement (e42) et anomalies (e43) ──
do $$
declare
  v_mj uuid := (select id from public.owners where full_name = 'Marie-Josée Bérubé');
  v_mt uuid := (select user_id from crm.team_members where display_name = 'Marc Thibault');
  v_jn uuid := (select user_id from crm.team_members where display_name = 'Julie Normandeau');
  v_e1 uuid; v_e2 uuid;
begin
  if exists (select 1 from public.bank_transactions where external_id like 'DEMO-%') then raise notice 'Banque déjà présente.'; return; end if;
  -- Loyers d'octobre payés : rapprochés par les règles (PAD et Interac), 21 par une personne (proposition de Cléo approuvée)
  insert into public.bank_transactions (owner_id, transaction_date, description, amount, match_status, matched_payment_id, match_confidence, reconciled_by, reconciled_at,
                                        created_at, external_id, compte, lease_id, unit_id)
  select b.owner_id, pa.paid_date, case when pa.collection_status = 'collected' then 'PRÉLÈVEMENT PAD · ' else 'VIREMENT INTERAC · ' end || upper(t.full_name), pa.amount_received,
         'matched', pa.id, 99, case when row_number() over (order by pa.id) % 10 = 0 then v_mt end, case when row_number() over (order by pa.id) % 10 = 0 then now() - interval '5 days' end,
         timestamptz '2026-10-02 12:00-04', 'DEMO-' || pa.id, 'proprietaire', l.id, u.id
  from public.payments pa join public.leases l on l.id = pa.lease_id join public.tenants t on t.id = l.tenant_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
  where pa.due_date = date '2026-10-01' and pa.status = 'paid';
  -- 3 opérations à rapprocher, avec la suggestion de Cléo
  insert into public.bank_transactions (owner_id, transaction_date, description, amount, match_status, ai_suggested_tenant_id, ai_suggestion_note, ai_confidence, created_at, external_id, compte)
  values ((select b.owner_id from public.tenants t join public.leases l on l.tenant_id = t.id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where t.full_name = 'Olivier Dion'),
          date '2026-10-09', 'VIREMENT INTERAC · O. DION', 1310.00, 'suggested', (select id from public.tenants where full_name = 'Olivier Dion'), 'même montant, même payeur', 97, now() - interval '3 hours', 'DEMO-4471-0920', 'proprietaire'),
         ((select b.owner_id from public.tenants t join public.leases l on l.tenant_id = t.id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where t.full_name = 'Josée Lemieux'),
          date '2026-10-06', 'DÉPÔT MOBILE · CHÈQUE 118', 1100.00, 'suggested', (select id from public.tenants where full_name = 'Josée Lemieux'), 'écart de 5,00 $ avec le loyer', 74, now() - interval '3 hours', 'DEMO-0118-3304', 'proprietaire'),
         (v_mj, date '2026-10-03', 'Hydro-Québec, paiement facture 6 152 873 412', -342.18, 'unmatched', null, 'Déjà rapprochée avec le paiement de 9 h 12 : paiement en double possible', 38, now() - interval '3 hours', 'DEMO-HQ-0914', 'proprietaire');

  -- Anomalie ouverte : Hydro-Québec payé deux fois (deux dépenses identiques à 2 minutes d'intervalle)
  insert into public.expenses (building_id, description, amount, expense_date, vendor_name, category, created_at)
  values ((select id from public.buildings where address = '640, 3e Avenue, Québec'), 'Hydro-Québec, paiement facture 6 152 873 412 (9 h 12)', 342.18, date '2026-10-03', 'Hydro-Québec', 'electricite', timestamptz '2026-10-03 09:12-04')
  returning id into v_e1;
  insert into public.expenses (building_id, description, amount, expense_date, vendor_name, category, created_at)
  values ((select id from public.buildings where address = '640, 3e Avenue, Québec'), 'Hydro-Québec, paiement facture 6 152 873 412 (9 h 14)', 342.18, date '2026-10-03', 'Hydro-Québec', 'electricite', timestamptz '2026-10-03 09:14-04')
  returning id into v_e2;
  insert into public.financial_anomalies (type, severity, description, owner_id, related_expense_id, status, created_at)
  values ('facture_dupliquee', 'eleve', 'Hydro-Québec, paiement facture de 342,18 $ payé deux fois le 3 octobre', v_mj, v_e2, 'open', timestamptz '2026-10-04 08:00-04');
  -- Anomalies résolues sur 12 mois (9, 6 418 $ récupérés)
  insert into public.financial_anomalies (type, severity, description, owner_id, status, created_at, resolved_by, resolved_at, resolution_note, recovered_amount)
  select t, 'moyen', d, v_mj, 'resolved', le - interval '1 day', par, le, note, rec
  from (values ('facture_dupliquee', 'Facture en double · Toitures Beauport', timestamptz '2026-09-14 10:00-04', v_jn, 'Avoir reçu', 2180.00),
               ('depassement_cout', 'TVQ mal calculée · Thermo-Pro', timestamptz '2026-07-03 10:00-04', v_mt, 'Facture corrigée', 41.20),
               ('recu_manquant', 'Frais bancaires inhabituels · Desjardins', timestamptz '2026-05-18 10:00-04', v_mt, 'Remboursés', 75.00),
               ('facture_dupliquee', 'Facture en double · Plomberie Capitale', timestamptz '2026-04-22 10:00-04', v_jn, 'Avoir reçu', 1460.00),
               ('facture_dupliquee', 'Paiement en double · Électrique Duval', timestamptz '2026-03-09 10:00-04', v_mt, 'Remboursé', 894.30),
               ('facture_dupliquee', 'Facture en double · Déneigement Côté', timestamptz '2026-01-27 10:00-05', v_mt, 'Avoir reçu', 663.93),
               ('depassement_cout', 'Taxes mal calculées · Menuiserie Lauzon', timestamptz '2025-12-15 10:00-05', v_mt, 'Facture corrigée', 58.57),
               ('loyer_montant_incorrect', 'Loyer au mauvais montant · 1180, Cartier — 6', timestamptz '2025-11-28 10:00-05', v_mt, 'Écart réglé', 520.00),
               ('loyer_montant_incorrect', 'Loyer au mauvais montant · 2880, ch. Sainte-Foy — 4', timestamptz '2025-11-04 10:00-05', v_jn, 'Écart réglé', 525.00)) as a(t, d, le, par, note, rec);
  raise notice 'Rapprochement et anomalies créés.';
end $$;

-- ── 7. Ventes : pipelines Mandats (l05) et Location (e12), leads entrants (l07) ──
do $$
declare
  v_lp uuid := (select user_id from crm.team_members where display_name = 'Laurence Pelletier');
  v_cd uuid := (select user_id from crm.team_members where display_name = 'Camille Desrosiers');
  v_jn uuid := (select user_id from crm.team_members where display_name = 'Julie Normandeau');
  v_ad uuid := (select user_id from crm.team_members where display_name = 'Admin Démo');
  r record; v_deal uuid; v_contact uuid; v_stage uuid; v_pl uuid; v_unite uuid;
begin
  if exists (select 1 from crm.deals where title = 'Placements Gauthier') then raise notice 'Ventes déjà présentes.'; return; end if;
  insert into crm.sources (code, name) values ('marketplace', 'Marketplace'), ('kijiji', 'Kijiji') on conflict (code) do nothing;
  for r in select * from (values
    -- pipeline, étape (sort), titre, sous-titre, portes, $/mois, source, responsable, entré dans l'étape il y a (heures), créé il y a (heures), logement (location)
    ('mandats', 1, 'Gestion Bélanger', '12 portes · Saint-Roch', 12, 855, 'site', 'LP', 4, 4, null),
    ('mandats', 1, 'Placements Gauthier', '8 portes · Lévis', 8, 570, 'prospection_ia', 'LP', 120, 120, null),
    ('mandats', 1, 'Famille Nguyen', '3 portes · Beauport', 3, 215, 'reference', 'CD', 72, 72, null),
    ('mandats', 1, 'Duplex Tremblay', '2 portes · Montcalm', 2, 145, 'cleo', 'CD', 5, 5, null),
    ('mandats', 1, 'Marc Fortier', 'Immeuble 5 portes', 5, 360, 'site', null, 1, 1, null),
    ('mandats', 3, 'Investissements Roy', '6 portes · Limoilou', 6, 430, 'courriel', 'JN', 30, 400, null),
    ('mandats', 3, 'Immeubles Fortier', '24 portes · Sainte-Foy', 24, 1710, 'reference', 'AD', 144, 500, null),
    ('mandats', 3, 'Société Lacasse', '18 portes · Charlesbourg', 18, 1285, 'prospection_ia', 'LP', 48, 300, null),
    ('mandats', 3, 'Gestion Côté-Simard', '9 portes · Vanier', 9, 640, 'site', 'CD', 96, 350, null),
    ('mandats', 5, 'Placements Morin', '6 portes · Lévis', 6, 430, 'reference', 'JN', 480, 900, null),
    ('mandats', 5, 'Pierre Bouchard', '+4 portes · Saint-Roch', 4, 285, 'client_existant', 'JN', 200, 700, null),
    ('mandats', 6, 'Immeubles Lapointe', '4 portes · Beauport', 4, 285, 'site', 'LP', 100, 600, null),
    ('location', 1, 'Olivier Bergeron', '4½ · 640, 3e Av. — 4', null, 1450, 'kijiji', 'LP', 48, 48, '640, 3e Avenue, Québec|4'),
    ('location', 1, 'Thomas Lévesque', '5½ · 2880, ch. Sainte-Foy — 6', null, 1790, 'marketplace', 'LP', 6, 6, '2880, chemin Sainte-Foy, Québec|3'),
    ('location', 1, 'Chloé Girard', '3½ · 1180, Cartier — 2', null, 1195, 'site', 'CD', 3, 3, '1180, avenue Cartier, Québec|2'),
    ('location', 2, 'Jade Ouellet', '3½ · 1180, Cartier — 2', null, 1195, 'site', 'CD', 30, 60, '1180, avenue Cartier, Québec|2'),
    ('location', 2, 'Antoine Lachance', '5½ · 2880, ch. Sainte-Foy — 6', null, 1790, 'marketplace', 'LP', 26, 70, '2880, chemin Sainte-Foy, Québec|3'),
    ('location', 2, 'Émilie Gagnon', '4½ · 640, 3e Av. — 4', null, 1450, 'cleo', 'CD', 3, 3, '640, 3e Avenue, Québec|4'),
    ('location', 3, 'Gabriel Tremblay', '4½ · 640, 3e Av. — 4', null, 1450, 'site', 'CD', 50, 140, '640, 3e Avenue, Québec|4'),
    ('location', 3, 'Noémie Cloutier', '3½ · 1180, Cartier — 2', null, 1195, 'reference', 'CD', 40, 160, '1180, avenue Cartier, Québec|2'),
    ('location', 5, 'William Fournier', '4½ · 420, Saint-Joseph E. — 5', null, 1240, 'site', 'CD', 330, 500, '420, rue Saint-Joseph Est, Québec|5')
  ) as x(pipe, etape, titre, sous, portes, valeur, source, resp, h_etape, h_cree, logement)
  loop
    -- Deal déjà là (lié à un prospect et aux propositions de seed-propositions-maquettes) : aligné sur la maquette, pas recréé
    if exists (select 1 from crm.deals where title = r.titre and merged_into is null) then
      update crm.deals set subtitle = r.sous, doors = r.portes, monthly_value_cents = r.valeur * 100, source_id = (select id from crm.sources where code = r.source),
        owner_user_id = case r.resp when 'LP' then v_lp when 'CD' then v_cd when 'JN' then v_jn when 'AD' then v_ad else owner_user_id end
      where title = r.titre and merged_into is null;
      continue;
    end if;
    select id into v_pl from crm.pipelines where code = r.pipe;
    select id into v_stage from crm.stages where pipeline_id = v_pl and sort = r.etape;
    v_unite := null;
    if r.logement is not null then
      select u.id into v_unite from public.units u join public.buildings b on b.id = u.building_id where b.address = split_part(r.logement, '|', 1) and u.unit_number = split_part(r.logement, '|', 2);
    end if;
    insert into crm.contacts (kind, full_name, emails, phones_e164, language, company, created_at)
    values (case when r.titre ~ '^(Gestion|Placements|Immeubles|Investissements|Société)' then 'entreprise' else 'personne' end, r.titre,
            array[lower(translate(replace(r.titre, ' ', '.'), 'éèêëàâîïôöûüçÉÈ', 'eeeeaaiioouuceE')) || '@courriel.test'],
            array['+1418556' || lpad((abs(hashtext(r.titre)) % 9000 + 1000)::text, 4, '0')], 'fr', null, now() - make_interval(hours => r.h_cree))
    returning id into v_contact;
    insert into crm.deals (pipeline_id, stage_id, title, subtitle, source_id, owner_user_id, monthly_value_cents, doors, unit_id, created_at, updated_at,
                           loss_reason_code, close_date, converted_at, converted_owner_id)
    values (v_pl, v_stage, r.titre, r.sous, (select id from crm.sources where code = r.source),
            case r.resp when 'LP' then v_lp when 'CD' then v_cd when 'JN' then v_jn when 'AD' then v_ad end,
            r.valeur * 100, r.portes, v_unite, now() - make_interval(hours => r.h_cree), now() - make_interval(hours => r.h_etape),
            case when r.etape = 6 then 'prix' end, case when r.etape >= 5 then (now() - make_interval(hours => r.h_etape))::date end,
            case when r.etape = 5 then now() - make_interval(hours => r.h_etape) end,
            case when r.titre = 'Placements Morin' then (select id from public.owners where company_name = 'Placements Morin')
                 when r.titre = 'Pierre Bouchard' then (select id from public.owners where full_name = 'Pierre Bouchard') end)
    returning id into v_deal;
    insert into crm.deal_contacts (deal_id, contact_id, role) values (v_deal, v_contact, 'Contact principal');
    insert into crm.deal_stage_history (deal_id, stage_id, entered_at, actor_kind) values (v_deal, v_stage, now() - make_interval(hours => r.h_etape), 'system');
  end loop;
  -- Prochaines actions affichées sur les cartes (e12, l05)
  insert into crm.tasks (title, deal_id, due_at, assignee_user_id, status)
  select t, d.id, now() + make_interval(hours => h), d.owner_user_id, 'open'
  from (values ('Proposition', 'Investissements Roy', -216), ('Visite mardi 17 h 30', 'Jade Ouellet', 30), ('Visite mercredi 18 h', 'Antoine Lachance', 55),
               ('Visite jeudi 10 h', 'Émilie Gagnon', 72), ('Enquête de crédit à approuver', 'Gabriel Tremblay', 4), ('Attend sa preuve de revenu', 'Noémie Cloutier', 24)) as x(t, titre, h)
  join crm.deals d on d.title = x.titre;
  raise notice 'Pipelines de vente créés.';
end $$;

-- ── 8. Cession au 2880, ch. Sainte-Foy — 1 (e19, e23) : jour 5 sur 15, réponse du propriétaire attendue ──
do $$
declare v_bail uuid; v_owner uuid; v_loc uuid;
begin
  if exists (select 1 from crm.assignments where person_name = 'Mélanie Roy') then return; end if;
  select l.id, b.owner_id, l.tenant_id into v_bail, v_owner, v_loc from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
  where b.address = '2880, chemin Sainte-Foy, Québec' and u.unit_number = '1' and l.status = 'active';
  insert into crm.assignments (kind, lease_id, tenant_id, owner_id, person_name, person_email, person_phone, person_job, person_income, start_date, source, status,
                               received_at, deadline_at, owner_requested_at, created_at)
  values ('cession', v_bail, v_loc, v_owner, 'Mélanie Roy', 'melanie.roy@courriel.test', '418 555-0190', 'Infirmière', '62 000 $', date '2026-12-01', 'portail', 'accord_proprietaire',
          now() - interval '5 days', now() + interval '10 days', now() - interval '2 days', now() - interval '5 days');
end $$;

-- ── 9. Marie-Josée Bérubé : cliente depuis 2021 (e19), baux commencés à des années différentes (e21 « depuis juill. 2023 »);
--       le bail de Samuel Fortin (démo du portail locataire) ne bouge pas ──
update public.owners set created_at = timestamptz '2021-04-12 10:00-04' where full_name = 'Marie-Josée Bérubé' and created_at > timestamptz '2026-01-01';
update public.leases l set start_date = make_date(2019 + (abs(hashtext(t.full_name)) % 7), 7, 1)
from public.tenants t, public.units u, public.buildings b, public.owners o
where t.id = l.tenant_id and u.id = l.unit_id and b.id = u.building_id and o.id = b.owner_id and o.full_name = 'Marie-Josée Bérubé'
  and t.full_name <> 'Samuel Fortin' and l.start_date = date '2026-07-01';

-- ── Déclencheurs rétablis ──
alter table public.units enable trigger on_unit_listing_change;
alter table public.service_requests enable trigger on_service_request_insert;
alter table public.service_requests enable trigger notif_proprio_urgence;
alter table public.work_orders enable trigger on_work_order_worker_assigned;
alter table public.work_orders enable trigger notif_urgence;
alter table public.work_orders enable trigger notif_locataire;
alter table public.payments enable trigger notif_locataire;
alter table public.leases enable trigger bail_cree_emmenagement;
alter table crm.deals enable trigger notif_nouveau_deal;

select (select count(*) from public.owners) proprietaires, (select count(*) from public.buildings) immeubles, (select count(*) from public.units) logements,
       (select count(*) from public.leases where status = 'active') baux, (select count(*) from public.work_orders) bons, (select count(*) from public.workers) fournisseurs,
       (select count(*) from public.bank_transactions) operations, (select count(*) from crm.deals) deals;

commit;
