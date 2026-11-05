-- Tests pgTAP · notes et appels du prospect dans la fiche deal (migration 20261111240000_deal_notes_prospect.sql). Transaction annulée.
begin;
create extension if not exists pgtap with schema extensions;
\ir ../migrations/20261111240000_deal_notes_prospect.sql
set local search_path = public, extensions;
select plan(4);
insert into prospects (id, full_name, notes, call_history) values ('00000000-0000-4000-a000-0000000f2501', 'Prospect Essai Notes', 'Rappeler après les fêtes (essai)',
  '[{"date":"2026-10-20T14:00:00Z","summary":"Intéressé, 12 portes (essai)","next_step":"Envoyer l''offre"},{"date":"2026-10-25T14:00:00Z","transcript":"Pas de réponse (essai)"}]');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-prospection@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select is(lanceur_deal_historique((select id from crm.deals where prospect_id = '00000000-0000-4000-a000-0000000f2501')) ->> 'notes', 'Rappeler après les fêtes (essai)', '1 · la note du prospect est rendue');
select is(jsonb_array_length(lanceur_deal_historique((select id from crm.deals where prospect_id = '00000000-0000-4000-a000-0000000f2501')) -> 'appels'), 2, '2 · ses deux appels aussi');
select is(lanceur_deal_historique((select id from crm.deals where prospect_id = '00000000-0000-4000-a000-0000000f2501')) -> 'appels' -> 0 ->> 'resume', 'Pas de réponse (essai)', '3 · le plus récent d''abord, transcription si pas de résumé');
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-comptabilite@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_ok($$ select lanceur_deal_historique((select id from crm.deals where prospect_id = '00000000-0000-4000-a000-0000000f2501')) $$, 'PT403', null, '4 · mêmes droits que le pipeline');
select * from finish();
rollback;
