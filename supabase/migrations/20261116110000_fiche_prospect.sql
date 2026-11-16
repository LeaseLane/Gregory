-- Fiche du prospect pour les prospecteurs (Octa, 2026-11-16 : « chaque prospect doit avoir une fiche : statut, notes, quand l'appeler… »).
-- La fiche existait (Ventes › deal) mais un prospecteur n'y réglait son suivi qu'en racontant l'appel à Cléo, et n'y voyait pas le propriétaire.
--   1. lanceur_prospect_appel : le résultat d'un appel en un clic (pas de réponse, message laissé, à rappeler, intéressé, rendez-vous, pas intéressé),
--      avec une note; il fixe la prochaine date d'appel (« À rappeler ») et compte dans les appels du prospecteur (call_history, comme l'ancien portail).
--   2. lanceur_prospect_suivi : intérêt, prochaine date d'appel, prochaine action, notes, modifiables à la main.
--   3. lanceur_deal_historique rend aussi le propriétaire trouvé par la prospection : décideur, coordonnées, gestionnaire, immeubles, à propos.
-- Qui : le prospecteur à qui le prospect est assigné, le responsable du deal, ou un membre de l'équipe (pas un autre prospecteur).

create or replace function crm.peut_suivre_prospect(p_deal uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from crm.deals d left join public.prospects pr on pr.id = d.prospect_id where d.id = p_deal
    and (d.owner_user_id = auth.uid() or public.auth_cold_caller_id() in (pr.assigned_caller_id, pr.created_by_caller_id)
         or (not crm.est_prospecteur() and crm.can('ventes.mandats.ecrire'))));
$$;

-- Le propriétaire derrière le deal, tel que la prospection l'a trouvé (clé « [role:…] » de la suggestion approuvée).
create or replace function crm.proprietaire_du_deal(p_deal uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  with k as (select substring(s.extrait from '\[role:([^]]+)\]') cle from crm.prospect_suggestions s where s.deal_id = p_deal and s.extrait ~ '\[role:' order by s.created_at desc limit 1)
  select case when k.cle is not null then jsonb_build_object(
    'coordonnees', (select jsonb_build_object('telephone', c.telephone, 'courriel', case when c.refus then null else c.courriel end, 'refus', c.refus, 'decideur', c.decideur, 'site', c.site,
        'gestionnaire', c.gestionnaire, 'a_propos', c.a_propos, 'sources', (select jsonb_agg(x) from (select x from jsonb_array_elements(c.sources) x limit 4) z)) from crm.role_coordonnees c where c.cle = k.cle),
    'immeubles', coalesce((select jsonb_agg(jsonb_build_object('adresse', i.adresse, 'ville', i.municipalite, 'logements', i.logements, 'annee', i.annee) order by i.logements desc)
        from crm.immeubles_role i where crm.cle_proprietaire(i.groupe, i.proprietaire) = k.cle and not i.ecarte), '[]'::jsonb)) end
  from (select (select cle from k) cle) k;
$$;
revoke all on function crm.peut_suivre_prospect(uuid), crm.proprietaire_du_deal(uuid) from public, anon, authenticated;

create or replace function public.lanceur_prospect_appel(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_deal uuid := nullif(p ->> 'deal_id', '')::uuid; pr public.prospects; v_issue text := p ->> 'issue'; v_note text := nullif(btrim(p ->> 'note'), '');
  v_auj date := (now() at time zone 'America/Toronto')::date; v_date date := nullif(p ->> 'relance', '')::date; v_rel date; v_int text; v_lib text;
begin
  perform crm.require_aal2();
  if not crm.peut_suivre_prospect(v_deal) then raise exception 'Ce prospect n’est pas à votre nom.' using errcode = 'PT403'; end if;
  select pr2.* into pr from public.prospects pr2 join crm.deals d on d.prospect_id = pr2.id where d.id = v_deal for update of pr2;
  if not found then raise exception 'Prospect introuvable.' using errcode = 'PT404'; end if;
  if v_date is not null and v_date < v_auj then raise exception 'La date de rappel est passée.' using errcode = 'PT422'; end if;
  -- Prochaine date d'appel : celle donnée, sinon un délai qui dépend du résultat (jours ouvrables).
  case v_issue
    when 'pas_repondu' then v_lib := 'Pas de réponse'; v_rel := coalesce(v_date, crm.jours_ouvrables(v_auj, 2));
    when 'message' then v_lib := 'Message laissé'; v_rel := coalesce(v_date, crm.jours_ouvrables(v_auj, 3));
    when 'rappeler' then v_lib := 'À rappeler'; v_rel := coalesce(v_date, crm.jours_ouvrables(v_auj, 5));
    when 'interesse' then v_lib := 'Intéressé'; v_int := 'chaud'; v_rel := coalesce(v_date, crm.jours_ouvrables(v_auj, 2));
    when 'rdv' then v_lib := 'Rendez-vous fixé'; v_int := 'chaud';
      if v_date is null then raise exception 'Date du rendez-vous requise.' using errcode = 'PT422'; end if; v_rel := v_date;
    when 'pas_interesse' then v_lib := 'Pas intéressé'; v_int := 'froid'; v_rel := null;
    else raise exception 'Résultat d’appel inconnu.' using errcode = 'PT422';
  end case;
  update public.prospects set
    call_history = (case when jsonb_typeof(call_history) = 'array' then call_history else '[]'::jsonb end) || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'date', now(), 'outcome', v_issue, 'summary', concat_ws(' · ', v_lib, v_note), 'interest_level', coalesce(v_int, interest_level),
      'next_step', case when v_rel is not null then 'Rappeler le ' || to_char(v_rel, 'YYYY-MM-DD') end, 'caller_id', public.auth_cold_caller_id(), 'par', auth.uid()))),
    next_followup_date = v_rel, interest_level = coalesce(v_int, interest_level),
    stage = case when coalesce(stage, 'new') = 'new' then 'contacted' when v_issue in ('interesse', 'rdv') and stage = 'contacted' then 'interested' else stage end,
    updated_at = now()
  where id = pr.id;
  insert into crm.activities (deal_id, type, title, body, author_user_id)
  values (v_deal, 'appel', 'Appel · ' || v_lib, concat_ws(' · ', v_note, case when v_rel is not null then 'prochain appel le ' || to_char(v_rel, 'YYYY-MM-DD') end), auth.uid());
  perform crm.journal('prospect.call_logged', 'public.prospects', pr.id, null, jsonb_build_object('issue', v_issue, 'relance', v_rel), 'log-prospect-call');
  return jsonb_build_object('relance', v_rel, 'issue', v_issue);
end $$;

create or replace function public.lanceur_prospect_suivi(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v_deal uuid := nullif(p ->> 'deal_id', '')::uuid; v_id uuid;
begin
  perform crm.require_aal2();
  if not crm.peut_suivre_prospect(v_deal) then raise exception 'Ce prospect n’est pas à votre nom.' using errcode = 'PT403'; end if;
  if p ? 'interet' and coalesce(p ->> 'interet', '') not in ('', 'chaud', 'tiede', 'froid') then raise exception 'Intérêt : chaud, tiède ou froid.' using errcode = 'PT422'; end if;
  update public.prospects pr set
    interest_level = case when p ? 'interet' then nullif(p ->> 'interet', '') else interest_level end,
    next_followup_date = case when p ? 'relance' then nullif(p ->> 'relance', '')::date else next_followup_date end,
    next_action = case when p ? 'prochaine_action' then nullif(btrim(p ->> 'prochaine_action'), '') else next_action end,
    notes = case when p ? 'notes' then nullif(btrim(p ->> 'notes'), '') else notes end, updated_at = now()
  from crm.deals d where d.id = v_deal and pr.id = d.prospect_id returning pr.id into v_id;
  if v_id is null then raise exception 'Prospect introuvable.' using errcode = 'PT404'; end if;
  perform crm.journal('prospect.followup_updated', 'public.prospects', v_id, null, p - 'notes', 'update-prospect-followup');
end $$;

-- n jours ouvrables après une date (samedi et dimanche sautés).
create or replace function crm.jours_ouvrables(p_de date, n int) returns date language sql immutable set search_path = '' as $$
  select d::date from generate_series(p_de + 1, p_de + n * 2 + 4, interval '1 day') d where extract(isodow from d) < 6 order by d offset n - 1 limit 1;
$$;
revoke all on function public.lanceur_prospect_appel(jsonb), public.lanceur_prospect_suivi(jsonb) from public, anon;
grant execute on function public.lanceur_prospect_appel(jsonb), public.lanceur_prospect_suivi(jsonb) to authenticated;

-- Fiche : le propriétaire, et qui peut suivre (même définition sinon).
CREATE OR REPLACE FUNCTION public.lanceur_deal_historique(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare d crm.deals; pl crm.pipelines; pr public.prospects;
begin
  perform crm.exiger_mon_deal(p_id);
  select * into d from crm.deals where id = p_id;
  if not found then raise exception 'Deal introuvable.' using errcode = 'PT404'; end if;
  select * into pl from crm.pipelines where id = d.pipeline_id;
  if not crm.can(pl.permission) then raise exception 'Votre rôle ne donne pas accès à ce pipeline.' using errcode = 'PT403'; end if;
  select * into pr from public.prospects where id = d.prospect_id;
  if not found then return jsonb_build_object('notes', null, 'appels', '[]'::jsonb, 'proprietaire', crm.proprietaire_du_deal(p_id)); end if;
  return jsonb_build_object(
    'prospect_id', pr.id, 'peut_appeler', coalesce(public.auth_cold_caller_id() in (pr.assigned_caller_id, pr.created_by_caller_id), false),
    'peut_suivre', crm.peut_suivre_prospect(p_id), 'proprietaire', crm.proprietaire_du_deal(p_id), 'etape', pr.stage,
    'notes', nullif(btrim(pr.notes), ''),
    'interet', pr.interest_level, 'relance', pr.next_followup_date, 'prochaine_action', pr.next_action,
    'appels', coalesce((select jsonb_agg(jsonb_build_object('le', c ->> 'date', 'resume', coalesce(c ->> 'summary', c ->> 'transcript'), 'prochaine_etape', c ->> 'next_step',
        'objections', c ->> 'objections', 'engagement', c ->> 'commitment', 'interet', c ->> 'interest_level', 'issue', c ->> 'outcome',
        'par', (select cc.full_name from public.cold_callers cc where cc.id::text = c ->> 'caller_id')) order by c ->> 'date' desc)
      from jsonb_array_elements(case when jsonb_typeof(pr.call_history) = 'array' then pr.call_history else '[]'::jsonb end) c), '[]'::jsonb));
end $function$
;
