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
alter table public.inquiries enable trigger on_inquiry_insert, enable trigger on_mandat_inquiry_insert;
commit;
select count(*) as demandes_fictives, min(created_at)::date as debut, max(created_at)::date as fin from public.inquiries where email like '%@exemple-demande.test';
