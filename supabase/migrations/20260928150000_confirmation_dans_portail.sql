-- Le locataire peut confirmer (ou non) la réparation directement dans son
-- portail, sans passer par le lien du courriel : le suivi lui rend l'id du
-- travail et le jeton de confirmation — le même qu'on lui envoie déjà par
-- courriel, et seulement pour ses propres demandes.
drop function if exists public.mes_suivis_demandes();
create function public.mes_suivis_demandes()
returns table (
  service_request_id uuid, statut_travail text, rendez_vous timestamptz, reponse_travailleur text,
  professionnel text, metier text, termine_le timestamptz, confirme boolean,
  approbation text, recherche_depuis timestamptz, cree_le timestamptz,
  work_order_id uuid, jeton_confirmation text
)
language sql stable security definer set search_path = public
as $$
  select wo.service_request_id, wo.status, wo.appointment_at, wo.worker_response,
         coalesce(nullif(w.company_name, ''), w.name), w.specialty,
         wo.worker_reported_done_at, wo.tenant_confirmed,
         (select a.status from approvals a where a.work_order_id = wo.id order by a.created_at desc limit 1),
         wo.dispatch_started_at, wo.created_at,
         wo.id, case when wo.worker_reported_done_at is not null and wo.tenant_confirmed is null then wo.tenant_confirmation_token::text end
  from work_orders wo
  join service_requests sr on sr.id = wo.service_request_id
  left join workers w on w.id = wo.worker_id
  where sr.tenant_id = auth_tenant_id()
$$;
revoke all on function public.mes_suivis_demandes() from public, anon;
grant execute on function public.mes_suivis_demandes() to authenticated;
