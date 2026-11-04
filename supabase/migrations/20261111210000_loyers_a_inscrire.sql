-- Fiche locataire : « Marquer un loyer payé » (Grégory, 2026-11-04). Les loyers encore dus du locataire (bail principal ou colocataire),
-- échus ou du mois qui vient. L'inscription passe par lanceur_paiement_payer (finances.paiements.ecrire, 2FA, partiel permis, journal).
create or replace function public.lanceur_locataire_loyers_dus(p_tenant uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('clients.lire') then raise exception 'Votre rôle ne donne pas accès aux clients.' using errcode = 'PT403'; end if;
  return jsonb_build_object('peut_inscrire', crm.can('finances.paiements.ecrire'),
    'loyers', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'echeance', p.due_date, 'montant', p.amount, 'recu', coalesce(p.amount_received, 0)) order by p.due_date)
      from public.payments p join public.leases l on l.id = p.lease_id
      where (l.tenant_id = p_tenant or exists (select 1 from public.lease_tenants lt where lt.lease_id = l.id and lt.tenant_id = p_tenant))
        and p.status <> 'paid' and p.due_date <= current_date + 31), '[]'::jsonb));
end $$;
revoke all on function public.lanceur_locataire_loyers_dus(uuid) from public, anon;
grant execute on function public.lanceur_locataire_loyers_dus(uuid) to authenticated;
