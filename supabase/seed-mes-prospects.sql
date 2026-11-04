-- Préproduction : défait l'essai d'un prospecteur hors équipe (appelant-demo@leaselane.test) et rend « Appelant Démo (fictif) »
-- au compte de rôle « prospection », responsable des deals de ses prospects (Ventes › Mes prospects). Rejouable.
begin;
update public.cold_callers c set user_id = u.id, email = u.email from auth.users u
 where u.email = 'equipe-prospection@leaselane.test' and c.full_name = 'Appelant Démo (fictif)';
delete from auth.users where email = 'appelant-demo@leaselane.test';
update crm.deals d set owner_user_id = (select id from auth.users where email = 'equipe-prospection@leaselane.test'), updated_at = now()
  from public.prospects p join public.cold_callers c on c.id = coalesce(p.created_by_caller_id, p.assigned_caller_id)
 where d.prospect_id = p.id and c.full_name = 'Appelant Démo (fictif)';
select d.title, crm.nom_membre(d.owner_user_id) as responsable from crm.deals d join public.prospects p on p.id = d.prospect_id
 join public.cold_callers c on c.id = coalesce(p.created_by_caller_id, p.assigned_caller_id) where c.full_name = 'Appelant Démo (fictif)';
commit;
