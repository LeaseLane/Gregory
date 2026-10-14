-- T1 · Lecture des propositions par un agent (MCP, spec § 6) : un agent ne voit que SES propositions,
-- sans avant/après complets ni données de la personne qui décide. Clé de service seulement (la fonction
-- edge « mcp » a déjà authentifié l'agent par son secret).
create or replace function public.lanceur_agent_propositions(p_agent text, p_id uuid default null, p_statut text default null) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', pr.id, 'operation', pr.operation, 'status', pr.status, 'target_id', pr.target_id, 'after', pr.after,
    'reason', pr.reason, 'source_type', pr.source_type, 'confidence', pr.confidence, 'created_at', pr.created_at,
    'expires_at', pr.expires_at, 'decided_at', pr.decided_at, 'rejection_reason', rr.label_fr, 'decision_note', pr.decision_note,
    'apply_error', pr.apply_error, 'edited', pr.edited_after is not null
  ) order by pr.created_at desc), '[]'::jsonb)
  from crm.proposals pr left join crm.rejection_reasons rr on rr.code = pr.rejection_reason_code
  where pr.agent = p_agent and (p_id is null or pr.id = p_id) and (p_statut is null or pr.status = p_statut);
$$;
revoke all on function public.lanceur_agent_propositions(text, uuid, text) from public, anon, authenticated;
grant execute on function public.lanceur_agent_propositions(text, uuid, text) to service_role;
