-- T4 · Renouvellements de démonstration (maquette l09), préproduction seulement. Valide les délais légaux EN PRÉPRODUCTION
-- (en production, seul un admin les valide après l'avis du juridique). Aucun avis LOC-10 n'est envoyé. Rejouable.
update config.legal_parameters set validated_by = (select tm.user_id from crm.team_members tm where tm.role = 'admin' and tm.active order by tm.created_at limit 1),
  validated_at = now(), source = source || ' · validé pour la préproduction' where validated_at is null;
do $$
declare b record; n int := 0; pid uuid;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'equipe-gestionnaire@leaselane.test'), 'aal', 'aal2', 'role', 'authenticated')::text, true);
  for b in select l.id, l.monthly_rent from public.leases l where l.status = 'active' and l.end_date between current_date + 90 and current_date + 180
             and not exists (select 1 from crm.processes p where p.lease_id = l.id and p.status = 'active') order by l.end_date limit 4 loop
    begin
      pid := public.lanceur_demarrer_renouvellement(b.id); n := n + 1;
      if n <= 2 then perform public.lanceur_proposer_renouvellement(jsonb_build_object('process_id', pid, 'type', 'augmentation', 'nouveau_loyer', round(b.monthly_rent * 1.031))); end if;
      if n = 1 then perform public.lanceur_approuver_renouvellement(jsonb_build_object('process_id', pid, 'qui', 'proprietaire', 'note', 'Courriel du propriétaire (démo)')); end if;
    exception when others then raise notice 'bail % : %', b.id, sqlerrm;
    end;
  end loop;
end $$;
select p.code, p.step, l.end_date from crm.processes p join public.leases l on l.id = p.lease_id where p.status = 'active' order by l.end_date;
