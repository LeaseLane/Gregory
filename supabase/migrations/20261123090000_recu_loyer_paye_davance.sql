-- Portail locataire (essai complet du 23 nov. 2026) : un loyer payé d'avance (le 22 nov. pour le 1er déc.) n'apparaissait pas dans
-- l'historique avant son échéance, donc son reçu n'était joignable que par l'avis. L'historique montre aussi les loyers déjà payés.
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.portail_locataire_paiements()'::regprocedure);
  if position('or p.status = ''paid''' in d) > 0 then return; end if;
  n := replace(d, 'from public.payments p where p.lease_id = any (v_baux) and p.due_date <= current_date)',
                  'from public.payments p where p.lease_id = any (v_baux) and (p.due_date <= current_date or p.status = ''paid''))');
  if n = d then raise exception 'portail_locataire_paiements : ancre introuvable'; end if;
  execute n;
end $$;
