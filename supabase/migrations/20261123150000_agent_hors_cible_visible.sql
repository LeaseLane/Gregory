-- Prospection IA : un immeuble dont l'agent trouve un propriétaire hors cible (FPI, résidence pour aînés, office d'habitation…)
-- disparaissait de la liste sans laisser de trace (ni dans Actifs, ni dans Écartés). Constaté le 23 nov. 2026 : 380 immeubles cachés ainsi.
-- Maintenant : l'agent l'écarte lui-même, avec la raison dans la note. Il apparaît dans « Écartés » et se rétablit d'un clic.
create or replace function crm.agent_hors_cible(p_id uuid) returns text language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(i.propose_categorie, 'prive'), nullif((select c.categorie from crm.role_coordonnees c where c.cle = crm.cle_proprietaire(i.groupe, i.proprietaire)), 'prive'),
         crm.hors_cible(coalesce(i.groupe, i.proprietaire, i.propose_nom))) from crm.immeubles_role i where i.id = p_id;
$$;
revoke all on function crm.agent_hors_cible(uuid) from public, anon, authenticated;

do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.service_role_immeuble_confirmer(uuid)'::regprocedure);
  if position('agent_hors_cible' in d) > 0 then return; end if;
  n := replace(d, 'saisi_le = now()
  where id = p_id;', 'saisi_le = now()
  where id = p_id;
  if coalesce(nullif(i.propose_categorie, ''prive''), crm.hors_cible(v_nom)) is not null then
    update crm.immeubles_role set ecarte = true, note = left(note || '' · Hors cible ('' || coalesce(nullif(i.propose_categorie, ''prive''), crm.hors_cible(v_nom)) || '')'', 500) where id = p_id;
    return jsonb_build_object(''nom'', v_nom, ''cle'', crm.cle_proprietaire(null, v_nom), ''chercher_coordonnees'', false);
  end if;');
  if n = d then raise exception 'service_role_immeuble_confirmer : ancre introuvable'; end if;
  execute n;
end $$;

-- Rattrapage : les immeubles déjà cachés de cette façon vont dans « Écartés ».
update crm.immeubles_role i set ecarte = true, note = left(coalesce(i.note, '') || ' · Hors cible (' || crm.agent_hors_cible(i.id) || ')', 500)
where not i.ecarte and i.proprietaire is not null and i.note like 'Trouvé par l’agent%' and crm.agent_hors_cible(i.id) is not null;
