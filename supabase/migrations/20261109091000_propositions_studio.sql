-- « À approuver » nomme la campagne ou la source visée par une proposition du Studio (adjust-campaign, adjust-source-budget).
create or replace function public.lanceur_propositions(p_statut text default 'pending') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.is_team_member() then raise exception 'Réservé à l''équipe Lease Lane.' using errcode = 'PT403'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', pr.id, 'agent', pr.agent, 'operation', pr.operation, 'espace', pr.espace, 'status', pr.status,
      'target_id', pr.target_id, 'cible', case when pr.target_table = 'public.prospects'::regclass then
        (select coalesce(nullif(pp.company_name, ''), pp.full_name) from public.prospects pp where pp.id = pr.target_id)
        when pr.target_table = 'crm.campagnes'::regclass then (select c.nom from crm.campagnes c where c.id = pr.target_id)
        when pr.target_table = 'crm.sources'::regclass then (select so.name from crm.sources so where so.id = pr.target_id) end,
      'read_version', pr.read_version, 'before', pr.before, 'after', pr.after, 'edited_after', pr.edited_after,
      'reason', pr.reason, 'source_type', pr.source_type, 'source_ref', pr.source_ref, 'source_excerpt', pr.source_excerpt,
      'confidence', pr.confidence, 'labels', reg.field_labels, 'created_at', pr.created_at, 'expires_at', pr.expires_at,
      'decided_by', crm.nom_membre(pr.decided_by), 'decided_at', pr.decided_at, 'rejection_reason_code', pr.rejection_reason_code,
      'apply_error', pr.apply_error, 'peut_decider', crm.can(pr.permission)
    ) order by pr.created_at desc)
    from crm.proposals pr join crm.operation_registry reg on reg.name = pr.operation
    where (p_statut = 'tout' or pr.status = p_statut) and (crm.can(pr.permission) or pr.assignee_user_id = auth.uid())), '[]'::jsonb);
end $$;
