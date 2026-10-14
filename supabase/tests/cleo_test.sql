-- Tests pgTAP · T8c Cléo et ⌘K (invariants : Cléo ne voit que ce que la personne voit; recherche réservée à l'équipe;
-- caractères joker neutralisés; mesure réservée à la clé de service). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(8);

create function pg_temp.comme(p_courriel text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = p_courriel), 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
insert into buildings (id, address) values ('00000000-0000-4000-a000-0000000c1e01', '75, Saint-Vallier (test cleo)');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-0000000c1e02', '00000000-0000-4000-a000-0000000c1e01', '4', 'occupied');
insert into tenants (id, full_name, email, phone) values ('00000000-0000-4000-a000-0000000c1e03', 'Zéphirin Essaicleo', 'z@exemple-cleo.test', '418 555-0101');
insert into leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status)
values ('00000000-0000-4000-a000-0000000c1e04', '00000000-0000-4000-a000-0000000c1e02', '00000000-0000-4000-a000-0000000c1e03', current_date - 200, current_date + 160, 925, 'active');
insert into payments (lease_id, amount, due_date, status) values ('00000000-0000-4000-a000-0000000c1e04', 925, current_date - 9, 'late');

-- 1. Équipe seulement
select set_config('request.jwt.claims', '{"role": "authenticated", "aal": "aal2", "sub": "00000000-0000-4000-a000-000000000000"}', true);
select throws_ok($$ select public.lanceur_recherche('Essaicleo') $$, 'PT403', null, '1 · hors équipe : recherche refusée');
select throws_ok($$ select public.lanceur_cleo_contexte('x') $$, 'PT403', null, '1 · hors équipe : contexte de Cléo refusé');

-- 2. Gestionnaire : fiche, action « appeler », fait « loyer en retard » avec sa source
select pg_temp.comme('equipe-gestionnaire@leaselane.test');
select ok(exists (select 1 from jsonb_array_elements(public.lanceur_recherche('essaicleo') -> 'fiches') f where f ->> 'titre' = 'Zéphirin Essaicleo' and f ->> 'type' = 'locataire'), '2 · fiche trouvée (casse ignorée)');
select ok(exists (select 1 from jsonb_array_elements(public.lanceur_recherche('Essaicleo') -> 'actions') a where a ->> 'lien' = 'tel:4185550101'), '2 · action « Appeler » avec le numéro');
select ok(exists (select 1 from jsonb_array_elements(public.lanceur_cleo_contexte(null) -> 'faits') f where f ->> 'fait' = 'Loyer en retard' and f ->> 'personne' = 'Zéphirin Essaicleo'
  and (f ->> 'montant')::numeric = 925 and f -> 'source' ->> 'lien' is not null), '2 · Cléo voit le loyer en retard, avec sa source');

-- 3. Joker neutralisé : « % » ne trouve pas tout
select is(jsonb_array_length(public.lanceur_recherche('%%') -> 'fiches'), 0, '3 · « %% » ne renvoie rien');

-- 4. Prospection : ni fiches de locataires ni loyers en retard
select pg_temp.comme('equipe-prospection@leaselane.test');
select ok(not exists (select 1 from jsonb_array_elements(public.lanceur_recherche('Essaicleo') -> 'fiches') f where f ->> 'type' = 'locataire')
      and not exists (select 1 from jsonb_array_elements(public.lanceur_cleo_contexte(null) -> 'faits') f where f ->> 'fait' = 'Loyer en retard'), '4 · prospection ne voit pas les locataires ni les retards');

-- 5. Mesure : clé de service seulement
select ok(not has_function_privilege('authenticated', 'public.service_cleo_mesure(jsonb)', 'execute'), '5 · mesure fermée aux personnes');

select * from finish();
rollback;
