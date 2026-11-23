-- Tests pgTAP · veille des taux et refinancement, Phase 2 (23 nov. 2026). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(7);
select set_config('request.jwt.claims', json_build_object('sub', (select user_id from crm.team_members where role = 'admin' and active limit 1), 'aal', 'aal2', 'role', 'authenticated')::text, true);
select is(jsonb_array_length(public.lanceur_taux()), 3, 'trois taux suivis');
select is(round(crm.mensualite(500000, 5, 25), 2), 2908.02, 'mensualité de référence : 500 000 $ à 5 % sur 25 ans = 2 908,02 $');
select is((public.lanceur_refinancement('{"capital":500000,"taux_actuel":5,"taux_nouveau":4,"amortissement":25}') ->> 'ecart_mensuel')::numeric, 277.92, 'refinancer de 5 % à 4 % économise 277,92 $ par mois');
select is((public.lanceur_refinancement('{"capital":500000,"taux_actuel":5,"taux_nouveau":4}') ->> 'ecart_annuel')::numeric, 3335.04, 'économie annuelle (amortissement 25 ans par défaut)');
select throws_like($$ select public.lanceur_refinancement('{"capital":-1,"taux_actuel":5,"taux_nouveau":4}') $$, '%invalides%', 'capital négatif : refusé');
select is((select count(*)::int from crm.taux_marche where serie = 'V39079' and valeur = 2.50), 1, 'taux directeur de départ : 2,50 %');
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-8000-0000000000ff', 'aal', 'aal2', 'role', 'authenticated')::text, true);
select throws_like($$ select public.lanceur_taux() $$, '%rôle%', 'sans droit : refusé');
select * from finish();
rollback;
