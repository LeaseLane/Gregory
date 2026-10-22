-- Studio › Site web › Vue d'ensemble : demandes de contact fictives sur 180 jours pour le graphique de demo.leaselane.ca.
-- Préproduction seulement (workflow « SQL en préproduction »). Rejouable : efface puis recrée les adresses @exemple-demande.test.
-- Les déclencheurs d'avis (on_inquiry_insert, on_mandat_inquiry_insert) sont coupés le temps de la transaction : aucun courriel.
begin;
alter table public.inquiries disable trigger on_inquiry_insert, disable trigger on_mandat_inquiry_insert;
delete from public.inquiries where email like '%@exemple-demande.test';
select setseed(0.42);
insert into public.inquiries (type, full_name, email, phone, message, status, created_at, consented_at, consent_purpose)
select t.type, n.nom, lower(replace(n.nom, ' ', '.')) || '.' || j || '.' || k || '@exemple-demande.test', '418-555-01' || lpad((j % 100)::text, 2, '0'),
  case t.type when 'visite' then 'Bonjour, le logement est-il encore disponible? J’aimerais le visiter.'
    when 'mandat' then 'Nous cherchons une firme pour gérer notre immeuble.' else 'J’ai une question sur vos services.' end,
  case when j > 14 then 'closed' when j > 3 then 'contacted' else 'new' end,
  d + time '08:00' + random() * interval '13 hours', d + time '08:00', 'Réponse à la demande'
from generate_series(0, 179) j
cross join lateral (select (now() at time zone 'America/Toronto')::date - j as d) jour
-- Plus de demandes en semaine, croissance vers aujourd'hui, un pic de visites au début de chaque mois.
cross join lateral generate_series(1, greatest(0, round(random() * 3 + (180 - j) / 60.0 + case when extract(isodow from d) < 6 then 1 else -1 end
  + case when extract(day from d) <= 3 then 2 else 0 end)::int)) k
cross join lateral (select (array['visite', 'visite', 'visite', 'mandat', 'contact'])[1 + floor(random() * 5 + 0 * k)::int] as type) t
cross join lateral (select (array['Émilie Gagnon', 'Gabriel Paquet', 'Léa Bouchard', 'Olivier Roy', 'Chloé Tremblay', 'William Côté', 'Alice Pelletier', 'Thomas Lavoie'])[1 + floor(random() * 8 + 0 * k)::int] as nom) n;
-- Demandes de visite rattachées aux logements affichés sur le site (bloc Propriétés), en proportions inégales.
with l as (select id, row_number() over (order by id) - 1 k, count(*) over () n from public.site_logements_publies)
update public.inquiries i set unit_id = l.id from l
where i.email like '%@exemple-demande.test' and i.type = 'visite' and l.n > 0
  and l.k = floor(power(abs(hashtext(i.email)) / 2147483648.0, 1.6) * l.n)::int;
alter table public.inquiries enable trigger on_inquiry_insert, enable trigger on_mandat_inquiry_insert;
commit;
-- Appels à Cléo pour la rédaction (bloc IA et crédits), 180 jours, marqués trigger_source = 'demo-studio'.
delete from public.ai_run_log where trigger_source = 'demo-studio';
insert into public.ai_run_log (function_name, trigger_source, input_tokens, output_tokens, duration_ms, created_at)
select 'studio-redaction:' || e.etape, 'demo-studio', 8000 + floor(random() * 3000 + 0 * k)::int, round(e.sortie * (0.8 + random() * 0.4 + 0 * k))::int, 4000 + floor(random() * 9000)::int,
  ((now() at time zone 'America/Toronto')::date - j)::timestamp + time '09:00' + random() * interval '9 hours'
from generate_series(0, 179) j
cross join (values ('idees', 0.4, 1400), ('redaction', 0.35, 3400), ('audit', 0.6, 1300), ('ton', 0.35, 3200), ('metadonnees', 0.45, 1200)) e(etape, taux, sortie)
cross join lateral generate_series(1, (random() + 0 * j < e.taux)::int + (random() + 0 * j < e.taux / 3)::int) k;
select (select count(*) from public.ai_run_log where trigger_source = 'demo-studio') as appels_cleo_fictifs,
  (select count(*) from public.inquiries where email like '%@exemple-demande.test' and unit_id is not null) as visites_rattachees,
  count(*) as demandes_fictives, min(created_at)::date as debut, max(created_at)::date as fin from public.inquiries where email like '%@exemple-demande.test';
