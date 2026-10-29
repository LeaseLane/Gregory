-- Prospection par le rôle, étape 2 assistée : l'agent de prospection (find-prospects-ai, action « proprietaire ») cherche sur le web public
-- QUI possède un immeuble (nouvelles de vente, site du propriétaire, annonces commerciales, permis), à partir de l'adresse seulement.
-- Il PROPOSE un nom avec ses sources; une personne confirme (le nom devient le propriétaire) ou écarte la proposition. Aucun site
-- municipal ni le Registre foncier n'est interrogé par programme. Un immeuble cherché n'est pas recherché de nouveau (propose_le).
alter table crm.immeubles_role add column if not exists propose_nom text, add column if not exists propose_neq text,
  add column if not exists propose_sources jsonb, add column if not exists propose_note text, add column if not exists propose_le timestamptz;

create or replace function public.service_role_immeuble(p_id uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('adresse', adresse, 'municipalite', municipalite, 'logements', logements, 'lots', lots, 'annee', annee, 'statut', statut, 'inscrit_le', inscrit_le,
    'deja', propose_le is not null or proprietaire is not null)
  from crm.immeubles_role where id = p_id;
$$;
create or replace function public.service_role_immeuble_propose(p_id uuid, p jsonb) returns void language sql security definer set search_path = '' as $$
  update crm.immeubles_role set propose_nom = nullif(btrim(p ->> 'proprietaire'), ''), propose_neq = nullif(regexp_replace(coalesce(p ->> 'neq', ''), '\D', '', 'g'), ''),
    propose_sources = coalesce(p -> 'sources', '[]'::jsonb), propose_note = nullif(btrim(coalesce(p ->> 'confiance', '') || ' · ' || coalesce(p ->> 'raison', '')), '·'), propose_le = now()
  where id = p_id;
$$;
revoke all on function public.service_role_immeuble(uuid), public.service_role_immeuble_propose(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.service_role_immeuble(uuid), public.service_role_immeuble_propose(uuid, jsonb) to service_role;

create or replace function public.lanceur_role_immeubles(p jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_min int := coalesce(nullif(p ->> 'min', '')::int, 12); v_max int := coalesce(nullif(p ->> 'max', '')::int, 200); v_ville text := nullif(p ->> 'ville', ''); v_q text := nullif(btrim(p ->> 'q'), '');
  v_vue text := coalesce(nullif(p ->> 'vue', ''), 'a_identifier');
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.lire') then raise exception 'Votre rôle ne donne pas accès à la prospection.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'compteurs', (select jsonb_build_object('immeubles', count(*), 'logements', coalesce(sum(logements), 0), 'identifies', count(*) filter (where proprietaire is not null),
        'a_identifier', count(*) filter (where proprietaire is null and not ecarte), 'proposes', count(*) filter (where proprietaire is null and propose_nom is not null and not ecarte), 'cherches', count(*) filter (where propose_le is not null), 'ecartes', count(*) filter (where ecarte))
      from crm.immeubles_role where logements between v_min and v_max and (v_ville is null or municipalite = v_ville)),
    'villes', (select jsonb_agg(distinct municipalite) from crm.immeubles_role),
    'immeubles', coalesce((select jsonb_agg(to_jsonb(x) order by x.logements desc, x.adresse) from (
        select i.id, i.municipalite, i.matricule, i.adresse, i.lots, i.logements, i.statut, i.inscrit_le, i.annee, i.valeur, i.proprietaire, i.neq, i.groupe, i.ecarte, i.note, i.propose_nom, i.propose_neq, i.propose_sources, i.propose_note, i.propose_le
        from crm.immeubles_role i
        where i.logements between v_min and v_max and (v_ville is null or i.municipalite = v_ville)
          and (v_q is null or i.adresse ilike '%' || v_q || '%' or i.proprietaire ilike '%' || v_q || '%' or i.groupe ilike '%' || v_q || '%' or i.matricule = v_q)
          and case v_vue when 'a_identifier' then i.proprietaire is null and not i.ecarte when 'proposes' then i.proprietaire is null and i.propose_nom is not null and not i.ecarte when 'identifies' then i.proprietaire is not null when 'ecartes' then i.ecarte else true end
        order by i.logements desc, i.adresse limit 150) x), '[]'::jsonb),
    -- Propriétaires connus, tous immeubles du rôle (le seuil de l'écran ne s'applique pas au total), du plus gros au plus petit.
    'groupes', coalesce((select jsonb_agg(to_jsonb(g) || jsonb_build_object('suggestion',
          (select s.status from crm.prospect_suggestions s where s.extrait like '%[role:' || g.cle || ']%' order by s.created_at desc limit 1),
          'coordonnees', (select to_jsonb(c) - 'cle' - 'run_id' from crm.role_coordonnees c where c.cle = g.cle)) order by g.logements desc) from (
        select r.cle, min(r.nom) nom, count(*) immeubles, sum(r.logements) logements, string_agg(distinct r.municipalite, ', ') villes, sum(r.logements) between 100 and 200 cible
        from (select crm.cle_proprietaire(i.groupe, i.proprietaire) cle, coalesce(i.groupe, i.proprietaire) nom, i.logements, i.municipalite
              from crm.immeubles_role i where i.proprietaire is not null and not i.ecarte) r
        group by r.cle) g), '[]'::jsonb),
    'peut_ecrire', crm.can('ventes.prospection.ecrire'));
end $$;

create or replace function public.lanceur_role_proprietaire(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v_id uuid := (p ->> 'id')::uuid; v_neq text := nullif(regexp_replace(coalesce(p ->> 'neq', ''), '\D', '', 'g'), '');
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.ecrire') then raise exception 'Votre rôle ne permet pas de modifier la prospection.' using errcode = 'PT403'; end if;
  if v_neq is not null and v_neq !~ '^\d{10}$' then raise exception 'Le NEQ compte 10 chiffres.' using errcode = 'PT422'; end if;
  -- Proposition de l'agent écartée : le nom proposé s'efface, la date reste (l'immeuble n'est pas recherché de nouveau).
  if coalesce((p ->> 'rejeter_proposition')::boolean, false) then
    update crm.immeubles_role set propose_nom = null, propose_neq = null, saisi_par = auth.uid(), saisi_le = now() where id = v_id;
    if not found then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
    perform crm.journal('building_owner.proposal_rejected', 'crm.immeubles_role', v_id, null, p, 'record-building-owner');
    return;
  end if;
  update crm.immeubles_role set proprietaire = nullif(btrim(p ->> 'proprietaire'), ''), neq = v_neq, groupe = nullif(btrim(p ->> 'groupe'), ''),
    ecarte = coalesce((p ->> 'ecarte')::boolean, false), note = nullif(btrim(p ->> 'note'), ''), saisi_par = auth.uid(), saisi_le = now()
  where id = v_id;
  if not found then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
  perform crm.journal('building_owner.recorded', 'crm.immeubles_role', v_id, null, p, 'record-building-owner');
end $$;
