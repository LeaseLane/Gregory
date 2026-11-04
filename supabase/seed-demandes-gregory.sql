-- Données fictives de PRÉPRODUCTION pour les captures des demandes de Grégory (2026-11-04). Rejouable (supprime puis recrée).
-- Univers des maquettes seulement : comptes @leaselane.test, noms et courriels d'exemple. Lancer par le workflow « SQL en préproduction ».
begin;

-- 1. Prospecteur téléphonique de démonstration : compte hors équipe appelant-demo@leaselane.test (supabase/seed-appelant-demo.sql).

-- 2. Seuil de coordination : deux accords de travaux en attente chez Marie-Josée Bérubé (900 $ et 1 000 $).
delete from public.approvals where work_order_id in ('00000000-0000-4000-a000-00000009a900', '00000000-0000-4000-a000-00000009a1e3');
delete from public.work_orders where id in ('00000000-0000-4000-a000-00000009a900', '00000000-0000-4000-a000-00000009a1e3');
delete from public.service_requests where id in ('00000000-0000-4000-a000-00000009b900', '00000000-0000-4000-a000-00000009b1e3');
do $$
declare v_o uuid; v_u uuid; v_t uuid;
begin
  select o.id into v_o from public.owners o join auth.users u on u.id = o.user_id where u.email = 'mj.berube@leaselane.test';
  select l.unit_id, l.tenant_id into v_u, v_t from public.leases l join public.units un on un.id = l.unit_id join public.buildings b on b.id = un.building_id
   where b.owner_id = v_o and l.status = 'active' order by b.address, un.unit_number limit 1;
  if v_u is null then raise notice 'Aucun logement loué chez mj.berube : étape 2 sautée.'; return; end if;
  insert into public.service_requests (id, unit_id, tenant_id, description, status, kind, title, ai_category, ai_urgency, ai_status, created_at) values
    ('00000000-0000-4000-a000-00000009b900', v_u, v_t, 'Robinet de cuisine à remplacer (exemple fictif).', 'in_progress', 'travaux', 'Robinet de cuisine (exemple 900 $)', 'plomberie', 'normal', 'ok', now() - interval '2 days'),
    ('00000000-0000-4000-a000-00000009b1e3', v_u, v_t, 'Chauffe-eau à remplacer (exemple fictif).', 'in_progress', 'travaux', 'Chauffe-eau (exemple 1 000 $)', 'plomberie', 'normal', 'ok', now() - interval '1 day');
  insert into public.work_orders (id, service_request_id, unit_id, description, estimated_cost, status, created_at, dispatch_mode) values
    ('00000000-0000-4000-a000-00000009a900', '00000000-0000-4000-a000-00000009b900', v_u, 'Robinet de cuisine (exemple 900 $)', 900, 'open', now() - interval '2 days', 'manual'),
    ('00000000-0000-4000-a000-00000009a1e3', '00000000-0000-4000-a000-00000009b1e3', v_u, 'Chauffe-eau (exemple 1 000 $)', 1000, 'open', now() - interval '1 day', 'manual');
  delete from public.approvals where work_order_id in ('00000000-0000-4000-a000-00000009a900', '00000000-0000-4000-a000-00000009a1e3');   -- un déclencheur a pu en créer
  insert into public.approvals (work_order_id, owner_id, requested_amount, status, created_at) values
    ('00000000-0000-4000-a000-00000009a900', v_o, 900, 'pending', now() - interval '2 days'),
    ('00000000-0000-4000-a000-00000009a1e3', v_o, 1000, 'pending', now() - interval '1 day');
end $$;

-- 3. Visites de la semaine du 2 novembre sur un logement en location : deux visites de 15 min et une visite libre de 3 h.
delete from public.visits where id in ('00000000-0000-4000-a000-0000000c1501', '00000000-0000-4000-a000-0000000c1502', '00000000-0000-4000-a000-0000000c1503');
insert into public.visits (id, unit_id, prospect_name, prospect_email, proposed_at, status, kind, ends_at)
select x.id::uuid, u.id, x.nom, x.courriel, (x.debut || ' America/Toronto')::timestamptz, x.statut, x.genre, case when x.fin is not null then (x.fin || ' America/Toronto')::timestamptz end
from (select id from public.units where status in ('available', 'soon_available') order by id limit 1) u,
  (values ('00000000-0000-4000-a000-0000000c1501', 'Léa Tremblay (fictif)', 'lea@exemple.test', '2026-11-05 10:00', 'confirmed', 'visite', null),
          ('00000000-0000-4000-a000-0000000c1502', 'Marc Gagnon (fictif)', 'marc@exemple.test', '2026-11-05 10:15', 'proposed', 'visite', null),
          ('00000000-0000-4000-a000-0000000c1503', null, null, '2026-11-07 13:00', 'confirmed', 'visite_libre', '2026-11-07 16:00')) x(id, nom, courriel, debut, statut, genre, fin);

-- 4. Une inscription d'entreprise « dispatch d'abord » (nom, métiers, secteurs, RBQ), sans fichier.
insert into public.inscriptions_entreprises (id, idempotency_key, courriel, telephone, entreprise, metiers, secteurs, rbq, statut)
values ('00000000-0000-4000-a000-0000000d1501', '00000000-0000-4000-a000-0000000d1502', 'dispatch@plomberie-exemple.test', '4185550142',
        'Plomberie Exemple inc. (fictif)', '{plomberie,degat_eau}', '{Lévis,Québec}', '1234-5678-90', 'recue')
on conflict (id) do update set entreprise = excluded.entreprise, metiers = excluded.metiers, secteurs = excluded.secteurs, rbq = excluded.rbq, statut = 'recue';

select (select count(*) from public.inscriptions_entreprises where id = '00000000-0000-4000-a000-0000000d1501') as inscription, (select count(*) from public.cold_callers where full_name = 'Appelant Démo (fictif)') as appelant,
       (select count(*) from public.approvals where work_order_id in ('00000000-0000-4000-a000-00000009a900', '00000000-0000-4000-a000-00000009a1e3')) as accords,
       (select count(*) from public.visits where id::text like '00000000-0000-4000-a000-0000000c150%') as visites;
commit;
