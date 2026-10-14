-- T8a · Juridique de démonstration (maquette l16), préproduction seulement. Rejouable.
-- Révision du modèle CONSIGNÉE POUR LA PRÉPRODUCTION (en production, seul un admin la consigne après la vraie révision de l'avocate).
update jur.templates set reviewed_by_lawyer = 'Révision fictive (préproduction)', reviewed_on = current_date where code = 'mise_en_demeure_loyer' and version = 1 and reviewed_by_lawyer is null;
insert into public.buildings (id, address) values ('00000000-0000-4000-d000-0000000009b1', '640, 3e Avenue, Québec') on conflict (id) do nothing;
insert into public.units (id, building_id, unit_number, status) values ('00000000-0000-4000-d000-0000000009b2', '00000000-0000-4000-d000-0000000009b1', '7', 'occupied') on conflict (id) do nothing;
insert into public.tenants (id, full_name, email) values ('00000000-0000-4000-d000-0000000009b3', 'Gabriel Paquet', 'gabriel.paquet@exemple.test') on conflict (id) do nothing;
insert into public.leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status)
select '00000000-0000-4000-d000-0000000009b4', '00000000-0000-4000-d000-0000000009b2', '00000000-0000-4000-d000-0000000009b3', current_date - 320, current_date + 260, 1195, 'active'
where not exists (select 1 from public.leases where id = '00000000-0000-4000-d000-0000000009b4');
-- Historique : à l'heure, sauf un retard de 6 jours il y a 7 mois; ce mois-ci impayé depuis 12 jours.
delete from public.payments where lease_id = '00000000-0000-4000-d000-0000000009b4';
insert into public.payments (lease_id, amount, due_date, paid_date, status, amount_received)
select '00000000-0000-4000-d000-0000000009b4', 1195, (current_date - 12 - make_interval(months => m))::date, (current_date - 12 - make_interval(months => m))::date + case when m = 7 then 6 else 0 end, 'paid', 1195
from generate_series(1, 10) m;
insert into public.payments (lease_id, amount, due_date, status) values ('00000000-0000-4000-d000-0000000009b4', 1195, current_date - 12, 'late');
select c.numero, c.stage from jur.cases c where c.lease_id = '00000000-0000-4000-d000-0000000009b4';
