-- T1 · « Prochaine action » éditable : le déclencheur on_prospect_change la recalculait à CHAQUE mise à jour
-- d'après l'étape, ce qui écrasait aussitôt toute valeur écrite (constaté en préproduction le 2026-10-14 :
-- « Appeler lundi avec l'estimation », approuvé, est devenu « Qualifier l'intérêt (appel de suivi) »).
-- Corps repris de la référence de schéma; seul le bloc next_action change.
CREATE OR REPLACE FUNCTION "public"."compute_prospect_derived_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_filled int := 0;
  v_total int := 6;
begin
  if new.full_name is not null and new.full_name <> '' then v_filled := v_filled + 1; end if;
  if new.email is not null and new.email <> '' then v_filled := v_filled + 1; end if;
  if new.phone is not null and new.phone <> '' then v_filled := v_filled + 1; end if;
  if new.company_name is not null and new.company_name <> '' then v_filled := v_filled + 1; end if;
  if new.num_doors is not null then v_filled := v_filled + 1; end if;
  if new.avg_rent is not null then v_filled := v_filled + 1; end if;
  new.completeness_score := round((v_filled::numeric / v_total) * 100);

  new.signing_probability := case new.stage
    when 'signed' then 100
    when 'lost' then 0
    when 'proposal_sent' then case new.interest_level when 'chaud' then 70 when 'tiede' then 45 when 'froid' then 20 else 50 end
    when 'interested' then case new.interest_level when 'chaud' then 55 when 'tiede' then 30 when 'froid' then 10 else 35 end
    when 'contacted' then case new.interest_level when 'chaud' then 35 when 'tiede' then 20 when 'froid' then 5 else 20 end
    else 10
  end;

  -- T1 : « prochaine action » est éditable (personne ou proposition approuvée). On ne la recalcule
  -- qu'à la création, quand l'étape change, ou si elle est vide; sinon on garde ce qui a été écrit.
  if tg_op = 'INSERT' or new.stage is distinct from old.stage or coalesce(btrim(new.next_action), '') = '' then
  new.next_action := case new.stage
    when 'new' then 'Premier contact à effectuer'
    when 'contacted' then 'Qualifier l''intérêt (appel de suivi)'
    when 'interested' then 'Envoyer une proposition/soumission'
    when 'proposal_sent' then 'Relancer pour obtenir la décision'
    when 'signed' then 'Amorcer l''onboarding du nouveau client'
    when 'lost' then 'Aucune action — dossier fermé'
    else null
  end;
  end if;

  if new.potential_monthly_revenue is not null then
    new.vendor_commission_estimate := round(new.potential_monthly_revenue * 0.10 * 100) / 100;
  end if;

  return new;
end;
$$;
