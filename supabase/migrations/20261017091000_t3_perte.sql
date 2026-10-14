-- T3 · Marquer comme perdu (maquette e14) : les 5 raisons de la maquette, précision, « Relancer dans 6 mois ».
insert into crm.loss_reasons (code, label, sort) values
  ('prix', 'Prix', 1), ('injoignable', 'Pas de réponse', 2), ('garde', 'Garde sa gestion', 3), ('concurrent', 'Concurrent choisi', 4), ('autre', 'Autre', 9)
on conflict (code) do update set label = excluded.label, sort = excluded.sort, active = true;
update crm.loss_reasons set active = false where code in ('deja_gere', 'pas_pret', 'vente', 'hors_territoire');

-- Déplacer, et pour une perte avec relance : tâche du responsable dans 6 mois, liée au deal.
create or replace function public.lanceur_deplacer_deal(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r jsonb; d crm.deals;
begin
  r := crm.move_deal_stage(p);
  if coalesce((p ->> 'relance_6_mois')::boolean, false) and not coalesce((r ->> 'inchange')::boolean, false) then
    select * into d from crm.deals where id = (p ->> 'deal_id')::uuid;
    perform crm.creer_tache(jsonb_build_object('title', 'Relancer ' || d.title, 'context', 'Ventes · relance après perte', 'due_at', now() + interval '6 months',
      'assignee_user_id', coalesce(d.owner_user_id, auth.uid()), 'canal', 'interface') || jsonb_build_object('entity_type', 'crm.deals', 'entity_id', d.id));
    update crm.tasks set deal_id = d.id where entity_type = 'crm.deals' and entity_id = d.id and deal_id is null;
  end if;
  return r;
end $$;
revoke all on function public.lanceur_deplacer_deal(jsonb) from public, anon;
grant execute on function public.lanceur_deplacer_deal(jsonb) to authenticated;
