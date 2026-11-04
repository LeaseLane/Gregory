-- Tests pgTAP · honoraires de coordination des travaux (migration 20261111110000_coordination_seuil.sql) :
-- 0 $ sous 1 000 $, 10 % de la facture complète dès 1 000 $. Préproduction ou base jetable; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111110000_coordination_seuil.sql
set local search_path = public, extensions;
select plan(7);
select is((select travaux_pct::text || ' % dès ' || travaux_seuil::text || ' $' from crm.parametres_honoraires(current_date)), '10.00 % dès 1000.00 $', '0 · paramètres en vigueur : 10 %, seuil de 1 000 $');
select is(crm.honoraire_travaux(900, current_date), 0::numeric, '1 · 900 $ → 0 $');
select is(crm.honoraire_travaux(999.99, current_date), 0::numeric, '1 · 999,99 $ → 0 $');
select is(crm.honoraire_travaux(1000, current_date), 100::numeric, '2 · 1 000 $ → 100 $');
select is(crm.honoraire_travaux(2500, current_date), 250::numeric, '2 · 2 500 $ → 250 $');
select is(crm.honoraire_travaux(null, current_date), 0::numeric, '3 · montant inconnu → 0 $');
select ok(pg_get_functiondef('public.portail_demande(uuid)'::regprocedure) like '%crm.honoraire_travaux(a.requested_amount, current_date)%'
  and pg_get_functiondef('public.portail_cleo_contexte(text)'::regprocedure) like '%crm.honoraire_travaux(a.requested_amount, current_date)%'
  and pg_get_functiondef('public.portail_demande(uuid)'::regprocedure) not like '%> 1000%', '4 · les portails appellent le calcul unique (plus de règle recopiée)');
select * from finish();
rollback;
