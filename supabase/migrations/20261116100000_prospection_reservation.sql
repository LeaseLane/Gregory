-- Prospection : un propriétaire (ou une adresse) pris par un prospecteur n'est plus offert aux autres (Grégory, 2026-11-16 : « si quelqu'un est
-- allé voir l'adresse du 1 boulevard Talbot, que William ait pas accès au boulevard Talbot, pour éviter les doublons »).
--
-- Réserver = « je m'en occupe ». La réservation se pose toute seule quand un prospecteur travaille une ligne (il lance la recherche du
-- propriétaire ou de ses coordonnées, confirme un propriétaire, l'ajoute au pipeline), ou par le bouton « Réserver ». Elle porte sur le
-- propriétaire entier : tous ses immeubles, y compris ceux qu'on lui découvre ensuite. Tant que le propriétaire est inconnu, elle porte sur l'adresse.
-- Un prospecteur ne voit plus ce qu'un collègue a réservé; il voit les siens marqués « Réservé par vous ». Un admin voit tout, avec le nom
-- de la personne, et peut libérer. La base refuse aussi l'action sur une ligne réservée par quelqu'un d'autre (pas seulement l'écran).
-- Règles (Octa, 2026-11-16) :
--   1. une réservation naît d'une action (chercher une ligne, confirmer, ajouter au pipeline, « Réserver »), jamais d'un simple coup d'œil;
--   2. elle couvre le propriétaire entier, ou l'adresse tant que le propriétaire est inconnu (pas la rue : deux propriétaires d'une même rue sont deux prospects);
--   3. elle tombe après 14 jours sans action, sauf si le propriétaire est au pipeline : il est alors à la personne pour de bon;
--   4. un prospect perdu reste à la personne (on ne rappelle pas un propriétaire qui a dit non); seul un admin le libère;
--   5. les recherches d'un admin ne réservent rien; 6. la recherche en lot non plus (elle explore, elle ne travaille pas).
alter table crm.immeubles_role add column if not exists reserve_par uuid references auth.users(id) on delete set null, add column if not exists reserve_le timestamptz;
create index if not exists immeubles_role_reserve on crm.immeubles_role (reserve_par) where reserve_par is not null;

-- Qui a réservé quoi : une ligne par propriétaire (clé de regroupement) ou par adresse sans propriétaire (« imm:<id> »). Le premier arrivé garde.
-- Réservations ACTIVES seulement : de moins de 14 jours, ou propriétaire au pipeline. Une réservation tombée ne retire plus rien à personne.
create or replace view crm.role_reserves as
  select r.cle, r.par, r.le from (
    select coalesce(crm.cle_proprietaire(i.groupe, i.proprietaire), 'imm:' || i.id) cle, (array_agg(i.reserve_par order by i.reserve_le desc))[1] par, max(i.reserve_le) le
    from crm.immeubles_role i where i.reserve_par is not null group by 1) r
  where r.le > now() - interval '14 days'
     or exists (select 1 from crm.prospect_suggestions s where s.status = 'approved' and s.extrait like '%[role:' || r.cle || ']%');
revoke all on crm.role_reserves from public, anon, authenticated;

create or replace function crm.reserve_de(p_cle text) returns uuid language sql stable security definer set search_path = '' as $$
  select par from crm.role_reserves where cle = p_cle;
$$;
-- Refuse si un collègue a une réservation active; sinon pose (ou rafraîchit, ou reprend une réservation tombée) au nom de p_user sur tous les immeubles de la clé.
create or replace function crm.reserver(p_cle text, p_user uuid) returns void language plpgsql security definer set search_path = '' as $$
declare v_par uuid := crm.reserve_de(p_cle);
begin
  if p_user is null then return; end if;
  if v_par is not null and v_par <> p_user then raise exception 'Déjà réservé par %.', crm.nom_membre(v_par) using errcode = 'PT409'; end if;
  update crm.immeubles_role i set reserve_par = p_user, reserve_le = now()
  where case when p_cle like 'imm:%' then i.id::text = substr(p_cle, 5) else crm.cle_proprietaire(i.groupe, i.proprietaire) = p_cle end;
end $$;
revoke all on function crm.reserve_de(text), crm.reserver(text, uuid) from public, anon, authenticated;

-- Bouton « Réserver » / « Libérer ». Libérer : la personne qui a réservé, ou quelqu'un qui n'est pas prospecteur (admin, gestionnaire).
create or replace function public.lanceur_role_reserver(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cle text := btrim(coalesce(p ->> 'cle', '')); v_par uuid;
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.ecrire') then raise exception 'Votre rôle ne permet pas de modifier la prospection.' using errcode = 'PT403'; end if;
  if v_cle = '' then raise exception 'Propriétaire ou adresse requis.' using errcode = 'PT422'; end if;
  v_par := crm.reserve_de(v_cle);
  if coalesce((p ->> 'liberer')::boolean, false) then
    if v_par is null then return jsonb_build_object('reserve', false); end if;
    if v_par <> auth.uid() and crm.est_prospecteur() then raise exception 'Seul % ou un administrateur peut libérer cette réservation.', crm.nom_membre(v_par) using errcode = 'PT403'; end if;
    update crm.immeubles_role i set reserve_par = null, reserve_le = null
    where i.reserve_par is not null and case when v_cle like 'imm:%' then i.id::text = substr(v_cle, 5) else crm.cle_proprietaire(i.groupe, i.proprietaire) = v_cle end;
    perform crm.journal('prospect_claim.released', 'crm.immeubles_role', null, null, jsonb_build_object('cle', v_cle, 'etait', v_par), 'claim-prospect');
    return jsonb_build_object('reserve', false);
  end if;
  perform crm.reserver(v_cle, auth.uid());   -- la sienne : rafraîchie (14 jours de plus)
  if crm.reserve_de(v_cle) is distinct from auth.uid() then raise exception 'Propriétaire ou adresse introuvable.' using errcode = 'PT404'; end if;
  perform crm.journal('prospect_claim.taken', 'crm.immeubles_role', null, null, jsonb_build_object('cle', v_cle), 'claim-prospect');
  return jsonb_build_object('reserve', true);
end $$;
revoke all on function public.lanceur_role_reserver(jsonb) from public, anon;
grant execute on function public.lanceur_role_reserver(jsonb) to authenticated;

-- Recherche (Prospection IA) : même définition, plus les réservations.
CREATE OR REPLACE FUNCTION public.lanceur_recherche_role(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_prosp boolean;
  v_villes text[] := (select array_agg(crm.sans_accents(x)) from jsonb_array_elements_text(case when jsonb_typeof(p -> 'villes') = 'array' then p -> 'villes' else '[]'::jsonb end) x);
  v_min int := coalesce(nullif(p ->> 'min', '')::int, 12); v_max int := coalesce(nullif(p ->> 'max', '')::int, 100000);
  v_amin int := nullif(p ->> 'annee_min', '')::int; v_amax int := nullif(p ->> 'annee_max', '')::int;
  v_statut text := nullif(p ->> 'statut', ''); v_q text := nullif(btrim(p ->> 'q'), ''); v_coord text := nullif(p ->> 'coordonnees', '');
  v_lat float8 := nullif(p #>> '{pres_de,lat}', '')::float8; v_lon float8 := nullif(p #>> '{pres_de,lon}', '')::float8;
  v_km float8 := least(greatest(coalesce(nullif(p #>> '{pres_de,km}', '')::float8, 2), 0.1), 100);
begin
  v_prosp := crm.est_prospecteur();
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.lire') then raise exception 'Votre rôle ne donne pas accès à la prospection.' using errcode = 'PT403'; end if;
  if v_statut is not null and v_statut not in ('morale', 'physique') then v_statut := null; end if;
  return (
    with res as materialized (select cle, par from crm.role_reserves), tout as (
      select i.*, crm.cle_proprietaire(i.groupe, i.proprietaire) cle_p,
        coalesce(nullif(i.propose_categorie, 'prive'), nullif((select c.categorie from crm.role_coordonnees c where c.cle = crm.cle_proprietaire(i.groupe, i.proprietaire)), 'prive'),
          crm.hors_cible(coalesce(i.groupe, i.proprietaire, i.propose_nom))) hors,
        case when v_lat is not null and i.lat is not null then
          6371 * 2 * asin(sqrt(power(sin(radians(i.lat - v_lat) / 2), 2) + cos(radians(v_lat)) * cos(radians(i.lat)) * power(sin(radians(i.lon - v_lon) / 2), 2))) end km
      from crm.immeubles_role i
      where not i.ecarte and i.logements between v_min and v_max
        and (v_villes is null or crm.sans_accents(i.municipalite) = any(v_villes))
        and (v_amin is null or i.annee >= v_amin) and (v_amax is null or i.annee <= v_amax)
        and (v_statut is null or i.statut = v_statut)
        and (v_q is null or i.adresse ilike '%' || v_q || '%' or i.proprietaire ilike '%' || v_q || '%' or i.groupe ilike '%' || v_q || '%')
    ), imm as (select * from tout where hors is null), f as (select * from imm where v_lat is null or km <= v_km),   -- non géocodé : km null, donc hors d'une recherche « près de »
    g as (
      select coalesce(f.cle_p, 'imm:' || f.id) cle, min(coalesce(f.groupe, f.proprietaire)) nom, count(*)::int immeubles, sum(f.logements)::int logements,
        string_agg(distinct f.municipalite, ' · ') villes, round(min(f.km)::numeric, 1) km,
        jsonb_agg(jsonb_build_object('id', f.id, 'adresse', f.adresse, 'municipalite', f.municipalite, 'logements', f.logements, 'annee', f.annee, 'statut', f.statut,
          'km', round(f.km::numeric, 1), 'propose_nom', f.propose_nom, 'propose_note', f.propose_note, 'propose_sources', f.propose_sources, 'cherche', f.propose_le is not null)
          order by f.logements desc) liste
      from f group by 1
    ), r as (
      select g.*, to_jsonb(c) - 'cle' - 'run_id' coordonnees,
        (select s.status from crm.prospect_suggestions s where g.nom is not null and s.extrait like '%[role:' || g.cle || ']%' order by s.created_at desc limit 1) suggestion,
        case when g.nom is not null then (select sum(i.logements)::int from crm.immeubles_role i where not i.ecarte and crm.cle_proprietaire(i.groupe, i.proprietaire) = g.cle) end logements_total
      , rv.par reserve_par, case when rv.par is not null then crm.nom_membre(rv.par) end reserve_nom, coalesce(rv.par = auth.uid(), false) reserve_moi
      from g left join crm.role_coordonnees c on c.cle = g.cle left join res rv on rv.cle = g.cle
      where (v_coord is null or (v_coord = 'avec') = (c.cle is not null))
        -- un prospecteur ne voit pas ce qu'un collègue a réservé
        and (rv.par is null or rv.par = auth.uid() or not v_prosp)
    )
    select jsonb_build_object(
      'total', (select count(*) from r), 'hors_cible', (select count(*) from tout where hors is not null), 'immeubles', (select coalesce(sum(immeubles), 0) from r), 'logements', (select coalesce(sum(logements), 0) from r),
      'avec_coordonnees', (select count(*) from r where coordonnees is not null), 'identifies', (select count(*) from r where nom is not null),
      'resultats', coalesce((select jsonb_agg(to_jsonb(x) order by x.ordre) from (
          select r.*, row_number() over (order by case when v_lat is not null then r.km end nulls last, (r.nom is null), r.logements desc, r.cle) ordre from r
          order by ordre limit 200) x), '[]'::jsonb),
      -- seulement dans les villes déjà géocodées (Québec et Lévis pour l'instant) : ailleurs, le rayon ne s'applique pas encore
      'non_geocodes', case when v_lat is not null then (select count(*) from imm where imm.lat is null and imm.geocode_le is null
        and exists (select 1 from crm.immeubles_role x where x.municipalite = imm.municipalite and x.geocode_le is not null)) end,
      'cout_mois_cents', (select coalesce(sum(cout_cents), 0) from crm.agent_runs where agent = 'prospection' and started_at >= date_trunc('month', now())),
      'recherches_mois', (select count(*) from crm.agent_runs where agent = 'prospection' and started_at >= date_trunc('month', now())),
      -- Tous les immeubles du filtre jamais cherchés (au-delà des 200 affichés) : la liste du bouton « Trouver tous les propriétaires ».
      'a_chercher', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'adresse', f.adresse) order by f.logements desc, f.adresse) from f where f.proprietaire is null and f.propose_le is null and not exists (select 1 from res where res.cle = coalesce(f.cle_p, 'imm:' || f.id) and res.par <> auth.uid())), '[]'::jsonb),
      'prospecteur', v_prosp, 'peut_ecrire', crm.can('ventes.prospection.ecrire')));
end $function$;

-- Immeubles du rôle : un prospecteur n'y voit pas non plus ce qu'un collègue a réservé.
CREATE OR REPLACE FUNCTION public.lanceur_role_immeubles(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_prosp boolean := crm.est_prospecteur(); v_min int := coalesce(nullif(p ->> 'min', '')::int, 12); v_max int := coalesce(nullif(p ->> 'max', '')::int, 200); v_ville text := nullif(p ->> 'ville', ''); v_q text := nullif(btrim(p ->> 'q'), '');
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
        select i.id, i.municipalite, i.matricule, i.adresse, i.lots, i.logements, i.statut, i.inscrit_le, i.annee, i.valeur, i.proprietaire, i.neq, i.groupe, i.ecarte, i.note, i.propose_nom, i.propose_neq, i.propose_sources, i.propose_note, i.propose_le,
          case when rv.par is not null then crm.nom_membre(rv.par) end reserve_nom, coalesce(rv.par = auth.uid(), false) reserve_moi
        from crm.immeubles_role i left join (select cle, par from crm.role_reserves) rv on rv.cle = coalesce(crm.cle_proprietaire(i.groupe, i.proprietaire), 'imm:' || i.id)
        where i.logements between v_min and v_max and (v_ville is null or i.municipalite = v_ville)
          and (rv.par is null or rv.par = auth.uid() or not v_prosp)
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
        group by r.cle) g where not v_prosp or not exists (select 1 from crm.role_reserves rv where rv.cle = g.cle and rv.par <> auth.uid())), '[]'::jsonb),
    'peut_ecrire', crm.can('ventes.prospection.ecrire'));
end $function$;

-- Ajouter au pipeline : réserve au nom de la personne.
CREATE OR REPLACE FUNCTION public.lanceur_recherche_decider(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_cle text := btrim(coalesce(p ->> 'cle', '')); v_sugg uuid; v_n int;
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.ecrire') then raise exception 'Votre rôle ne permet pas de modifier la prospection.' using errcode = 'PT403'; end if;
  if crm.reserve_de(v_cle) is distinct from auth.uid() and crm.reserve_de(v_cle) is not null and crm.est_prospecteur() then
    raise exception 'Déjà réservé par %.', crm.nom_membre(crm.reserve_de(v_cle)) using errcode = 'PT409';
  end if;
  if p ->> 'decision' = 'ecarter' then
    update crm.immeubles_role i set ecarte = true, note = coalesce(i.note, 'Écarté depuis la recherche'), saisi_par = auth.uid(), saisi_le = now()
    where case when v_cle like 'imm:%' then i.id::text = substr(v_cle, 5) else crm.cle_proprietaire(i.groupe, i.proprietaire) = v_cle end;
    get diagnostics v_n = row_count;
    if v_n = 0 then raise exception 'Propriétaire introuvable.' using errcode = 'PT404'; end if;
    perform crm.journal('building_owner.discarded', 'crm.immeubles_role', null, null, jsonb_build_object('cle', v_cle, 'immeubles', v_n), 'discard-from-search');
    return jsonb_build_object('status', 'ecarte', 'immeubles', v_n);
  end if;
  if p ->> 'decision' is distinct from 'ajouter' then raise exception 'Décision inconnue.' using errcode = 'PT422'; end if;
  if v_cle like 'imm:%' then raise exception 'Identifiez d’abord le propriétaire.' using errcode = 'PT422'; end if;
  if exists (select 1 from crm.prospect_suggestions where extrait like '%[role:' || v_cle || ']%' and status = 'approved') then
    raise exception 'Ce propriétaire est déjà au pipeline.' using errcode = 'PT409';
  end if;
  if crm.reserve_de(v_cle) is null then perform crm.reserver(v_cle, auth.uid()); end if;   -- au pipeline = à son nom : les collègues ne le voient plus
  select id into v_sugg from crm.prospect_suggestions where extrait like '%[role:' || v_cle || ']%' and status = 'pending' order by created_at desc limit 1;
  if v_sugg is null then v_sugg := public.lanceur_role_proposer(jsonb_build_object('cle', v_cle)); end if;
  return crm.decider_suggestion(jsonb_build_object('id', v_sugg, 'decision', 'approuver', 'sequence', false));
end $function$;

-- Confirmer un propriétaire (prospecteur) : il se le réserve.
CREATE OR REPLACE FUNCTION public.lanceur_role_proprietaire(p jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  if crm.est_prospecteur() and nullif(btrim(p ->> 'proprietaire'), '') is not null and not coalesce((p ->> 'ecarte')::boolean, false)
     and crm.reserve_de(coalesce(crm.cle_proprietaire(nullif(btrim(p ->> 'groupe'), ''), btrim(p ->> 'proprietaire')), 'imm:' || v_id)) is null then
    perform crm.reserver(coalesce(crm.cle_proprietaire(nullif(btrim(p ->> 'groupe'), ''), btrim(p ->> 'proprietaire')), 'imm:' || v_id), auth.uid());
  end if;
  perform crm.journal('building_owner.recorded', 'crm.immeubles_role', v_id, null, p, 'record-building-owner');
end $function$;

CREATE OR REPLACE FUNCTION public.service_role_immeuble(p_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object('adresse', adresse, 'municipalite', municipalite, 'logements', logements, 'lots', lots, 'annee', annee, 'statut', statut, 'inscrit_le', inscrit_le,
    'deja', propose_le is not null or proprietaire is not null,
    'reserve_par', crm.reserve_de(coalesce(crm.cle_proprietaire(groupe, proprietaire), 'imm:' || id)))
  from crm.immeubles_role where id = p_id;
$function$;

CREATE OR REPLACE FUNCTION public.service_role_groupe(p_cle text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object('nom', min(coalesce(i.groupe, i.proprietaire)), 'noms', jsonb_agg(distinct i.proprietaire), 'neq', min(i.neq), 'villes', string_agg(distinct i.municipalite, ', '),
    'adresses', (array_agg(i.adresse || ' (' || i.municipalite || ')' order by i.logements desc))[1:8], 'logements', sum(i.logements), 'reserve_par', crm.reserve_de(p_cle))
  from crm.immeubles_role i where i.proprietaire is not null and not i.ecarte and crm.cle_proprietaire(i.groupe, i.proprietaire) = p_cle having count(*) > 0;
$function$;

-- Ce que les prospecteurs travaillent déjà : les propriétaires au pipeline à leur nom leur sont réservés dès maintenant.
update crm.immeubles_role i set reserve_par = d.owner_user_id, reserve_le = coalesce(s.decided_at, now())
from crm.prospect_suggestions s join crm.deals d on d.id = s.deal_id
join crm.team_members tm on tm.user_id = d.owner_user_id and tm.role = 'prospection' and tm.active and tm.removed_at is null
where s.status = 'approved' and s.extrait ~ '\[role:' and i.reserve_par is null
  and crm.cle_proprietaire(i.groupe, i.proprietaire) = substring(s.extrait from '\[role:([^]]+)\]');
