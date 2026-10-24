-- Soumission du chauffe-eau (BT 0000, 1180 Cartier) comme dans la maquette e39, PRÉPRODUCTION SEULEMENT. Rejouable.
-- Retire l'accord du propriétaire et la soumission retenue : « Choisir » ouvre alors la fenêtre « attendre l'accord / urgence ».
\set ON_ERROR_STOP on
begin;
do $$ begin
  if not exists (select 1 from public.owners where full_name = 'Marie-Josée Bérubé') then raise exception 'Pas la base de démonstration : refusé.'; end if;
end $$;
delete from maint.quote_approvals where work_order_id = '00000000-0000-4000-d000-0000000009c1';
update maint.quotes set retenue_le = null, retenue_par = null, status = 'received' where work_order_id = '00000000-0000-4000-d000-0000000009c1' and status <> 'declined';
select count(*) accords from maint.quote_approvals where work_order_id = '00000000-0000-4000-d000-0000000009c1';
commit;
