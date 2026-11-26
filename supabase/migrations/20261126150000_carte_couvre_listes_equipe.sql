-- Un loyer payé par carte (Moneris), dont le dépôt n'est pas encore arrivé au fidéicommis, n'est plus traité comme impayé
-- dans les vues de l'équipe (26 nov. 2026, alerte vue en prod sur l'essai « Testing Payments ») :
--   1. lanceur_finance_vue : l'alerte « Loyers perçus à x % » compte la carte comme perçue; plus de « en retard » pour ce loyer.
--      Les revenus perçus (KPI, série) restent ceux arrivés à la banque.
--   2. lanceur_paiements : retiré de la liste « En retard ».
--   3. lanceur_rappels : retiré des retards.
--   4. crm.file_a_traiter : pas de tâche « Loyer en retard ».
-- Même mécanique que 20261126090000 (remplacements ancrés; une ancre introuvable arrête la migration).
do $$
declare d text; n text; f text; a text[]; i int;
  r text[][] := array[
    -- [fonction, ancre, remplacement]
    array['public.lanceur_finance_vue(jsonb)', 'count(*) filter (where pa.status <> ''paid'' and pa.due_date < current_date) retards',
          'count(*) filter (where pa.status <> ''paid'' and pa.due_date < current_date and not public.carte_couvre(pa.id)) retards, coalesce(sum(pa.amount - coalesce(pa.amount_received, 0)) filter (where pa.status <> ''paid'' and public.carte_couvre(pa.id)), 0) carte'],
    array['public.lanceur_finance_vue(jsonb)', 'coalesce(l.retards, 0) retards,', 'coalesce(l.retards, 0) retards, coalesce(l.carte, 0) carte,'],
    array['public.lanceur_finance_vue(jsonb)', '100.0 * i.paye / i.attendu < v_pct', '100.0 * (i.paye + i.carte) / i.attendu < v_pct'],
    array['public.lanceur_finance_vue(jsonb)', 'floor(100.0 * n.paye / n.attendu)', 'floor(100.0 * (n.paye + n.carte) / n.attendu)'],
    array['public.lanceur_finance_vue(jsonb)', 'n.attendu - n.paye', 'n.attendu - n.paye - n.carte'],
    array['public.lanceur_paiements(jsonb)', 'pa.status <> ''paid'' and pa.due_date < current_date and l.status = ''active''',
          'pa.status <> ''paid'' and pa.due_date < current_date and l.status = ''active'' and not public.carte_couvre(pa.id)'],
    array['public.lanceur_rappels()', '(p.status <> ''paid'' and p.due_date < current_date)', '(p.status <> ''paid'' and p.due_date < current_date and not public.carte_couvre(p.id))'],
    array['crm.file_a_traiter()', 'pa.status <> ''paid'' and pa.due_date < current_date and not coalesce(pa.reminder_paused, false)',
          'pa.status <> ''paid'' and pa.due_date < current_date and not coalesce(pa.reminder_paused, false) and not public.carte_couvre(pa.id)']];
begin
  foreach f in array array['public.lanceur_finance_vue(jsonb)', 'public.lanceur_paiements(jsonb)', 'public.lanceur_rappels()', 'crm.file_a_traiter()'] loop
    d := pg_get_functiondef(f::regprocedure);
    if position('carte_couvre' in d) > 0 then continue; end if;   -- déjà appliquée
    n := d;
    for i in 1 .. array_length(r, 1) loop
      continue when r[i][1] <> f;
      if position(r[i][2] in n) = 0 then raise exception '% : ancre introuvable (%)', f, left(r[i][2], 60); end if;
      n := replace(n, r[i][2], r[i][3]);
    end loop;
    execute n;
  end loop;
end $$;
