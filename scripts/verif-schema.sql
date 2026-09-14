-- Vérifie que les objets des six migrations du 2026-09-14 existent
-- réellement. Lecture seule.
--
-- Chaque ligne rend « ok » ou « MANQUANT ». Le workflow échoue dès qu'un
-- « MANQUANT » apparaît.

\pset format aligned
\pset border 2

with attendu(lot, objet, present, minimum) as (
  values
    ('G1', 'garde-fou Loi 25 — inquiries',
      (select count(*) from pg_trigger
        where tgname='restrict_inquiries_owner_update_trigger' and not tgisinternal), 1),

    ('G1', 'garde-fou — approvals',
      (select count(*) from pg_trigger
        where tgname='restrict_approvals_owner_update_trigger' and not tgisinternal), 1),

    ('G1', 'déclencheur extraction IA — on_document_insert',
      (select count(*) from pg_trigger
        where tgname='on_document_insert' and not tgisinternal), 1),

    -- Six exactement : une migration à moitié appliquée en créerait moins
    -- et passerait un test « au moins une ».
    ('G1', 'colonnes ai_* sur documents (6 attendues)',
      (select count(*) from information_schema.columns
        where table_schema='public' and table_name='documents'
          and column_name in ('ai_processed','ai_summary','ai_parties',
                              'ai_key_amount','ai_expiry_date','ai_extracted')), 6),

    ('G2', 'index d''unicité (3 attendus)',
      (select count(*) from pg_indexes
        where schemaname='public' and indexname in (
          'units_building_numero_unique',
          'leases_unite_bail_actif_unique',
          'buildings_proprio_adresse_unique')), 3),

    ('G4', 'colonne messages.tenant_id',
      (select count(*) from information_schema.columns
        where table_schema='public' and table_name='messages'
          and column_name='tenant_id'), 1),

    ('G9', 'colonne payments.reminder_request_id',
      (select count(*) from information_schema.columns
        where table_schema='public' and table_name='payments'
          and column_name='reminder_request_id'), 1),

    ('G11', 'fonction internal_call_headers()',
      (select count(*) from pg_proc where proname='internal_call_headers'), 1),

    ('P1', 'tâches cron actives (18 attendues)',
      (select count(*) from cron.job where active), 18)
)
select lot, objet, present as nb, minimum as attendu,
       case when present >= minimum then 'ok' else 'MANQUANT' end as etat
from attendu
order by lot, objet;

-- Trois vérifications qui ne tiennent pas dans le tableau ci-dessus, parce
-- qu'un objet peut exister sans agir.

-- G2 : un index d'unicité invalide (création interrompue) reste listé dans
-- pg_indexes mais n'applique aucune contrainte.
select 'G2' as lot,
       'validité de ' || indexrelid::regclass::text as objet,
       case when indisvalid and indisunique then 'ok' else 'MANQUANT' end as etat
from pg_index
where indexrelid::regclass::text like '%leases_unite_bail_actif_unique%';

-- G1 : un déclencheur désactivé (tgenabled = 'D') existe sans s'exécuter.
select 'G1' as lot,
       'état de ' || tgname as objet,
       case when tgenabled = 'O' then 'ok' else 'MANQUANT (désactivé)' end as etat
from pg_trigger
where tgname in ('restrict_inquiries_owner_update_trigger',
                 'restrict_approvals_owner_update_trigger',
                 'on_document_insert')
  and not tgisinternal
order by tgname;

-- G2 : les trois index d'unicité doivent être valides ET uniques.
select 'G2' as lot,
       'validité de ' || indexrelid::regclass::text as objet,
       case when indisvalid and indisunique then 'ok' else 'MANQUANT' end as etat
from pg_index
where indexrelid::regclass::text in (
        'units_building_numero_unique',
        'leases_unite_bail_actif_unique',
        'buildings_proprio_adresse_unique')
order by 2;

-- G11 : la fonction internal_call_headers() peut exister sans servir. Une
-- migration ultérieure qui redéfinit l'un de ces sept déclencheurs sans le
-- savoir rouvrirait la porte en silence — c'est exactement ce qui s'est
-- produit avec les déclencheurs du lot G1. On vérifie donc que chacun
-- l'appelle réellement.
select 'G11' as lot,
       'appel du secret dans ' || nom as objet,
       case when exists (
              select 1 from pg_proc
              where proname = nom
                and prosrc like '%internal_call_headers%'
            ) then 'ok' else 'MANQUANT' end as etat
from (values ('trigger_dispatch_advance'),
             ('trigger_analyze_owner_message'),
             ('notify_listing_needed'),
             ('trigger_monthly_owner_reports'),
             ('flag_incomplete_onboarding'),
             ('trigger_payment_reminders'),
             ('handle_approval_decision')) as f(nom)
order by 2;

-- G1 : le déclencheur d'extraction IA ne fait rien sans ces deux réglages,
-- et le signale seulement dans les journaux. C'est le comportement voulu
-- (une préproduction mal réglée ne doit pas taper sur la production), mais
-- en production leur absence rend la fonctionnalité muette.
select 'G1' as lot,
       'réglage ' || nom as objet,
       case when coalesce(current_setting(nom, true), '') <> '' then 'ok'
            else 'MANQUANT' end as etat
from (values ('app.functions_base_url'), ('app.functions_anon_key')) as r(nom);
