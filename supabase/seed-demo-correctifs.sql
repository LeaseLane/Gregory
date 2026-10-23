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
-- Propositions de la maquette l02 restées en attente (seed-propositions-maquettes) : expirées par l'horloge, remises en attente une semaine.
update crm.proposals set status = 'pending', expires_at = now() + interval '7 days', apply_error = null
where idempotency_key in ('maquette:roy-qualifie', 'maquette:mroy-suivi', 'maquette:beaulieu-contacte') and status = 'expired' and decided_at is null;
-- Loyers de novembre (e40 « Prochains prélèvements », portails « Prochain loyer ») : à venir pour chaque bail actif qui n'en a pas.
alter table public.payments disable trigger notif_locataire;
insert into public.payments (lease_id, amount, due_date, status, amount_received, collection_status, created_at)
select l.id, l.monthly_rent, date '2026-11-01', 'pending', 0,
       case when exists (select 1 from public.tenant_pad_authorizations p where p.lease_id = l.id and p.status = 'active') then 'scheduled' else 'manual' end, now()
from public.leases l where l.status = 'active' and not exists (select 1 from public.payments pa where pa.lease_id = l.id and pa.due_date = date '2026-11-01');
alter table public.payments enable trigger notif_locataire;
-- Rapports d'équipe (e59) : 12 semaines de tâches faites par l'équipe de démonstration (fictives, marquées demo-e59).
insert into crm.tasks (title, context, due_at, due_all_day, assignee_user_id, status, done_at, done_by, source, entity_type, created_at)
select (array['Relancer le locataire', 'Confirmer la visite', 'Envoyer le bail', 'Vérifier la facture', 'Appeler le fournisseur', 'Mettre à jour la fiche', 'Répondre au propriétaire', 'Planifier l’inspection'])[1 + (k % 8)],
       'Démo · historique', d - interval '2 hours', false, tm.user_id, 'done', d, tm.user_id, 'manual', 'demo-e59', d - interval '1 day'
from crm.team_members tm
join (values ('Julie Normandeau', 20), ('Camille Desrosiers', 17), ('Laurence Pelletier', 13), ('Admin Démo', 6)) as p(nom, base) on p.nom = tm.display_name
cross join generate_series(0, 11) s(sem)
cross join lateral generate_series(1, greatest(1, p.base - 6 + s.sem / 2 + (abs(hashtext(p.nom || s.sem)) % 4))) k
cross join lateral (select (date_trunc('week', now()) - make_interval(weeks => 11 - s.sem) + make_interval(hours => 9 + (k % 8), days => k % 5)) d) x
where x.d < now() and not exists (select 1 from crm.tasks where entity_type = 'demo-e59');
-- Olivier Dion et Josée Lemieux : versement d'octobre reçu à la banque, en attente de rapprochement (e42) : rappels de loyer en pause.
update public.payments pa set reminder_paused = true
from public.leases l join public.tenants t on t.id = l.tenant_id
where pa.lease_id = l.id and t.full_name in ('Olivier Dion', 'Josée Lemieux') and pa.due_date = date '2026-10-01' and pa.status <> 'paid' and not coalesce(pa.reminder_paused, false);
-- e11 : la proposition de Cléo sur Investissements Roy porte aussi la valeur, la prochaine tâche, l'échéance et les portes.
update crm.proposals pr set
  after = jsonb_build_object('stage', 'interested', 'potential_monthly_revenue', 1140, 'next_action', 'Proposition de gestion',
                             'next_followup_date', ((now() at time zone 'America/Toronto')::date + 5)::text, 'num_doors', 6),
  before = (select jsonb_build_object('stage', p.stage, 'potential_monthly_revenue', p.potential_monthly_revenue, 'next_action', p.next_action,
                                      'next_followup_date', p.next_followup_date, 'num_doors', p.num_doors) from public.prospects p where p.id = pr.target_id)
where pr.idempotency_key = 'maquette:roy-qualifie' and pr.status = 'pending' and not pr.after ? 'num_doors';
-- Mise en demeure de démonstration : signée au nom d'Admin Démo plutôt que d'un compte de tests automatiques.
update jur.notices set signer_name = 'Admin Démo', body = replace(body, signer_name, 'Admin Démo') where status = 'draft' and signer_name like '%@%';
update crm.proposals pr set after = jsonb_set(after, '{body}', to_jsonb(n.body)) from jur.notices n where pr.id = n.proposal_id and pr.status = 'pending' and n.status = 'draft' and pr.after ->> 'body' <> n.body;
