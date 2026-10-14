-- Tests pgTAP · TP propriétaire, jalon 2d (invariants : le journal d'accès et les demandes Loi 25 ne montrent que ce qui touche SES
-- locataires; la demande du propriétaire sur ses propres renseignements crée une tâche et une échéance de 30 jours). Préproduction; annulée.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, crm;
select plan(5);

create function pg_temp.comme(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'aal', 'aal2', 'role', 'authenticated')::text, true);
$$;
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000074a001', 'authenticated', 'authenticated', 'pa@exemple-tp5.test'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-00000074a002', 'authenticated', 'authenticated', 'pb@exemple-tp5.test');
insert into owners (id, user_id, full_name) values ('00000000-0000-4000-a000-00000074b001', '00000000-0000-4000-a000-00000074a001', 'PA Essai'), ('00000000-0000-4000-a000-00000074b002', '00000000-0000-4000-a000-00000074a002', 'PB Essai');
insert into buildings (id, address, owner_id) values ('00000000-0000-4000-a000-00000074c001', '1 rue A (tp5)', '00000000-0000-4000-a000-00000074b001');
insert into units (id, building_id, unit_number, status) values ('00000000-0000-4000-a000-00000074d001', '00000000-0000-4000-a000-00000074c001', '1', 'occupied');
insert into tenants (id, full_name, email) values ('00000000-0000-4000-a000-00000074e001', 'Nadia Essai', 'nadia@exemple-tp5.test');
insert into leases (unit_id, tenant_id, start_date, end_date, monthly_rent, status) values ('00000000-0000-4000-a000-00000074d001', '00000000-0000-4000-a000-00000074e001', current_date - 100, current_date + 260, 1320, 'active');
insert into personal_data_requests (request_type, subject_type, subject_id, requester_name) values ('access', 'tenant', '00000000-0000-4000-a000-00000074e001', 'Nadia Essai');

select pg_temp.comme('00000000-0000-4000-a000-00000074a001');
select public.portail_proprietaire_locataire('00000000-0000-4000-a000-00000074e001') is not null as lu;
select ok(exists (select 1 from jsonb_array_elements(public.portail_acces() -> 'journal') j where j ->> 'quoi' = 'Consultation d’une fiche locataire'), '1 · A voit la consultation de la fiche de son locataire');
select is(jsonb_array_length(public.portail_loi25() -> 'demandes'), 1, '1 · A voit la demande Loi 25 de sa locataire');
select public.portail_demande_loi25('{"type": "access", "details": "Copie de mes renseignements"}');
select ok(exists (select 1 from crm.tasks where title like 'Demande Loi 25 d’un propriétaire%') and jsonb_array_length(public.portail_loi25() -> 'demandes') = 2, '1 · sa propre demande : tâche à l''équipe, listée');

select pg_temp.comme('00000000-0000-4000-a000-00000074a002');
select ok(not exists (select 1 from jsonb_array_elements(public.portail_acces() -> 'journal') j where j ->> 'quoi' = 'Consultation d’une fiche locataire'), '2 · B ne voit pas le journal de A');
select is(jsonb_array_length(public.portail_loi25() -> 'demandes'), 0, '2 · B ne voit aucune demande Loi 25 de A');

select * from finish();
rollback;
