-- Tests pgTAP · T1 Propositions et « À approuver » (spec § 8, tests 1 à 11).
-- Préproduction seulement (workflow « SQL en préproduction »). Tout se fait dans une transaction annulée à la fin.
-- On reste « postgres » et on simule l'usager par request.jwt.claims (sub, aal), ce que lisent auth.uid(),
-- auth.jwt(), crm.can() et crm.require_aal2(). Les droits d'« authenticated » sont vérifiés par has_*_privilege.
-- Comptes : seed-univers-maquettes.sql (equipe-prospection : ventes.mandats.ecrire; equipe-location : non).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(20);

create temp table t_ctx on commit drop as
select (select id from auth.users where email = 'equipe-prospection@leaselane.test') as lp,
       (select id from auth.users where email = 'equipe-location@leaselane.test') as cd;

create function pg_temp.comme(p_user uuid, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'aal', p_aal, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.proposer(p_cle text, p_cible uuid, p_after jsonb, p_op text default 'move-prospect-stage') returns uuid language sql as $$
  select (crm.create_proposal(jsonb_build_object('agent', 'cleo', 'operation', p_op, 'target_id', p_cible, 'after', p_after,
    'reason', 'Le client confirme son intérêt par courriel.', 'source_type', 'courriel', 'source_excerpt', 'Oui, on avance.',
    'confidence', 82, 'idempotency_key', p_cle))).id;
$$;

insert into prospects (id, full_name, company_name, stage) values
  ('00000000-0000-4000-a000-000000000001', 'Test Roy', 'Investissements Roy (test)', 'contacted'),
  ('00000000-0000-4000-a000-000000000002', 'Test Bis', 'Prospect bis (test)', 'contacted');

-- 1. Idempotence de la création
select is(pg_temp.proposer('t1:a', '00000000-0000-4000-a000-000000000001', '{"stage":"interested"}'),
          pg_temp.proposer('t1:a', '00000000-0000-4000-a000-000000000001', '{"stage":"interested"}'), '1 · même clé → même proposition');
select is((select count(*)::int from crm.proposals where idempotency_key = 't1:a'), 1, '1 · une seule ligne');

-- 2. authenticated ne crée ni ne modifie de proposition
select ok(not has_table_privilege('authenticated', 'crm.proposals', 'INSERT') and not has_table_privilege('authenticated', 'crm.proposals', 'UPDATE'),
          '2 · authenticated ne peut ni insérer ni modifier crm.proposals');
select ok(not has_function_privilege('authenticated', 'crm.create_proposal(jsonb)', 'EXECUTE'), '2 · authenticated ne peut pas appeler create_proposal');

-- 3. Approbation sans 2FA
select pg_temp.comme((select lp from t_ctx), 'aal1');
select throws_ok(format('select crm.approve_proposal(%L)', (select id from crm.proposals where idempotency_key = 't1:a')), 'PT403', null, '3 · aal1 → PT403');

-- 4. Rôle sans le droit (location)
select pg_temp.comme((select cd from t_ctx), 'aal2');
select throws_ok(format('select crm.approve_proposal(%L)', (select id from crm.proposals where idempotency_key = 't1:a')), 'PT403', null, '4 · location → PT403');

-- 5. Fiche modifiée après la proposition → périmée, rien d'écrit
select pg_temp.proposer('t5', '00000000-0000-4000-a000-000000000002', '{"stage":"interested"}');
update prospects set notes = 'changé en arrière-plan', updated_at = now() + interval '1 second' where id = '00000000-0000-4000-a000-000000000002';
select pg_temp.comme((select lp from t_ctx), 'aal2');
select is(crm.approve_proposal((select id from crm.proposals where idempotency_key = 't5')) ->> 'code', 'proposition-perimee', '5 · retour proposition-perimee');
select is((select status || '/' || apply_error from crm.proposals where idempotency_key = 't5'), 'expired/version', '5 · statut expired (version)');
select is((select stage from prospects where id = '00000000-0000-4000-a000-000000000002'), 'contacted', '5 · prospect inchangé');

-- 6. Deux approbations → la seconde 409, une seule modification
select is(crm.approve_proposal((select id from crm.proposals where idempotency_key = 't1:a')) ->> 'ok', 'true', '6 · première approbation appliquée');
select throws_ok(format('select crm.approve_proposal(%L)', (select id from crm.proposals where idempotency_key = 't1:a')), 'PT409', null, '6 · seconde → PT409');
select is((select count(*)::int from audit_log where action = 'prospect.stage_change' and entity_id = '00000000-0000-4000-a000-000000000001'), 1, '6 · prospect modifié une seule fois');

-- 7. Modifier un champ hors « après » → 422
select pg_temp.proposer('t7', '00000000-0000-4000-a000-000000000001', '{"next_action":"Rappeler mardi"}', 'update-prospect-followup');
select throws_ok(format('select crm.approve_proposal(%L, %L::jsonb)', (select id from crm.proposals where idempotency_key = 't7'), '{"interest_level":"chaud"}'),
                 'PT422', null, '7 · edited_after hors after → PT422');

-- 8. Perdu sans raison → 422
select throws_ok($$select crm.move_prospect_stage('{"id":"00000000-0000-4000-a000-000000000002","stage":"lost"}')$$, 'PT422', null, '8 · lost sans raison → PT422');

-- 9. Rejet : motif requis, puis rejeté et journalisé
select throws_ok(format('select crm.reject_proposal(%L, null)', (select id from crm.proposals where idempotency_key = 't7')), 'PT422', null, '9 · rejet sans motif → PT422');
select is(crm.reject_proposal((select id from crm.proposals where idempotency_key = 't7'), 'trop_tot') ->> 'ok', 'true', '9 · rejet avec motif');
select is((select count(*)::int from audit_log where action = 'proposal.rejected' and proposal_id = (select id from crm.proposals where idempotency_key = 't7')), 1, '9 · rejet journalisé');

-- 10. Expiration : seulement les « pending » échues
select pg_temp.proposer('t10', '00000000-0000-4000-a000-000000000002', '{"stage":"proposal_sent"}');
update crm.proposals set expires_at = now() - interval '1 minute' where idempotency_key = 't10';
select is(crm.expire_proposals(), 1, '10 · une seule proposition échue expirée');

-- 11. Journal de chaque décision; audit_log immuable
select ok((select bool_and(proposal_id is not null and actor_kind = 'person' and after is not null) from audit_log
           where action in ('proposal.approved', 'proposal.rejected') and proposal_id in (select id from crm.proposals where idempotency_key like 't%')),
          '11 · décisions journalisées (proposal_id, acteur, après)');
select throws_ok($$update audit_log set action = 'x' where action = 'proposal.approved'$$, null, null, '11 · audit_log refuse update');

select * from finish();
rollback;
