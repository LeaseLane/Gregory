-- Rapports d'équipe (maquette e59) : tâches faites par semaine sur 12 semaines et délai de réponse médian dans l'Inbox, par personne.
-- Délai de réponse : entre un message reçu d'un contact et la première réponse de l'équipe dans le même fil (30 derniers jours).
create or replace function public.lanceur_rapport_equipe_semaines() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_s date := (date_trunc('week', now() at time zone 'America/Toronto') - interval '11 weeks')::date;
begin
  perform crm.require_aal2();
  if not crm.can('rapports.lire') then raise exception 'Votre rôle ne donne pas accès aux rapports.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'debut', v_s,
    'personnes', coalesce((select jsonb_agg(jsonb_build_object('user_id', tm.user_id,
        'semaines', (select jsonb_agg((select count(*) from crm.tasks t where t.done_by = tm.user_id and t.status = 'done'
                                        and (t.done_at at time zone 'America/Toronto')::date >= w and (t.done_at at time zone 'America/Toronto')::date < w + 7) order by w)
                     from generate_series(v_s, v_s + 77, interval '7 days') g(w0), lateral (select g.w0::date w) x),
        'delai_minutes', (select round((percentile_cont(0.5) within group (order by extract(epoch from r.reponse - r.recu) / 60))::numeric)
                          from (select m.created_at recu, (select min(o.created_at) from crm.conversation_messages o where o.conversation_id = m.conversation_id
                                  and o.author = 'team' and o.created_at > m.created_at) reponse,
                                (select o.author_user_id from crm.conversation_messages o where o.conversation_id = m.conversation_id and o.author = 'team' and o.created_at > m.created_at
                                  order by o.created_at limit 1) par
                                from crm.conversation_messages m where m.author = 'contact' and m.created_at > now() - interval '30 days') r
                          where r.par = tm.user_id and r.reponse is not null)))
      from crm.team_members tm where tm.active and tm.removed_at is null), '[]'::jsonb));
end $$;
revoke all on function public.lanceur_rapport_equipe_semaines() from public, anon;
grant execute on function public.lanceur_rapport_equipe_semaines() to authenticated;
