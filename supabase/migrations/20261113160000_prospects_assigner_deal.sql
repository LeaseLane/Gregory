-- Assigner / retirer : le deal suit l'assignation dans les deux sens (sync_deal ne fait que poser un nouveau responsable, jamais l'enlever).
-- Retiré ou réassigné à un appelant hors équipe : le nom d'un prospecteur est enlevé du deal; celui d'un gestionnaire n'est jamais touché.
-- Copie de 20261113150000 + la mise à jour des deals.
create or replace function public.lanceur_prospects_assigner(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_caller uuid := nullif(p ->> 'caller_id', '')::uuid; c public.cold_callers; v_ids uuid[]; n int; v_user uuid;
begin
  perform crm.require_aal2();
  if not crm.can('ventes.mandats.ecrire') then raise exception 'Votre rôle ne permet pas d’assigner des prospects.' using errcode = 'PT403'; end if;
  v_ids := array(select (x)::uuid from jsonb_array_elements_text(coalesce(p -> 'ids', '[]'::jsonb)) x);
  if cardinality(v_ids) = 0 then raise exception 'Choisissez au moins un prospect.' using errcode = 'PT422'; end if;
  if cardinality(v_ids) > 500 then raise exception 'Au plus 500 prospects à la fois.' using errcode = 'PT422'; end if;
  if v_caller is not null then
    select * into c from public.cold_callers where id = v_caller;
    if not found then raise exception 'Prospecteur introuvable.' using errcode = 'PT404'; end if;
    if not coalesce(c.active, true) then raise exception 'Ce prospecteur est inactif.' using errcode = 'PT409'; end if;
  end if;
  update public.prospects set assigned_caller_id = v_caller where id = any (v_ids) and archived_at is null and anonymized_at is null;
  get diagnostics n = row_count;
  select tm.user_id into v_user from crm.team_members tm where tm.user_id = c.user_id and tm.active and tm.removed_at is null;
  update crm.deals d set owner_user_id = v_user, updated_at = now()
   where d.prospect_id = any (v_ids) and d.owner_user_id is distinct from v_user
     and (v_user is not null or exists (select 1 from crm.team_members tm where tm.user_id = d.owner_user_id and tm.role = 'prospection'));
  if v_caller is not null and c.user_id is not null and n > 0 then
    perform crm.notifier(array[c.user_id], 'info', 'trend', n || ' prospect' || case when n > 1 then 's' else '' end || ' à appeler',
      'Assigné' || case when n > 1 then 's' else '' end || ' par ' || coalesce(crm.nom_membre(auth.uid()), 'l’équipe'), null, '/ventes/mes-prospects', 'public.cold_callers', c.id);
  end if;
  perform crm.journal(case when v_caller is null then 'prospect.unassigned' else 'prospect.assigned' end, 'public.cold_callers', v_caller, null,
    jsonb_build_object('prospects', n, 'prospecteur', c.full_name), 'assign-prospects');
  return jsonb_build_object('n', n);
end $$;
