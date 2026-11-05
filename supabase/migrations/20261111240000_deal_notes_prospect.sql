-- Fiche deal : « Notes et appels » (Grégory, 2026-11-05 : « on a perdu nos notes des prospects avec la mise à jour »).
-- Rien n'a été effacé : l'ancien admin et le portail des prospecteurs écrivaient les notes et l'historique d'appels dans
-- public.prospects (notes, call_history), que la fiche deal du nouvel admin n'affichait pas. Lecture seule, mêmes droits que le deal.
create or replace function public.lanceur_deal_historique(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare d crm.deals; pl crm.pipelines; pr public.prospects;
begin
  select * into d from crm.deals where id = p_id;
  if not found then raise exception 'Deal introuvable.' using errcode = 'PT404'; end if;
  select * into pl from crm.pipelines where id = d.pipeline_id;
  if not crm.can(pl.permission) then raise exception 'Votre rôle ne donne pas accès à ce pipeline.' using errcode = 'PT403'; end if;
  select * into pr from public.prospects where id = d.prospect_id;
  if not found then return jsonb_build_object('notes', null, 'appels', '[]'::jsonb); end if;
  return jsonb_build_object(
    'notes', nullif(btrim(pr.notes), ''),
    'interet', pr.interest_level, 'relance', pr.next_followup_date, 'prochaine_action', pr.next_action,
    'appels', coalesce((select jsonb_agg(jsonb_build_object('le', c ->> 'date', 'resume', coalesce(c ->> 'summary', c ->> 'transcript'), 'prochaine_etape', c ->> 'next_step',
        'objections', c ->> 'objections', 'engagement', c ->> 'commitment', 'interet', c ->> 'interest_level',
        'par', (select cc.full_name from public.cold_callers cc where cc.id::text = c ->> 'caller_id')) order by c ->> 'date' desc)
      from jsonb_array_elements(case when jsonb_typeof(pr.call_history) = 'array' then pr.call_history else '[]'::jsonb end) c), '[]'::jsonb));
end $$;
revoke all on function public.lanceur_deal_historique(uuid) from public, anon;
grant execute on function public.lanceur_deal_historique(uuid) to authenticated;
