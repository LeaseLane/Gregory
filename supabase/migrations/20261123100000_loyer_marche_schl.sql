-- Immeubles · « loyer vs marché » (retour de Greg, 23 nov. 2026 : « elle prend mes 2 loyers de même grosseur et fait une moyenne »).
-- Avant : crm.mediane_loyer = médiane des logements de LeaseLane de la même zone et du même type (2 logements suffisaient) : le « marché »
-- d'un client était ses propres loyers, et l'agent de mise en marché proposait de baisser un loyer demandé vers ce chiffre.
-- Maintenant : la référence est le loyer moyen de l'Enquête sur les logements locatifs de la SCHL (octobre 2025, RMR de Québec,
-- par zone et nombre de chambres), cote de fiabilité a à c seulement (d « à utiliser avec prudence » et ** écartés).
-- Le parc de LeaseLane ne sert plus jamais de « marché ». Sans zone SCHL connue pour l'immeuble : aucune référence (pas de chiffre inventé).
-- La SCHL mesure les loyers de tous les baux en cours (y compris les anciens) : c'est un repère, pas un loyer demandé pour un nouveau bail;
-- l'agent de mise en marché ne propose donc plus de loyer, seulement des canaux gratuits.
-- Source : https://www03.cmhc-schl.gc.ca/hmip-pimh/en/TableMapChart/Table?TableId=2.1.11.3&GeographyId=1400&GeographyTypeId=3 (lu le 23 nov. 2026).

create table if not exists crm.loyers_marche (
  zone_schl text not null, chambres text not null check (chambres in ('studio', '1', '2', '3+')), loyer numeric(8,2) not null, fiabilite text not null check (fiabilite in ('a', 'b', 'c', 'd')),
  periode text not null, source text not null, primary key (zone_schl, chambres, periode));
create table if not exists crm.zones_schl (zone text primary key, zone_schl text not null, note text);
alter table crm.loyers_marche enable row level security; alter table crm.zones_schl enable row level security;
revoke all on crm.loyers_marche, crm.zones_schl from public, anon, authenticated;

insert into crm.loyers_marche (zone_schl, chambres, loyer, fiabilite, periode, source)
select z, c, l, f, 'octobre 2025', 'SCHL, Enquête sur les logements locatifs, RMR de Québec' from (values
  ('Haute-Ville', 'studio', 903, 'b'), ('Haute-Ville', '1', 1192, 'a'), ('Haute-Ville', '2', 1564, 'b'), ('Haute-Ville', '3+', 1673, 'b'),
  ('Basse-Ville', 'studio', 778, 'b'), ('Basse-Ville', '1', 983, 'b'), ('Basse-Ville', '2', 1223, 'b'), ('Basse-Ville', '3+', 1373, 'c'),
  ('Sainte-Foy-Sillery', 'studio', 904, 'b'), ('Sainte-Foy-Sillery', '1', 1130, 'a'), ('Sainte-Foy-Sillery', '2', 1421, 'a'), ('Sainte-Foy-Sillery', '3+', 1556, 'a'),
  ('Les Rivières', 'studio', 797, 'c'), ('Les Rivières', '1', 1298, 'b'), ('Les Rivières', '2', 1427, 'b'), ('Les Rivières', '3+', 1573, 'b'),
  ('Beauport', 'studio', 751, 'b'), ('Beauport', '1', 1037, 'b'), ('Beauport', '2', 1250, 'b'), ('Beauport', '3+', 1379, 'b'),
  ('Charlesbourg', 'studio', 747, 'b'), ('Charlesbourg', '1', 925, 'b'), ('Charlesbourg', '2', 1052, 'a'), ('Charlesbourg', '3+', 1268, 'b'),
  ('Haute-Saint-Charles', 'studio', 760, 'd'), ('Haute-Saint-Charles', '1', 990, 'b'), ('Haute-Saint-Charles', '2', 1116, 'b'), ('Haute-Saint-Charles', '3+', 1403, 'b'),
  ('Val-Bélair-L''Ancienne-Lorette', 'studio', 639, 'd'), ('Val-Bélair-L''Ancienne-Lorette', '1', 992, 'b'), ('Val-Bélair-L''Ancienne-Lorette', '2', 1149, 'b'), ('Val-Bélair-L''Ancienne-Lorette', '3+', 1280, 'b'),
  ('Saint-Augustin-Cap-Rouge', 'studio', 1021, 'a'), ('Saint-Augustin-Cap-Rouge', '1', 1334, 'a'), ('Saint-Augustin-Cap-Rouge', '2', 1610, 'a'), ('Saint-Augustin-Cap-Rouge', '3+', 1669, 'a'),
  ('Couronne nord', '1', 963, 'c'), ('Couronne nord', '2', 1428, 'c'), ('Couronne nord', '3+', 1480, 'b'),
  ('Rive-Sud (ouest)', 'studio', 998, 'c'), ('Rive-Sud (ouest)', '1', 1254, 'b'), ('Rive-Sud (ouest)', '2', 1300, 'b'), ('Rive-Sud (ouest)', '3+', 1543, 'b'),
  ('Rive-Sud (centre)', 'studio', 955, 'b'), ('Rive-Sud (centre)', '1', 1113, 'a'), ('Rive-Sud (centre)', '2', 1188, 'a'), ('Rive-Sud (centre)', '3+', 1357, 'b'),
  ('Rive-Sud (est)', 'studio', 689, 'd'), ('Rive-Sud (est)', '1', 1049, 'b'), ('Rive-Sud (est)', '2', 1130, 'a'), ('Rive-Sud (est)', '3+', 1350, 'c')
) v(z, c, l, f) on conflict do nothing;

-- Quartiers dont la zone SCHL est sûre. Lévis chevauche trois zones de la Rive-Sud : non relié tant qu'on ne choisit pas par immeuble.
insert into crm.zones_schl (zone, zone_schl, note) values
  ('limoilou', 'Basse-Ville', null), ('maizeret', 'Basse-Ville', 'quartier de Limoilou'), ('saint-roch', 'Basse-Ville', null), ('saint-sauveur', 'Basse-Ville', null),
  ('montcalm', 'Haute-Ville', null), ('saint-jean-baptiste', 'Haute-Ville', null), ('vieux-québec', 'Haute-Ville', null),
  ('sainte-foy', 'Sainte-Foy-Sillery', null), ('sillery', 'Sainte-Foy-Sillery', null), ('beauport', 'Beauport', null), ('charlesbourg', 'Charlesbourg', null)
on conflict (zone) do nothing;

create or replace function crm.chambres_logement(p_type text) returns text language sql immutable set search_path = '' as $$
  select case when p_type ~ '^\s*[12]\s*(1/2|½)' then 'studio' when p_type ~ '^\s*3\s*(1/2|½)' then '1' when p_type ~ '^\s*4\s*(1/2|½)' then '2'
              when p_type ~ '^\s*([5-9]|1[0-9])\s*(1/2|½)' then '3+' end;
$$;

-- Nom gardé (appelée par Logements, la fiche d'immeuble et la mise en marché) : rend maintenant le loyer moyen SCHL, jamais une médiane du parc.
create or replace function crm.mediane_loyer(p_zone text, p_type text) returns numeric language sql stable security definer set search_path = '' as $$
  select m.loyer from crm.zones_schl z join crm.loyers_marche m on m.zone_schl = z.zone_schl and m.chambres = crm.chambres_logement(p_type) and m.fiabilite in ('a', 'b', 'c')
   where z.zone = lower(btrim(p_zone)) order by m.periode desc limit 1;
$$;

-- Mise en marché : plus de loyer proposé (la SCHL n'est pas un loyer demandé), seulement les canaux gratuits; la raison cite la SCHL.
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('crm.proposer_annonces()'::regprocedure);
  if position('SCHL' in d) > 0 then return; end if;
  n := replace(d, 'if v_med is not null and r.loyer > v_med then v_after := jsonb_build_object(''rent'', v_med); end if;', '');
  n := replace(n, ' se louent '' || comms.montant_court(v_med) || '' en médiane.''', ' se louent '' || comms.montant_court(v_med) || '' en moyenne (SCHL, octobre 2025).''');
  if n = d or position('jsonb_build_object(''rent''' in n) > 0 then raise exception 'crm.proposer_annonces : ancre introuvable'; end if;
  execute n;
end $$;
