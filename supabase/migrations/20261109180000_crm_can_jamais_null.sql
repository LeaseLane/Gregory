-- Faille corrigée : crm.can() et crm.has_role() rendaient NULL (et non faux) pour une personne hors de l'équipe (crm.role_actuel() nul).
-- Dans les fonctions, « if not crm.can(...) then raise » ne levait donc rien : un compte qui n'est pas de l'équipe mais connecté avec
-- son code (propriétaire au portail, aal2) passait les gardes des fonctions lanceur_*. Les politiques RLS n'étaient pas touchées (NULL y
-- vaut refus). Trouvé par le test de la prospection par le rôle (2026-10-29). Mêmes règles, réponse toujours vraie ou fausse.
create or replace function crm.can(p_permission text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(crm.role_actuel() = 'admin'
      or exists (select 1 from crm.role_permissions rp where rp.role = crm.role_actuel() and rp.permission = p_permission), false);
$$;

create or replace function crm.has_role(p_role text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(crm.role_actuel() = p_role, false);
$$;
