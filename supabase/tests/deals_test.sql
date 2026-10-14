-- Tests pgTAP · T3 Pipelines et deals (ordre-des-tranches § T3, invariants). Préproduction; transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(13);

create function pg_temp.comme(p_courriel text, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.etape(p_code text) returns uuid language sql as $$
  select s.id from crm.stages s join crm.pipelines p on p.id = s.pipeline_id where p.code = 'mandats' and s.code = p_code $$;

-- 1. Chaque prospect a son deal (lien, sans suppression)
select is((select count(*)::int from public.prospects pr where pr.anonymized_at is null and not exists (select 1 from crm.deals d where d.prospect_id = pr.id)), 0, '1 · chaque prospect a son deal');

-- 2. Un nouveau prospect crée un deal, un contact et une ligne d'historique ouverte
insert into public.prospects (id, full_name, company_name, email, phone, num_doors, avg_rent, stage, lead_source)
values ('00000000-0000-4000-a000-0000000003a1', 'Marc Fortier', 'Immeubles Fortier (test)', 'marc@exemple.test', '418 555-0301', 24, 1190, 'new', 'Site web');
create temp table t_d on commit drop as select id from crm.deals where prospect_id = '00000000-0000-4000-a000-0000000003a1';
select is((select monthly_value_cents from crm.deals where id = (select id from t_d)), 171360, '2 · valeur = 6 % des loyers (24 × 1 190 $)');
select is((select count(*)::int from crm.deal_stage_history where deal_id = (select id from t_d) and left_at is null), 1, '2 · une ligne ouverte');
select throws_ok(format('insert into crm.deal_stage_history (deal_id, stage_id) values (%L, %L)', (select id from t_d), pg_temp.etape('contacte')), '23505', null, '2 · 2e ligne ouverte → refusée');

-- 3. Droits
select pg_temp.comme('equipe-prospection@leaselane.test', 'aal1');
select throws_ok(format('select public.lanceur_deplacer_deal(%L)', jsonb_build_object('deal_id', (select id from t_d), 'stage_id', pg_temp.etape('contacte'))), 'PT403', null, '3 · sans 2FA → PT403');
select pg_temp.comme('equipe-location@leaselane.test', 'aal2');
select throws_ok(format('select public.lanceur_deplacer_deal(%L)', jsonb_build_object('deal_id', (select id from t_d), 'stage_id', pg_temp.etape('contacte'))), 'PT403', null, '3 · rôle location → PT403');

-- 4. Déplacer : miroir vers le prospect; étape lue périmée → 409; Perdu sans raison → 422; Converti → par « Convertir »
select pg_temp.comme('equipe-prospection@leaselane.test', 'aal2');
select public.lanceur_deplacer_deal(jsonb_build_object('deal_id', (select id from t_d), 'stage_id', pg_temp.etape('contacte'), 'read_stage_id', pg_temp.etape('nouveau')));
select is((select stage from public.prospects where id = '00000000-0000-4000-a000-0000000003a1'), 'contacted', '4 · le prospect suit le deal');
select throws_ok(format('select public.lanceur_deplacer_deal(%L)', jsonb_build_object('deal_id', (select id from t_d), 'stage_id', pg_temp.etape('qualifie'), 'read_stage_id', pg_temp.etape('nouveau'))),
  'PT409', null, '4 · étape lue ≠ actuelle → 409 concurrent-transition');
select throws_ok(format('select public.lanceur_deplacer_deal(%L)', jsonb_build_object('deal_id', (select id from t_d), 'stage_id', pg_temp.etape('perdu'))), 'PT422', null, '4 · Perdu sans raison → 422');
select throws_ok(format('select public.lanceur_deplacer_deal(%L)', jsonb_build_object('deal_id', (select id from t_d), 'stage_id', pg_temp.etape('converti'))), 'PT422', null, '4 · Converti → passer par « Convertir »');
update crm.stages set active = false where id = pg_temp.etape('offre');
select throws_ok(format('select public.lanceur_deplacer_deal(%L)', jsonb_build_object('deal_id', (select id from t_d), 'stage_id', pg_temp.etape('offre'))), 'PT422', null, '4 · étape inactive → 422');
update crm.stages set active = true where id = pg_temp.etape('offre');

-- 5. Portail actuel (prospects.stage) → le deal suit, historique tenu
select set_config('request.jwt.claims', '', true);
update public.prospects set stage = 'interested' where id = '00000000-0000-4000-a000-0000000003a1';
select is((select stage_id from crm.deals where id = (select id from t_d)), pg_temp.etape('qualifie'), '5 · le deal suit le prospect');
select is((select count(*)::int from crm.deal_stage_history where deal_id = (select id from t_d)), 3, '5 · trois étapes dans l''historique, une seule ouverte');

select * from finish();
rollback;
