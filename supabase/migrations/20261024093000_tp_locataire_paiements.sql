-- TP · Locataire 3 : l'écran 08 compte l'année et l'historique sur tous les baux du locataire (bail précédent compris);
-- l'historique ne montre que les loyers échus (le prochain est dans sa carte).

create or replace function public.portail_locataire_paiements() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); v_l uuid; v_baux uuid[]; pad record; v_prochain record;
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  v_l := crm.bail_locataire(v_t); v_baux := array(select id from public.leases where tenant_id = v_t);   -- l'année et l'historique couvrent aussi le bail précédent
  select * into pad from public.tenant_pad_authorizations where tenant_id = v_t and status = 'active' and revoked_at is null order by consented_at desc nulls last limit 1;
  select * into v_prochain from public.payments where lease_id = v_l and status <> 'paid' order by due_date limit 1;
  return jsonb_build_object(
    'prochain', case when v_prochain.id is not null then jsonb_build_object('echeance', v_prochain.due_date, 'montant', v_prochain.amount - coalesce(v_prochain.amount_received, 0),
      'en_retard', v_prochain.due_date < current_date, 'jours', current_date - v_prochain.due_date, 'echec', v_prochain.collection_status = 'failed') end,
    'annee', jsonb_build_object('paye', coalesce((select sum(amount_received) from public.payments where lease_id = any (v_baux) and status = 'paid' and extract(year from due_date) = extract(year from current_date)), 0),
      'loyers', (select count(*) from public.payments where lease_id = any (v_baux) and status = 'paid' and extract(year from due_date) = extract(year from current_date)),
      'prevus', (select count(*) from public.payments where lease_id = any (v_baux) and extract(year from due_date) = extract(year from current_date))),
    'retards', (select count(*) from public.payments where lease_id = any (v_baux) and coalesce(paid_date, current_date) > due_date + 1 and due_date < current_date),
    'en_retard', (select coalesce(sum(amount - coalesce(amount_received, 0)), 0) from public.payments where lease_id = any (v_baux) and status <> 'paid' and due_date < current_date),
    'historique', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'periode', p.due_date, 'recu_le', p.paid_date, 'mode', case when p.collection_status = 'collected' then 'Prélèvement' when p.status = 'paid' then 'Virement' end,
        'montant', p.amount, 'statut', case when p.status = 'paid' then 'paye' when p.due_date < current_date then 'retard' else 'a_venir' end) order by p.due_date desc)
      from public.payments p where p.lease_id = any (v_baux) and p.due_date <= current_date), '[]'::jsonb),
    'mode', case when pad.id is not null then jsonb_build_object('type', 'prelevement', 'depuis', pad.consented_at, 'compte', pad.notes) else jsonb_build_object('type', 'virement') end,
    'interac', (select c.courriel_interac from public.consigne_paiement_locataire() c limit 1),
    'reference', (select c.reference_paiement from public.consigne_paiement_locataire() c limit 1),
    'releve31', (select jsonb_build_object('id', d.id) from public.documents d where d.tenant_id = v_t and d.category = 'Relevé 31' and extract(year from d.created_at) = extract(year from current_date) limit 1));
end $$;

revoke all on function public.portail_locataire_paiements() from public, anon;
grant execute on function public.portail_locataire_paiements() to authenticated;
