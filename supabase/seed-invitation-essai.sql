-- TP jalon 4 · Invitation d'essai (PRÉPRODUCTION SEULEMENT, rejouable) : Julie Lévesque (univers fictif, 1180 Cartier — 1) reçoit le code
-- LL-ESSA-IJUL pour essayer l'inscription A2 de bout en bout. Rejouer remet tout à zéro (compte supprimé, locataire délié, nouveau code).
do $$
declare v_t uuid; v_u uuid;
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
end $$;
select code, email, expires_at::date from public.portal_invitations where code = 'LL-ESSA-IJUL';
