-- Prospection par les données (étape 1 et 2) : les immeubles locatifs du rôle d'évaluation foncière en format ouvert (MAMH, CC-BY 4.0)
-- chargés dans crm.immeubles_role (scripts/prospection/role.py puis charger.py), sans nom de propriétaire : le MAMH le retire.
-- L'équipe inscrit le propriétaire immeuble par immeuble (rôle en ligne de la ville ou Registre foncier, consultés à la main : pas
-- d'extraction automatisée), les immeubles se regroupent par propriétaire, et un groupe de 100 à 200 logements devient une suggestion
-- de l'agent de prospection (crm.prospect_suggestions), révisée par une personne avant tout contact (Ventes › Prospection IA).
-- ponytail: regroupement par nom normalisé; les sociétés liées par leurs administrateurs (REQ) se regroupent en inscrivant le même
-- « groupe » à la main, à automatiser avec le REQ si le volume le demande.

create table if not exists crm.immeubles_role (
  id uuid primary key default gen_random_uuid(),
  millesime int not null, municipalite text not null, matricule text not null, adresse text not null, lots text, cubf text,
  logements int not null check (logements > 0), statut text, proprietaires int, inscrit_le date, annee int, valeur bigint,
  proprietaire text, neq text check (neq ~ '^\d{10}$'), groupe text, ecarte boolean not null default false, note text,
  saisi_par uuid references auth.users(id), saisi_le timestamptz,
  unique (municipalite, matricule)
);
comment on column crm.immeubles_role.proprietaire is 'Propriétaire inscrit au rôle, consulté à la main (ville ou Registre foncier); entreprise en général (statut « morale »)';
alter table crm.immeubles_role enable row level security;
revoke all on crm.immeubles_role from anon, authenticated;
create policy immeubles_role_lecture on crm.immeubles_role for select to authenticated using (crm.can('ventes.prospection.lire'));

-- Clé de regroupement : le « groupe » inscrit (sociétés d'un même décideur), sinon le nom, sans accents, ponctuation ni forme juridique.
create or replace function crm.cle_proprietaire(p_groupe text, p_nom text) returns text language sql immutable set search_path = '' as $$
  select nullif(regexp_replace(regexp_replace(translate(lower(coalesce(nullif(btrim(p_groupe), ''), p_nom, '')), 'àâäáéèêëîïíôöóùûüúç', 'aaaaeeeeiiiooouuuuc'),
    '\m(inc|ltee|ltd|limitee|enr|senc|corp|corporation|compagnie|cie)\M', '', 'g'), '[^a-z0-9]', '', 'g'), '');
$$;

create or replace function public.lanceur_role_immeubles(p jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_min int := coalesce(nullif(p ->> 'min', '')::int, 12); v_ville text := nullif(p ->> 'ville', ''); v_q text := nullif(btrim(p ->> 'q'), '');
  v_vue text := coalesce(nullif(p ->> 'vue', ''), 'a_identifier');
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.lire') then raise exception 'Votre rôle ne donne pas accès à la prospection.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'compteurs', (select jsonb_build_object('immeubles', count(*), 'logements', coalesce(sum(logements), 0), 'identifies', count(*) filter (where proprietaire is not null),
        'a_identifier', count(*) filter (where proprietaire is null and not ecarte), 'ecartes', count(*) filter (where ecarte))
      from crm.immeubles_role where logements >= v_min and (v_ville is null or municipalite = v_ville)),
    'villes', (select jsonb_agg(distinct municipalite) from crm.immeubles_role),
    'immeubles', coalesce((select jsonb_agg(to_jsonb(x) order by x.logements desc, x.adresse) from (
        select i.id, i.municipalite, i.matricule, i.adresse, i.lots, i.logements, i.statut, i.inscrit_le, i.annee, i.valeur, i.proprietaire, i.neq, i.groupe, i.ecarte, i.note
        from crm.immeubles_role i
        where i.logements >= v_min and (v_ville is null or i.municipalite = v_ville)
          and (v_q is null or i.adresse ilike '%' || v_q || '%' or i.proprietaire ilike '%' || v_q || '%' or i.groupe ilike '%' || v_q || '%' or i.matricule = v_q)
          and case v_vue when 'a_identifier' then i.proprietaire is null and not i.ecarte when 'identifies' then i.proprietaire is not null when 'ecartes' then i.ecarte else true end
        order by i.logements desc, i.adresse limit 150) x), '[]'::jsonb),
    -- Propriétaires connus, tous immeubles du rôle (le seuil de l'écran ne s'applique pas au total), du plus gros au plus petit.
    'groupes', coalesce((select jsonb_agg(to_jsonb(g) || jsonb_build_object('suggestion',
          (select s.status from crm.prospect_suggestions s where s.extrait like '%[role:' || g.cle || ']%' order by s.created_at desc limit 1)) order by g.logements desc) from (
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
  update crm.immeubles_role set proprietaire = nullif(btrim(p ->> 'proprietaire'), ''), neq = v_neq, groupe = nullif(btrim(p ->> 'groupe'), ''),
    ecarte = coalesce((p ->> 'ecarte')::boolean, false), note = nullif(btrim(p ->> 'note'), ''), saisi_par = auth.uid(), saisi_le = now()
  where id = v_id;
  if not found then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
  perform crm.journal('building_owner.recorded', 'crm.immeubles_role', v_id, null, p, 'record-building-owner');
end $$;

-- Un propriétaire connu devient une suggestion de l'agent (révision humaine dans Prospection IA avant tout contact).
create or replace function public.lanceur_role_proposer(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_cle text := p ->> 'cle'; g record; v_id uuid;
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.ecrire') then raise exception 'Votre rôle ne permet pas de proposer un prospect.' using errcode = 'PT403'; end if;
  select min(coalesce(i.groupe, i.proprietaire)) nom, count(*) n, sum(i.logements) logements, string_agg(distinct i.municipalite, ', ') villes,
    string_agg(i.adresse || ' (' || i.logements || ' log., ' || i.municipalite || ')', '; ' order by i.logements desc) liste, min(i.neq) neq
  into g from crm.immeubles_role i where not i.ecarte and i.proprietaire is not null and crm.cle_proprietaire(i.groupe, i.proprietaire) = v_cle;
  if g.n is null or g.n = 0 then raise exception 'Propriétaire introuvable.' using errcode = 'PT404'; end if;
  if exists (select 1 from crm.prospect_suggestions where extrait like '%[role:' || v_cle || ']%' and status <> 'rejected') then
    raise exception 'Ce propriétaire est déjà proposé.' using errcode = 'PT409';
  end if;
  insert into crm.prospect_suggestions (nom, entreprise, ville, portes, immeubles, source_url, extrait, raison, pertinence)
  values (g.nom, g.nom, g.villes, g.logements, g.n, 'https://www.donneesquebec.ca/recherche/dataset/roles-d-evaluation-fonciere-du-quebec',
    left(g.liste, 1800) || coalesce(' · NEQ ' || g.neq, '') || ' [role:' || v_cle || ']',
    'Rôle d’évaluation : ' || g.n || ' immeuble' || case when g.n > 1 then 's' else '' end || ', ' || g.logements || ' logements. Gestion externe, décideur et coordonnées à trouver avant tout contact.',
    case when g.logements between 100 and 200 then 85 else 50 end)
  returning id into v_id;
  perform crm.journal('prospect_suggestion.from_roll', 'crm.prospect_suggestions', v_id, null, jsonb_build_object('cle', v_cle, 'logements', g.logements), 'propose-roll-owner');
  return v_id;
end $$;
revoke all on function public.lanceur_role_immeubles(jsonb), public.lanceur_role_proprietaire(jsonb), public.lanceur_role_proposer(jsonb) from public, anon;
grant execute on function public.lanceur_role_immeubles(jsonb), public.lanceur_role_proprietaire(jsonb), public.lanceur_role_proposer(jsonb) to authenticated;
