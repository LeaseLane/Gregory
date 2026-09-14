-- Vérifie que les objets des six migrations du 2026-09-14 existent
-- réellement. Lecture seule.
--
-- Chaque ligne rend « ok » ou « MANQUANT ». Le workflow échoue dès qu'un
-- « MANQUANT » apparaît.

\pset format aligned
\pset border 2

with attendu(lot, objet, present) as (
  values
    ('G4',  'colonne messages.tenant_id',
      (select count(*) from information_schema.columns
        where table_schema='public' and table_name='messages'
          and column_name='tenant_id')),

    ('G1',  'garde-fou Loi 25 — inquiries',
      (select count(*) from pg_trigger
        where tgname='restrict_inquiries_owner_update_trigger' and not tgisinternal)),

    ('G1',  'garde-fou Loi 25 — maintenance_requests',
      (select count(*) from pg_trigger
        where tgname='restrict_maintenance_owner_update_trigger' and not tgisinternal)),

    ('G1',  'déclencheur analyse IA maintenance',
      (select count(*) from pg_trigger
        where tgname='trigger_analyse_ia_maintenance' and not tgisinternal)),

    ('G1',  'colonnes ai_* sur maintenance_requests (6 attendues)',
      (select count(*) from information_schema.columns
        where table_schema='public' and table_name='maintenance_requests'
          and column_name like 'ai\_%')),

    ('G2',  'unicité bail actif par unité',
      (select count(*) from pg_indexes
        where schemaname='public' and indexname='leases_unite_bail_actif_unique')),

    ('G11', 'fonction internal_call_headers()',
      (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
        where p.proname='internal_call_headers')),

    ('G9',  'colonne payments.reminder_request_id',
      (select count(*) from information_schema.columns
        where table_schema='public' and table_name='payments'
          and column_name='reminder_request_id')),

    ('P1',  'tâches cron actives',
      (select count(*) from cron.job where active))
)
select lot,
       objet,
       present as nb,
       case
         -- Les colonnes ai_* doivent être six, pas « au moins une » :
         -- une migration partiellement appliquée en créerait moins.
         when objet like 'colonnes ai_%' and present <> 6 then 'MANQUANT'
         when objet = 'tâches cron actives' and present < 18 then 'MANQUANT'
         when present = 0 then 'MANQUANT'
         else 'ok'
       end as etat
from attendu
order by lot, objet;

-- Deux vérifications qui ne tiennent pas dans le tableau ci-dessus.

-- G2 : l'index d'unicité ne protège que s'il est VALIDE. Un index créé
-- en CONCURRENTLY qui a échoué reste listé mais n'applique rien.
select 'G2' as lot, indexrelid::regclass::text as objet,
       case when indisvalid and indisunique then 'ok' else 'MANQUANT' end as etat
from pg_index
where indexrelid::regclass::text like '%leases_unite_bail_actif_unique%';

-- G1 : un déclencheur désactivé (tgenabled = 'D') existe sans agir.
select 'G1' as lot, tgname as objet,
       case when tgenabled = 'O' then 'ok' else 'MANQUANT (désactivé)' end as etat
from pg_trigger
where tgname in ('restrict_inquiries_owner_update_trigger',
                 'restrict_maintenance_owner_update_trigger',
                 'trigger_analyse_ia_maintenance')
  and not tgisinternal
order by tgname;
