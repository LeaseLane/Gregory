-- Ventes › À appeler : la file d'appels de l'équipe de vente, bâtie sur les propriétaires du rôle d'évaluation qui ont un téléphone publié
-- (crm.role_coordonnees). Un propriétaire à la fois, le meilleur d'abord; chaque appel se termine par une issue journalisée.
-- Score : cible 100–200 logements (+50), gestionnaire externe connu (+30), décideur nommé (+10), courriel publié (+10).
-- Issues : sans réponse (revient dans 2 jours), à rappeler (date choisie), pas intéressé (motif, sort de la file), intéressé (prospect
-- et deal créés dans Mandats propriétaires, tâche « Rendez-vous » au responsable). Aucun appel automatique : une personne compose.
-- ponytail: « pourquoi l'appeler » est composé à partir des faits, sans IA; à confier à Cléo si les formulations doivent varier.

create table if not exists crm.role_appels (
  id uuid primary key default gen_random_uuid(),
  cle text not null, issue text not null check (issue in ('sans_reponse', 'rappeler', 'pas_interesse', 'interesse')),
  rappel_le timestamptz, motif text, note text, reponses jsonb not null default '{}'::jsonb,
  deal_id uuid references crm.deals(id) on delete set null, par uuid references auth.users(id), le timestamptz not null default now()
);
create index if not exists role_appels_cle on crm.role_appels (cle, le desc);
alter table crm.role_appels enable row level security;
revoke all on crm.role_appels from anon, authenticated;
create policy role_appels_lecture on crm.role_appels for select to authenticated using (crm.can('ventes.prospection.lire'));

create or replace function public.lanceur_appels_file(p jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_ville text := nullif(p ->> 'ville', '');
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.lire') then raise exception 'Votre rôle ne donne pas accès à la prospection.' using errcode = 'PT403'; end if;
  return (with grp as (
      select crm.cle_proprietaire(i.groupe, i.proprietaire) cle, min(coalesce(i.groupe, i.proprietaire)) nom, count(*) n, sum(i.logements) logements,
        string_agg(distinct i.municipalite, ', ') villes,
        jsonb_agg(jsonb_build_object('adresse', i.adresse, 'ville', i.municipalite, 'logements', i.logements, 'annee', i.annee) order by i.logements desc) immeubles
      from crm.immeubles_role i where i.proprietaire is not null and not i.ecarte group by 1),
    dernier as (select distinct on (a.cle) a.* from crm.role_appels a order by a.cle, a.le desc),
    file as (
      select g.*, c.telephone, c.courriel, c.site, c.decideur, c.gestionnaire, c.sources, d.issue derniere_issue, d.le dernier_appel, d.note derniere_note,
        (select count(*) from crm.role_appels a where a.cle = g.cle) tentatives,
        (case when g.logements between 100 and 200 then 50 else 0 end) + (case when c.gestionnaire is not null and crm.cle_proprietaire(null, c.gestionnaire) <> g.cle then 30 else 0 end)
          + (case when c.decideur is not null then 10 else 0 end) + (case when c.courriel is not null then 10 else 0 end) score,
        case when d.issue = 'rappeler' and d.rappel_le <= now() then 0 else 1 end priorite
      from grp g join crm.role_coordonnees c on c.cle = g.cle left join dernier d on d.cle = g.cle
      where c.telephone is not null and not c.refus and (v_ville is null or g.villes like '%' || v_ville || '%')
        and (d.issue is null or (d.issue = 'sans_reponse' and d.le < now() - interval '2 days') or (d.issue = 'rappeler' and d.rappel_le <= now())))
    select jsonb_build_object(
      'file', coalesce((select jsonb_agg(to_jsonb(f) || jsonb_build_object('pourquoi',
          f.nom || ' possède ' || f.n || ' immeuble' || case when f.n > 1 then 's' else '' end || ' (' || f.logements || ' logements) à ' || f.villes
          || case when f.gestionnaire is not null and crm.cle_proprietaire(null, f.gestionnaire) <> f.cle then ', gérés par ' || f.gestionnaire || ' : on peut comparer leur service au nôtre.'
                  when f.gestionnaire is not null then ', gérés à l’interne : on peut leur enlever la gestion quotidienne.'
                  else ', gestion actuelle inconnue : à demander.' end)
        order by f.priorite, f.score desc, f.logements desc) from (select * from file order by priorite, score desc, logements desc limit 30) f), '[]'::jsonb),
      'du_jour', (select jsonb_build_object('appels', count(*), 'interesses', count(*) filter (where issue = 'interesse'), 'joints', count(*) filter (where issue <> 'sans_reponse'))
        from crm.role_appels where par = auth.uid() and le >= date_trunc('day', now() at time zone 'America/Toronto') at time zone 'America/Toronto'),
      'objectif', 40,
      'villes', (select jsonb_agg(distinct i.municipalite) from crm.immeubles_role i join crm.role_coordonnees c on c.cle = crm.cle_proprietaire(i.groupe, i.proprietaire)),
      'peut_ecrire', crm.can('ventes.prospection.ecrire')));
end $$;

create or replace function public.lanceur_appel_issue(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cle text := p ->> 'cle'; v_issue text := p ->> 'issue'; c crm.role_coordonnees; v_deal uuid; v_prospect uuid; v_n int; v_log int; v_villes text; v_id uuid;
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.ecrire') then raise exception 'Votre rôle ne permet pas d’inscrire un appel.' using errcode = 'PT403'; end if;
  select * into c from crm.role_coordonnees where cle = v_cle;
  if c.cle is null then raise exception 'Propriétaire introuvable.' using errcode = 'PT404'; end if;
  if v_issue = 'rappeler' and coalesce(nullif(p ->> 'rappel_le', '')::timestamptz, now()) <= now() then raise exception 'Choisissez quand rappeler.' using errcode = 'PT422'; end if;
  if v_issue = 'pas_interesse' and length(btrim(coalesce(p ->> 'motif', ''))) < 3 then raise exception 'Indiquez le motif.' using errcode = 'PT422'; end if;
  if v_issue = 'interesse' then
    select count(*), sum(logements), string_agg(distinct municipalite, ', ') into v_n, v_log, v_villes
      from crm.immeubles_role where proprietaire is not null and not ecarte and crm.cle_proprietaire(groupe, proprietaire) = v_cle;
    insert into public.prospects (full_name, company_name, email, phone, num_doors, notes, lead_source, stage)
    values (coalesce(c.decideur, c.nom), c.nom, c.courriel, c.telephone, coalesce(nullif(p #>> '{reponses,logements}', '')::int, v_log),
      'Appel du ' || to_char(now() at time zone 'America/Toronto', 'DD/MM/YYYY') || ' : ' || coalesce(nullif(btrim(p ->> 'note'), ''), 'intéressé') || ' · ' || v_n || ' immeuble(s), ' || v_villes,
      'Appels — rôle d’évaluation', 'interested')
    returning id into v_prospect;
    select id into v_deal from crm.deals where prospect_id = v_prospect;
    perform crm.creer_tache(jsonb_build_object('title', 'Rendez-vous avec ' || coalesce(c.decideur, c.nom), 'context', 'Intéressé au téléphone · ' || coalesce(c.telephone, ''),
      'due_at', coalesce(nullif(p ->> 'rappel_le', ''), (now() + interval '2 days')::text), 'assignee_user_id', auth.uid(), 'source', 'system', 'entity_type', 'crm.deals', 'entity_id', v_deal));
  end if;
  insert into crm.role_appels (cle, issue, rappel_le, motif, note, reponses, deal_id, par)
  values (v_cle, v_issue, case when v_issue = 'rappeler' then (p ->> 'rappel_le')::timestamptz end, nullif(btrim(p ->> 'motif'), ''), nullif(btrim(p ->> 'note'), ''),
    coalesce(p -> 'reponses', '{}'::jsonb), v_deal, auth.uid())
  returning id into v_id;
  perform crm.journal('call.logged', 'crm.role_appels', v_id, null, jsonb_build_object('cle', v_cle, 'issue', v_issue), 'log-call');
  return jsonb_build_object('deal_id', v_deal);
end $$;
revoke all on function public.lanceur_appels_file(jsonb), public.lanceur_appel_issue(jsonb) from public, anon;
grant execute on function public.lanceur_appels_file(jsonb), public.lanceur_appel_issue(jsonb) to authenticated;
