-- Prospecteurs (Grégory, 2026-11-05 : « j'ai pas réussi à créer un compte » de prospecteur). Un prospecteur est un membre de l'équipe
-- au rôle « prospection » : Ventes › Prospecteurs › « Ajouter un prospecteur » envoie l'invitation d'équipe (lanceur_inviter_equipe).
-- Dès qu'il fait partie de l'équipe, il a sa fiche d'appelant (cold_callers) : il paraît dans Ventes › Prospecteurs et les prospects
-- qu'on lui assigne arrivent à son nom dans le pipeline (crm.creer_deal_prospect) et dans son onglet « Mes prospects ».
-- Retiré de l'équipe ou passé à un autre rôle : sa fiche d'appelant devient inactive (rien n'est effacé).
create or replace function crm.prospecteur_depuis_equipe() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role = 'prospection' and new.active and new.removed_at is null then
    update public.cold_callers set active = true, full_name = new.display_name where user_id = new.user_id;
    if not found then
      insert into public.cold_callers (user_id, full_name, email, phone, active)
      select new.user_id, new.display_name, u.email, new.phone, true from auth.users u where u.id = new.user_id;
    end if;
  else
    update public.cold_callers set active = false where user_id = new.user_id and active;
  end if;
  return new;
end $$;
drop trigger if exists prospecteur_depuis_equipe on crm.team_members;
create trigger prospecteur_depuis_equipe after insert or update of role, active, removed_at, display_name on crm.team_members
  for each row execute function crm.prospecteur_depuis_equipe();

-- Membres « prospection » déjà dans l'équipe : leur fiche d'appelant.
insert into public.cold_callers (user_id, full_name, email, phone, active)
select tm.user_id, tm.display_name, u.email, tm.phone, true from crm.team_members tm join auth.users u on u.id = tm.user_id
where tm.role = 'prospection' and tm.active and tm.removed_at is null and not exists (select 1 from public.cold_callers c where c.user_id = tm.user_id);
