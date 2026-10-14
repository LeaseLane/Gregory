-- T7 · « Fil assigné » par un traitement automatique : « Par le système » (et non « une autre personne »).
create or replace function crm.notif_fil_assigne() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.assignee_user_id is not null and new.assignee_user_id is distinct from old.assignee_user_id then
    perform crm.notifier(array[new.assignee_user_id], 'info', 'inbox', 'Fil assigné · ' || new.display_name, coalesce(new.last_preview, ''),
      case when new.handoff_summary is not null and new.handoff_at > now() - interval '1 minute' then 'Cléo a passé la main' else case when auth.uid() is null then 'Par le système' else 'Par ' || crm.nom_membre(auth.uid()) end end,
      '/operations/inbox/' || new.id, 'crm.conversations', new.id);
  end if;
  return new;
end $$;
