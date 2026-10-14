-- TP jalon 4 · Invitation d'essai (PRÉPRODUCTION SEULEMENT, rejouable) : Julie Lévesque (univers fictif, 1180 Cartier — 1) reçoit le code
-- LL-ESSA-IJUL pour essayer l'inscription A2 de bout en bout; Claire Comptable (claire.essai@leaselane.test) reçoit LL-ESSA-ICPT, accès comptabilité
-- (lecture seulement) chez Marie-Josée Bérubé. Rejouer remet tout à zéro (comptes supprimés, liens retirés, nouveaux codes; demandes d'essai retirées).
do $$
declare v_t uuid; v_u uuid; v_o uuid; v_c uuid;
begin
  if exists (select 1 from public.owners where full_name not like 'Préprod%' and full_name <> 'Marie-Josée Bérubé') then
    raise exception 'Base avec de vrais propriétaires : essai refusé (préproduction seulement).';
  end if;
  select id into v_t from public.tenants where full_name = 'Julie Lévesque' limit 1;
  if v_t is null then raise notice 'Univers des maquettes absent : essai ignoré.'; return; end if;
  select id into v_u from auth.users where email = 'julie.levesque@leaselane.test';
  update public.tenants set user_id = null, email = 'julie.levesque@leaselane.test' where id = v_t;
  if v_u is not null then delete from auth.users where id = v_u; end if;
  delete from public.portal_invitations where code = 'LL-ESSA-IJUL' or tenant_id = v_t;
  insert into public.portal_invitations (code, kind, email, full_name, tenant_id) values ('LL-ESSA-IJUL', 'locataire', 'julie.levesque@leaselane.test', 'Julie Lévesque', v_t);
  select id into v_o from public.owners where full_name = 'Marie-Josée Bérubé';
  select id into v_c from auth.users where email = 'claire.essai@leaselane.test';
  delete from public.owner_members where owner_id = v_o and (user_id = v_c or full_name like '%(essai)%');
  if v_c is not null then delete from auth.users where id = v_c; end if;
  delete from public.portal_invitations where code = 'LL-ESSA-ICPT' or (owner_id = v_o and email like '%essai@leaselane.test');
  insert into public.portal_invitations (code, kind, email, full_name, owner_id) values ('LL-ESSA-ICPT', 'comptable', 'claire.essai@leaselane.test', 'Claire Comptable', v_o);
  delete from public.tenant_proposals where owner_id = v_o and full_name like '%(essai)%';
end $$;
select code, email, expires_at::date from public.portal_invitations where code in ('LL-ESSA-IJUL', 'LL-ESSA-ICPT');
