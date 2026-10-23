-- Modifier puis approuver (maquette e11) : une proposition « passer à une étape » peut aussi porter la valeur mensuelle,
-- la prochaine tâche, son échéance et le nombre de portes. Chaque champ se modifie avant l'approbation; l'écart part au journal.
-- Les champs absents de la proposition ne changent pas (même comportement qu'avant pour les propositions existantes).

update crm.operation_registry set field_labels = field_labels || jsonb_build_object(
  'potential_monthly_revenue', 'Valeur mensuelle', 'next_action', 'Prochaine tâche', 'next_followup_date', 'Échéance', 'num_doors', 'Portes')
where name = 'move-prospect-stage';

create or replace function crm.move_prospect_stage(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare cur public.prospects; v_stage text := p ->> 'stage'; v_apres jsonb;
begin
  perform crm.require_aal2_or_proposal();
  if not crm.can('ventes.mandats.ecrire') then
    raise exception 'Votre rôle ne permet pas de décider dans Ventes.' using errcode = 'PT403';
  end if;
  select * into cur from public.prospects where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Prospect introuvable.' using errcode = 'PT404'; end if;
  if v_stage not in ('new', 'contacted', 'interested', 'proposal_sent', 'signed', 'lost') then
    raise exception 'Étape inconnue : %.', v_stage using errcode = 'PT422';
  end if;
  if p ? 'expected_stage' and cur.stage is distinct from p ->> 'expected_stage' then
    raise exception 'L''étape a changé entre-temps (maintenant : %). Rechargez la fiche.', cur.stage using errcode = 'PT409';
  end if;
  if p ? 'expected_updated_at' and cur.updated_at is distinct from (p ->> 'expected_updated_at')::timestamptz then
    raise exception 'La fiche a changé depuis votre lecture. Rechargez-la; rien n''a été modifié.' using errcode = 'PT409';
  end if;
  if v_stage = 'lost' and coalesce(btrim(p ->> 'loss_reason'), '') = '' then
    raise exception 'Indiquez la raison de la perte.' using errcode = 'PT422';
  end if;
  if nullif(p ->> 'next_followup_date', '') is not null and (p ->> 'next_followup_date')::date < (now() at time zone 'America/Toronto')::date then
    raise exception 'L''échéance ne peut pas être dans le passé.' using errcode = 'PT422';
  end if;
  if nullif(p ->> 'num_doors', '') is not null and ((p ->> 'num_doors')::numeric < 1 or (p ->> 'num_doors')::numeric > 5000) then
    raise exception 'Nombre de portes invalide.' using errcode = 'PT422';
  end if;
  if nullif(p ->> 'potential_monthly_revenue', '') is not null and (p ->> 'potential_monthly_revenue')::numeric < 0 then
    raise exception 'Valeur mensuelle invalide.' using errcode = 'PT422';
  end if;
  update public.prospects set stage = v_stage,
         loss_reason = case when v_stage = 'lost' then p ->> 'loss_reason' else loss_reason end,
         potential_monthly_revenue = case when p ? 'potential_monthly_revenue' then nullif(p ->> 'potential_monthly_revenue', '')::numeric else potential_monthly_revenue end,
         next_action = case when p ? 'next_action' then nullif(btrim(p ->> 'next_action'), '') else next_action end,
         next_followup_date = case when p ? 'next_followup_date' then nullif(p ->> 'next_followup_date', '')::date else next_followup_date end,
         num_doors = case when p ? 'num_doors' then nullif(p ->> 'num_doors', '')::numeric::int else num_doors end
   where id = cur.id;
  v_apres := jsonb_strip_nulls(jsonb_build_object('stage', v_stage,
    'potential_monthly_revenue', case when p ? 'potential_monthly_revenue' then p -> 'potential_monthly_revenue' end,
    'next_action', case when p ? 'next_action' then p -> 'next_action' end,
    'next_followup_date', case when p ? 'next_followup_date' then p -> 'next_followup_date' end,
    'num_doors', case when p ? 'num_doors' then p -> 'num_doors' end));
  perform crm.journal('prospect.stage_change', 'prospects', cur.id,
    crm.pick(to_jsonb(cur), v_apres), v_apres, 'move-prospect-stage',
    p_proposal_id => nullif(current_setting('crm.proposal_id', true), '')::uuid);
  return jsonb_build_object('id', cur.id, 'stage', v_stage);
end $$;
