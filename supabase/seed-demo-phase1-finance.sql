-- ============================================================
-- Démo (PRÉPRODUCTION SEULEMENT) : finances fictives cohérentes pour la phase 1 (plan du 12 nov. 2026, « fiches fictives » avant l'accès de Frank)
-- ============================================================
-- La tâche de nuit crée les loyers du mois, mais personne ne les paie dans la démo : tout paraît en retard (212 loyers le 2026-11-13).
-- Ce jeu remet la démo dans un état vraisemblable, sans rien supprimer :
--   1. loyers échus marqués payés, sauf environ 7 % des baux (retard du mois courant seulement) et les baux qui ont un dossier juridique ouvert;
--   2. revenus de stationnement et de buanderie des 6 derniers mois sur les immeubles de 6 logements et plus;
--   3. dépenses courantes sur trois immeubles de Marie-Josée Bérubé, une dépense inhabituelle et un immeuble au flux de trésorerie négatif,
--      pour que les alertes de Finances › Vue d'ensemble aient de quoi montrer.
-- Les dépenses du jeu se reconnaissent à leur fournisseur fictif (Entretien Laurentides inc., Plomberie Cartier ltée, Toitures de la Capitale inc.).
-- Rejouable (chaque mois) : ne crée rien deux fois. Aucune notification aux locataires (déclencheur suspendu le temps du jeu).
-- Usage : supabase db query --linked --project-ref <préproduction> -f supabase/seed-demo-phase1-finance.sql
-- ============================================================
begin;
do $$ begin
  if not exists (select 1 from public.owners where full_name = 'Marie-Josée Bérubé') then raise exception 'Pas la base de démonstration : refusé.'; end if;
  if (select count(*) from public.owners) > 40 then raise exception 'Trop de propriétaires pour une base de démonstration : refusé.'; end if;
end $$;

alter table public.payments disable trigger notif_locataire;
-- 1. Loyers. « En retard » voulu : 7 baux sur 100 (stable d'un jeu à l'autre), pour le mois courant seulement.
update public.payments pa set status = 'paid', paid_date = least(pa.due_date + (abs(hashtext(pa.id::text)) % 4), current_date), amount_received = pa.amount
from public.leases l
where l.id = pa.lease_id and pa.status <> 'paid' and pa.due_date <= current_date and pa.collection_status is distinct from 'failed'
  and not exists (select 1 from jur.cases c where c.lease_id = l.id and c.stage in ('ouvert', 'mise_en_demeure', 'tal'))
  and (abs(hashtext(l.id::text)) % 100 >= 7 or pa.due_date < date_trunc('month', current_date));
alter table public.payments enable trigger notif_locataire;

-- 2. Stationnement et buanderie : une ligne par immeuble, par mois et par type.
insert into fin.autres_revenus (building_id, type, montant, le, note)
select b.id, x.type, case x.type when 'stationnement' then 45 * greatest(1, round(n.logements * 0.4)) else 9 * n.logements end, (m + interval '4 days')::date, 'Démonstration'
from public.buildings b join lateral (select count(*) logements from public.units u where u.building_id = b.id) n on n.logements >= 6
cross join generate_series(date_trunc('month', current_date) - interval '5 months', date_trunc('month', current_date), interval '1 month') m
cross join (values ('stationnement'), ('buanderie')) x(type)
where (m + interval '4 days')::date <= current_date and (x.type = 'stationnement' or abs(hashtext(b.id::text)) % 2 = 0)
  and not exists (select 1 from fin.autres_revenus a where a.building_id = b.id and a.type = x.type and date_trunc('month', a.le) = m);

-- 3. Dépenses : entretien courant (5 mois d'historique), puis ce mois-ci un chauffe-eau (inhabituel) et un acompte de toiture (flux négatif).
insert into public.payables (owner_id, building_id, vendor_name, description, amount, category, due_date, status, approved_at)
select b.owner_id, b.id, 'Entretien Laurentides inc.', 'Entretien paysager et déneigement — ' || to_char(m, 'YYYY-MM') || '', 340 + (abs(hashtext(b.id::text || m::text)) % 140), 'entretien', (m + interval '14 days')::date, 'paid', m + interval '10 days'
from public.buildings b join public.owners o on o.id = b.owner_id
cross join generate_series(date_trunc('month', current_date) - interval '5 months', date_trunc('month', current_date) - interval '1 month', interval '1 month') m
where o.full_name = 'Marie-Josée Bérubé' and b.address in ('1180, avenue Cartier, Québec', '640, 3e Avenue, Québec', '41, rue des Roseaux, Québec')
  and not exists (select 1 from public.payables p where p.building_id = b.id and p.description = 'Entretien paysager et déneigement — ' || to_char(m, 'YYYY-MM') || '');
insert into public.payables (owner_id, building_id, vendor_name, description, amount, category, due_date, status, approved_at)
select b.owner_id, b.id, x.fournisseur, x.description || ' — ' || to_char(current_date, 'YYYY-MM') || '', x.montant, 'entretien', least(date_trunc('month', current_date)::date + 8, current_date), 'approved', now()
from public.buildings b join public.owners o on o.id = b.owner_id
join (values ('640, 3e Avenue, Québec', 'Plomberie Cartier ltée', 'Remplacement du chauffe-eau commun', 3200), ('41, rue des Roseaux, Québec', 'Toitures de la Capitale inc.', 'Réfection de la toiture, acompte', 6800)) x(adresse, fournisseur, description, montant) on x.adresse = b.address
where o.full_name = 'Marie-Josée Bérubé'
  and not exists (select 1 from public.payables p where p.building_id = b.id and p.description = x.description || ' — ' || to_char(current_date, 'YYYY-MM') || '');
commit;
