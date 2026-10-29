-- Prospection par le rôle, étape 3 : l'agent de prospection (find-prospects-ai, action « coordonnees ») cherche sur le web les coordonnées
-- d'affaires PUBLIÉES par un propriétaire connu (site, téléphone, courriel, décideur) et l'indice d'une gestion externe, chaque élément
-- avec sa page source. Jamais de courriel deviné. Une mention de refus des sollicitations est notée et le courriel n'est pas repris.
-- Quelques cents par propriétaire (coût mesuré dans crm.agent_runs).
create table if not exists crm.role_coordonnees (
  cle text primary key, nom text, site text, telephone text, courriel text, decideur text, gestionnaire text, refus boolean not null default false,
  sources jsonb not null default '[]'::jsonb, run_id uuid references crm.agent_runs(id) on delete set null, trouve_le timestamptz not null default now()
);
comment on column crm.role_coordonnees.courriel is 'RP · coordonnée d''affaires publiée par l''entreprise (source dans sources) · base LCAP : publication bien en vue';
alter table crm.role_coordonnees enable row level security;
revoke all on crm.role_coordonnees from anon, authenticated;
create policy role_coordonnees_lecture on crm.role_coordonnees for select to authenticated using (crm.can('ventes.prospection.lire'));

-- Pour la fonction (clé de service, après vérification du droit avec le jeton de la personne) : le propriétaire à chercher.
create or replace function public.service_role_groupe(p_cle text) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('nom', min(coalesce(i.groupe, i.proprietaire)), 'noms', jsonb_agg(distinct i.proprietaire), 'neq', min(i.neq), 'villes', string_agg(distinct i.municipalite, ', '),
    'adresses', (array_agg(i.adresse || ' (' || i.municipalite || ')' order by i.logements desc))[1:8], 'logements', sum(i.logements))
  from crm.immeubles_role i where i.proprietaire is not null and not i.ecarte and crm.cle_proprietaire(i.groupe, i.proprietaire) = p_cle having count(*) > 0;
$$;
create or replace function public.service_role_coordonnees(p_cle text, p_run uuid, p jsonb) returns void language sql security definer set search_path = '' as $$
  insert into crm.role_coordonnees (cle, nom, site, telephone, courriel, decideur, gestionnaire, refus, sources, run_id, trouve_le)
  values (p_cle, p ->> 'nom', nullif(p ->> 'site', ''), nullif(p ->> 'telephone', ''), nullif(lower(p ->> 'courriel'), ''), nullif(p ->> 'decideur', ''), nullif(p ->> 'gestionnaire', ''),
    coalesce((p ->> 'refus_sollicitation')::boolean, false), coalesce(p -> 'sources', '[]'::jsonb), p_run, now())
  on conflict (cle) do update set nom = excluded.nom, site = excluded.site, telephone = excluded.telephone, courriel = excluded.courriel, decideur = excluded.decideur,
    gestionnaire = excluded.gestionnaire, refus = excluded.refus, sources = excluded.sources, run_id = excluded.run_id, trouve_le = excluded.trouve_le;
$$;
revoke all on function public.service_role_groupe(text), public.service_role_coordonnees(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.service_role_groupe(text), public.service_role_coordonnees(text, uuid, jsonb) to service_role;

create or replace function public.lanceur_role_immeubles(p jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_min int := coalesce(nullif(p ->> 'min', '')::int, 12); v_max int := coalesce(nullif(p ->> 'max', '')::int, 200); v_ville text := nullif(p ->> 'ville', ''); v_q text := nullif(btrim(p ->> 'q'), '');
  v_vue text := coalesce(nullif(p ->> 'vue', ''), 'a_identifier');
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.lire') then raise exception 'Votre rôle ne donne pas accès à la prospection.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'compteurs', (select jsonb_build_object('immeubles', count(*), 'logements', coalesce(sum(logements), 0), 'identifies', count(*) filter (where proprietaire is not null),
        'a_identifier', count(*) filter (where proprietaire is null and not ecarte), 'ecartes', count(*) filter (where ecarte))
      from crm.immeubles_role where logements between v_min and v_max and (v_ville is null or municipalite = v_ville)),
    'villes', (select jsonb_agg(distinct municipalite) from crm.immeubles_role),
    'immeubles', coalesce((select jsonb_agg(to_jsonb(x) order by x.logements desc, x.adresse) from (
        select i.id, i.municipalite, i.matricule, i.adresse, i.lots, i.logements, i.statut, i.inscrit_le, i.annee, i.valeur, i.proprietaire, i.neq, i.groupe, i.ecarte, i.note
        from crm.immeubles_role i
        where i.logements between v_min and v_max and (v_ville is null or i.municipalite = v_ville)
          and (v_q is null or i.adresse ilike '%' || v_q || '%' or i.proprietaire ilike '%' || v_q || '%' or i.groupe ilike '%' || v_q || '%' or i.matricule = v_q)
          and case v_vue when 'a_identifier' then i.proprietaire is null and not i.ecarte when 'identifies' then i.proprietaire is not null when 'ecartes' then i.ecarte else true end
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

-- Un propriétaire connu devient une suggestion de l'agent (révision humaine dans Prospection IA avant tout contact).
create or replace function public.lanceur_role_proposer(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_cle text := p ->> 'cle'; g record; v_id uuid; c crm.role_coordonnees;
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
  select * into c from crm.role_coordonnees where cle = v_cle;
  insert into crm.prospect_suggestions (nom, entreprise, telephone, courriel, ville, portes, immeubles, source_url, extrait, raison, pertinence)
  values (coalesce(c.decideur, g.nom), g.nom, c.telephone, case when not coalesce(c.refus, false) then c.courriel end, g.villes, g.logements, g.n,
    coalesce(c.sources -> 0 ->> 'url', 'https://www.donneesquebec.ca/recherche/dataset/roles-d-evaluation-fonciere-du-quebec'),
    left(g.liste, 1800) || coalesce(' · NEQ ' || g.neq, '') || ' [role:' || v_cle || ']',
    'Rôle d’évaluation : ' || g.n || ' immeuble' || case when g.n > 1 then 's' else '' end || ', ' || g.logements || ' logements. '
      || case when c.cle is null then 'Gestion externe, décideur et coordonnées à trouver avant tout contact.'
         else coalesce('Gestion : ' || c.gestionnaire || '. ', 'Gestionnaire externe non trouvé. ') || coalesce('Site : ' || c.site || '. ', '')
           || case when c.refus then 'La page refuse les sollicitations : ne pas écrire.' else 'Coordonnées publiées par l’entreprise (source jointe).' end end,
    case when g.logements between 100 and 200 then 85 else 50 end)
  returning id into v_id;
  perform crm.journal('prospect_suggestion.from_roll', 'crm.prospect_suggestions', v_id, null, jsonb_build_object('cle', v_cle, 'logements', g.logements), 'propose-roll-owner');
  return v_id;
end $$;
