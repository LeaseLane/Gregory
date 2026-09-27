-- Suivi d'une demande côté locataire : qui vient, quand, où en est le
-- travail. Le locataire n'a pas accès à work_orders (paie, coordination…)
-- ni à la fiche du travailleur (courriel, téléphone) : cette fonction ne
-- lui rend que ce qu'il doit savoir, pour ses propres demandes.
create or replace function public.mes_suivis_demandes()
returns table (
  service_request_id uuid, statut_travail text, rendez_vous timestamptz, reponse_travailleur text,
  professionnel text, metier text, termine_le timestamptz, confirme boolean,
  approbation text, recherche_depuis timestamptz, cree_le timestamptz
)
language sql stable security definer set search_path = public
as $$
  select wo.service_request_id, wo.status, wo.appointment_at, wo.worker_response,
         coalesce(nullif(w.company_name, ''), w.name), w.specialty,
         wo.worker_reported_done_at, wo.tenant_confirmed,
         (select a.status from approvals a where a.work_order_id = wo.id order by a.created_at desc limit 1),
         wo.dispatch_started_at, wo.created_at
  from work_orders wo
  join service_requests sr on sr.id = wo.service_request_id
  left join workers w on w.id = wo.worker_id
  where sr.tenant_id = auth_tenant_id()
$$;
revoke all on function public.mes_suivis_demandes() from public, anon;
grant execute on function public.mes_suivis_demandes() to authenticated;
