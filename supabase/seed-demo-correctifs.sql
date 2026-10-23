-- Démo (préproduction) : correctifs sur les données fictives déjà insérées par seed-demo-univers-admin.sql.
-- La confiance de rapprochement se lit sur 100 (reconcile-bank-transactions), pas sur 1.
\set ON_ERROR_STOP on
update public.bank_transactions set ai_confidence = ai_confidence * 100 where external_id like 'DEMO-%' and ai_confidence <= 1;
update public.bank_transactions set match_confidence = match_confidence * 100 where external_id like 'DEMO-%' and match_confidence <= 1;
-- Contacts des deals de la démo : un numéro chacun (le seed tirait le numéro de la longueur du nom : faux doublons dans « Leads entrants »).
update crm.contacts c set phones_e164 = array['+1418556' || lpad((1000 + z.rn)::text, 4, '0')], updated_at = now()
from (select c2.id, row_number() over (order by c2.created_at, c2.id) rn from crm.contacts c2
      where exists (select 1 from crm.deal_contacts dc where dc.contact_id = c2.id)
        and exists (select 1 from crm.contacts c3 where c3.id <> c2.id and c3.phones_e164 && c2.phones_e164 and cardinality(c2.phones_e164) > 0)) z
where c.id = z.id;
-- Délai de première réponse des fournisseurs (e34) : offres acceptées pour les bons de la démo, au délai médian de la maquette.
insert into public.job_offers (work_order_id, worker_id, tier, status, sent_at, responded_at, created_at)
select w.id, w.worker_id, 1, 'accepted', w.created_at, w.created_at + make_interval(secs => 3600 * coalesce(d.h, 3)), w.created_at
from public.work_orders w join public.workers wk on wk.id = w.worker_id
left join (values ('Électrique Duval', 1.2), ('Plomberie Capitale', 2.5), ('Thermo-Pro', 3.0), ('Les Plombiers de Lévis', 4.0), ('Toitures Beauport', 6.0),
                  ('Serrurerie Express', 9.0), ('Déneigement Côté', 14.0), ('Menuiserie Lauzon', 5.0)) as d(n, h) on d.n = wk.name
where w.id::text ~ '^0[01][0-9]{2}' and not exists (select 1 from public.job_offers o where o.work_order_id = w.id);
