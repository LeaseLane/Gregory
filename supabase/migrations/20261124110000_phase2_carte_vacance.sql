-- Phase 2 · carte des taux de vacance (plan du 13 nov. 2026 : « carte des taux de vacance par secteur pour cibler la publicité »).
-- Source : SCHL, Enquête sur les logements locatifs, octobre 2025, tableau 2.1.31.3 (RMR de Québec et RMR de Montréal, par zone), lu le 23 nov. 2026.
-- Fiabilité a (très bonne) à d (à utiliser avec prudence). Taux non publié par la SCHL (**) : vacance nulle, jamais un chiffre inventé.
-- La SCHL n'a pas de zone « Limoilou » : il est compris dans Haute-Ville et Basse-Ville.
create table if not exists crm.vacance_schl (
  region text not null, zone text not null, vacance numeric(4,1), fiabilite text check (fiabilite in ('a', 'b', 'c', 'd')), loyer_moyen int, logements int,
  periode text not null default 'octobre 2025', source text not null default 'SCHL, Enquête sur les logements locatifs, tableau 2.1.31.3', primary key (region, zone));
alter table crm.vacance_schl enable row level security;
revoke all on crm.vacance_schl from public, anon, authenticated;
insert into crm.vacance_schl (region, zone, vacance, fiabilite, loyer_moyen, logements) values
  ('RMR de Québec', 'Québec', 2.4, 'a', 1226, 119528),
  ('RMR de Québec', 'Haute-Ville', 2.9, 'b', 1332, 10571),
  ('RMR de Québec', 'Basse-Ville', 2.7, 'c', 1140, 17868),
  ('RMR de Québec', 'Sainte-Foy-Sillery', null, null, 1264, 22670),
  ('RMR de Québec', 'Les Rivières', 2.6, 'b', 1391, 18025),
  ('RMR de Québec', 'Beauport', 3.4, 'd', 1198, 9633),
  ('RMR de Québec', 'Charlesbourg', 0.4, 'b', 1038, 11383),
  ('RMR de Québec', 'Haute-Saint-Charles', 1.5, 'a', 1115, 4372),
  ('RMR de Québec', 'Val-Bélair-L''Ancienne-Lorette', 1.0, 'd', 1139, 3396),
  ('RMR de Québec', 'Saint-Augustin-Cap-Rouge', 1.8, 'a', 1512, 1617),
  ('RMR de Québec', 'Northern Surrounding Area', 3.1, 'd', 1353, 641),
  ('RMR de Québec', 'South Shore (West)', 4.7, 'd', 1340, 4181),
  ('RMR de Québec', 'South Shore (Centre)', 3.8, 'c', 1191, 6004),
  ('RMR de Québec', 'South Shore (East)', 2.6, 'b', 1121, 9167),
  ('RMR de Montréal', 'Montréal', 2.9, 'a', 1291, 668834),
  ('RMR de Montréal', 'Downtown Montréal/Îles-des-Soeurs', 6.4, 'c', 1668, 33048),
  ('RMR de Montréal', 'Sud-Ouest/Verdun', null, null, 1331, 32945),
  ('RMR de Montréal', 'LaSalle', 1.6, 'b', 1284, 20438),
  ('RMR de Montréal', 'ND-de-Grâce/Ct-St-Luc etc.', 4.0, 'b', 1306, 29168),
  ('RMR de Montréal', 'Ct-des-Neiges/Mt-Royal/Outremont', 2.9, 'c', 1272, 42660),
  ('RMR de Montréal', 'Plateau-Mont-Royal', 4.2, 'd', 1433, 40603),
  ('RMR de Montréal', 'Villeray/St-Michel/Pc-Extension', null, null, 1243, 41580),
  ('RMR de Montréal', 'Hochelaga-Maisonneuve', 4.5, 'd', 1308, 29721),
  ('RMR de Montréal', 'Rosemont/La Petite-Patrie', null, null, 1237, 44560),
  ('RMR de Montréal', 'Anjou/Saint-Léonard', null, null, 1090, 28085),
  ('RMR de Montréal', 'Montréal-Nord', 0.7, 'a', 1150, 22556),
  ('RMR de Montréal', 'Ahuntsic/Cartierville', null, null, 1095, 30779),
  ('RMR de Montréal', 'Saint-Laurent', 4.0, 'c', 1270, 17790),
  ('RMR de Montréal', 'Dorval/Lachine/Saint-Pierre', 4.3, 'd', 1137, 11610),
  ('RMR de Montréal', 'Baie-d''Urfé/Beaconsfield etc.', 4.0, 'd', 1636, 5408),
  ('RMR de Montréal', 'Sainte-Geneviève/Senneville etc.', 2.6, 'b', 1334, 10777),
  ('RMR de Montréal', 'Mercier', 1.1, 'a', null, 20544),
  ('RMR de Montréal', 'Pte-aux-Trembles/Montréal-E etc.', null, null, 1295, 11195),
  ('RMR de Montréal', 'Chomedey/Sainte-Dorothée', 4.7, 'd', 1483, 15836),
  ('RMR de Montréal', 'Laval-des-Rapides', 2.4, 'b', 1223, 9781),
  ('RMR de Montréal', 'Pont-Viau', null, null, 1128, 2653),
  ('RMR de Montréal', 'St-François/St-Vincent/Duvernay', 2.1, 'c', 1130, 2851),
  ('RMR de Montréal', 'Vimont/Auteuil', 4.0, 'd', 1419, 3802),
  ('RMR de Montréal', 'Laval-Ouest/Fabreville/Ste-Rose', 2.0, 'c', 1326, 2921),
  ('RMR de Montréal', 'Mirabel/Oka/Pointe-Calumet etc.', null, null, 1324, 13513),
  ('RMR de Montréal', 'Blainville/Ste-Thérèse etc.', 1.6, 'c', 1289, 15295),
  ('RMR de Montréal', 'Mascouche/Terrebonne etc.', 4.2, 'd', 1508, 12879),
  ('RMR de Montréal', 'L''Assomption/Lavaltrie etc.', null, null, 1212, 8875),
  ('RMR de Montréal', 'St-Jérôme/Gore/St-Colomban etc.', 0.8, 'a', 1123, 15380),
  ('RMR de Montréal', 'Longueuil', 1.5, 'c', 1236, 24455),
  ('RMR de Montréal', 'Boucherville/Brossard etc.', 4.1, 'd', 1400, 21481),
  ('RMR de Montréal', 'Beauharnois/La Prairie/Léry etc.', 3.3, 'd', 1430, 13236),
  ('RMR de Montréal', 'Beloeil/McMasterville etc.', 1.9, 'c', 1429, 7291),
  ('RMR de Montréal', 'Carignan/Chambly/St-Mathias etc.', null, null, 1488, 4173),
  ('RMR de Montréal', 'ND-de-L''île-Perrot/Pincourt etc.', 1.9, 'c', 1326, 4617),
  ('RMR de Montréal', 'Saint-Jean', null, null, 1062, 10409),
  ('RMR de Montréal', 'Iberville', 0.6, 'b', 1081, 1867),
  ('RMR de Montréal', 'Saint-Luc', 0.6, 'b', 1117, 2093),
  ('RMR de Montréal', 'Saint-Lin-Laurentides/Saint-Roch-de-l''Achigan', 2.3, 'c', 1040, 1959)
on conflict (region, zone) do update set vacance = excluded.vacance, fiabilite = excluded.fiabilite, loyer_moyen = excluded.loyer_moyen, logements = excluded.logements;

create or replace function public.lanceur_vacance() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  return jsonb_build_object('periode', 'octobre 2025', 'source', 'SCHL, Enquête sur les logements locatifs',
    'zones', coalesce((select jsonb_agg(jsonb_build_object('region', region, 'zone', zone, 'vacance', vacance, 'fiabilite', fiabilite, 'loyer', loyer_moyen, 'logements', logements)
                                        order by region, vacance desc nulls last, zone) from crm.vacance_schl), '[]'::jsonb));
end $$;
revoke all on function public.lanceur_vacance() from public, anon;
grant execute on function public.lanceur_vacance() to authenticated;
