-- Studio · Campagnes et Sources de démonstration (maquettes l17, e53), PRÉPRODUCTION SEULEMENT. Rejouable.
-- Aucun lead inventé : les deals déjà présents sont rattachés à trois campagnes et à leur page d'arrivée (les écrans Ventes ne changent pas).
-- Ajoute les dépenses des 90 derniers jours, les budgets mensuels et deux propositions de Cléo en attente.
\set ON_ERROR_STOP on
begin;
do $$ begin
  if not exists (select 1 from public.owners where full_name = 'Marie-Josée Bérubé') then raise exception 'Pas la base de démonstration : refusé.'; end if;
end $$;

insert into crm.campagnes (nom, canaux, source_id, statut, budget_cents, cout_vise_cents, page, utm_campaign, debut) values
  ('Propriétaires Limoilou', 'Google Ads et courriel', (select id from crm.sources where code = 'google_ads'), 'active', 50000, 1500, '/quartiers/limoilou', 'proprietaires-limoilou', current_date - 84),
  ('Locataires Saint-Roch', 'Marketplace et Meta', (select id from crm.sources where code = 'marketplace'), 'active', 40000, 1200, '/logements-a-louer', 'locataires-saint-roch', current_date - 84),
  ('Lévis · lancement', 'Meta', (select id from crm.sources where code = 'meta'), 'pause', 15000, 1800, '/levis', 'levis-lancement', current_date - 50)
on conflict (utm_campaign) do nothing;

-- Rattacher les deals existants (sans toucher leur source ni leur date)
update crm.deals d set campagne_id = (select id from crm.campagnes where utm_campaign = 'proprietaires-limoilou'), page_arrivee = '/quartiers/limoilou'
from crm.pipelines p, crm.sources s where p.id = d.pipeline_id and s.id = d.source_id and p.code = 'mandats' and d.campagne_id is null
  and (s.code in ('autre', 'courriel', 'appel_sortant') or s.code like 'csv:%');
update crm.deals d set campagne_id = (select id from crm.campagnes where utm_campaign = 'locataires-saint-roch'), page_arrivee = '/logements-a-louer'
from crm.pipelines p where p.id = d.pipeline_id and p.code = 'location' and d.campagne_id is null
  and (d.source_id is null or d.source_id in (select id from crm.sources where code in ('marketplace', 'kijiji', 'autre')));
update crm.deals d set campagne_id = (select id from crm.campagnes where utm_campaign = 'levis-lancement'), page_arrivee = '/levis'
from crm.pipelines p where p.id = d.pipeline_id and p.code = 'location' and d.campagne_id is null and d.source_id in (select id from crm.sources where code in ('reference', 'cleo'));
update crm.deals d set page_arrivee = (array['/gestion-immobiliere-quebec', '/gestion-immobiliere-quebec', '/evaluation-gratuite', '/gestion-immobiliere-quebec', '/evaluation-gratuite', '/quartiers/limoilou'])[1 + (x.rn - 1) % 6]
from (select d2.id, row_number() over (order by d2.created_at) rn from crm.deals d2 join crm.sources s on s.id = d2.source_id where s.code = 'site' and d2.page_arrivee is null) x
where d.id = x.id;

-- Dépenses des 90 derniers jours (saisies, aucune régie branchée) : totaux de la maquette e53, et le mois en cours de la maquette l17
do $$
declare r record; k int;
begin
  if exists (select 1 from crm.depenses_marketing) then raise notice 'Dépenses de démonstration déjà présentes.'; return; end if;
  for r in select * from (values
    ('proprietaires-limoilou', 'google_ads', 29820, 112180), ('locataires-saint-roch', 'marketplace', 8820, 30180), ('levis-lancement', 'meta', 12600, 48400),
    (null, 'site', 0, 135000), (null, 'prospection_ia', 0, 12000)) v(utm, src, mois, avant) loop
    for k in 0..3 loop
      if r.mois > 0 then insert into crm.depenses_marketing (source_id, campagne_id, jour, cents, note)
        values ((select id from crm.sources where code = r.src), (select id from crm.campagnes where utm_campaign = r.utm),
                greatest(date_trunc('month', current_date)::date, current_date - 7 * k), r.mois / 4 + case when k = 0 then r.mois % 4 else 0 end, 'Facture de la régie (fictive)'); end if;
      insert into crm.depenses_marketing (source_id, campagne_id, jour, cents, note)
      values ((select id from crm.sources where code = r.src), (select id from crm.campagnes where utm_campaign = r.utm),
              date_trunc('month', current_date)::date - 1 - 18 * k, r.avant / 4 + case when k = 0 then r.avant % 4 else 0 end,
              case r.src when 'site' then 'Rédaction et référencement (fictif)' when 'prospection_ia' then 'Appels d’IA de prospection (fictif)' else 'Facture de la régie (fictive)' end);
    end loop;
  end loop;
end $$;
update crm.sources set budget_mensuel_cents = v.b from (values ('google_ads', 60000), ('meta', 20000), ('marketplace', 15000)) v(code, b) where crm.sources.code = v.code and budget_mensuel_cents is null;

-- Propositions de Cléo en attente (passent par « À approuver »)
select (crm.create_proposal(jsonb_build_object('agent', 'cleo', 'operation', 'adjust-campaign', 'target_id', (select id from crm.campagnes where utm_campaign = 'levis-lancement'),
  'after', jsonb_build_object('statut', 'active', 'budget_cents', 15000, 'cout_vise_cents', 1800, 'arret_cents', 2500, 'ciblage', '18 à 34 ans, à 10 km du traversier', 'fin', current_date + 14),
  'reason', 'Les 2½ et 3½ de Lévis se louent en 9 jours, mais la campagne coûte 31,50 $ par lead. Je propose un ciblage plus serré : 18 à 34 ans, à 10 km du traversier.',
  'source_type', 'systeme', 'confidence', 82, 'idempotency_key', 'demo-studio-levis'))).id campagne;
select (crm.create_proposal(jsonb_build_object('agent', 'cleo', 'operation', 'adjust-source-budget', 'target_id', (select id from crm.sources where code = 'meta'),
  'after', jsonb_build_object('budget_mensuel_cents', 0, 'transfert_vers', 'google_ads'),
  'reason', 'Déplacer les 200 $ par mois de Meta vers Google Ads : Meta n’a signé aucun mandat en 90 jours.',
  'source_type', 'systeme', 'confidence', 78, 'idempotency_key', 'demo-studio-meta'))).id source;

-- Vérification : les deux lectures, vues par Admin Démo
select set_config('request.jwt.claims', jsonb_build_object('sub', (select id from auth.users where email = 'equipe-admin@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select jsonb_array_length(c -> 'campagnes') campagnes, c -> 'leads_mois' ->> 11 leads_mois, c -> 'depense_mois' ->> 11 depense_mois, c ->> 'budget_mois' budget, jsonb_array_length(c -> 'pages') pages, c -> 'proposition' ->> 'id' is not null proposition
from (select public.lanceur_campagnes() c) z;
select jsonb_array_length(s -> 'sources') sources, s -> 'proposition' ->> 'source' proposition from (select public.lanceur_sources() s) z;
commit;
