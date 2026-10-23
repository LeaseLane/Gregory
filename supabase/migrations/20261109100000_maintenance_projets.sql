-- Maintenance · Projets (e74) : un gros travaux d'immeuble suivi en 5 étapes (cadrage, approbation, soumissions, travaux, terminé),
-- cadré avant d'être soumissionné (besoin, exigences, portée, arbitrages) et comparé sur la même portée (couverture par élément, prix à portée égale).
-- Les soumissions de projet sont à part de maint.quotes (liées à un bon de travail). Relances et demandes de prix = tâches de l'équipe.

create sequence if not exists maint.projet_numero;
create table if not exists maint.projets (
  id uuid primary key default gen_random_uuid(), numero text not null unique default ('P-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('maint.projet_numero')::text, 2, '0')),
  titre text not null check (length(btrim(titre)) between 3 and 120), building_id uuid references public.buildings(id), owner_id uuid references public.owners(id),
  budget_min numeric(10,2) check (budget_min > 0), budget_max numeric(10,2) check (budget_max > 0),
  etape text not null default 'cadrage' check (etape in ('cadrage', 'approbation', 'soumissions', 'travaux', 'termine', 'annule')),
  cadrage_debut date not null default current_date, cadrage_fin date, approuve_le date, approuve_par text, approuve_via text,
  soumissions_voulues int not null default 3 check (soumissions_voulues between 1 and 6), soumissions_limite date, travaux_debut date, fin_prevue date, termine_le date,
  besoin text, rapport_libelle text, rapport_chemin text, exigences text[] not null default '{}',
  elements jsonb not null default '[]' check (jsonb_typeof(elements) = 'array'), inclus text, exclus text, exclus_note text, reporte text, reporte_revision text,
  arbitrages jsonb not null default '[]' check (jsonb_typeof(arbitrages) = 'array'),
  cree_par uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists maint.projet_soumissions (
  id uuid primary key default gen_random_uuid(), projet_id uuid not null references maint.projets(id) on delete cascade, worker_id uuid not null references public.workers(id),
  statut text not null default 'attendue' check (statut in ('attendue', 'recue', 'choisie', 'refusee')), demandee_le date not null default current_date, relance_le date,
  montant numeric(10,2) check (montant > 0), montant_note text, couverture jsonb not null default '{}' check (jsonb_typeof(couverture) = 'object'),
  estimation_manquants numeric(10,2) check (estimation_manquants >= 0), garantie text, debut date, recue_le date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (projet_id, worker_id));
create index if not exists projet_soumissions_projet on maint.projet_soumissions (projet_id);
alter table maint.projets enable row level security; alter table maint.projet_soumissions enable row level security;
revoke all on maint.projets, maint.projet_soumissions from anon, authenticated;

create or replace function public.lanceur_projets() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à Maintenance.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'projets', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'numero', p.numero, 'titre', p.titre, 'adresse', b.address, 'proprietaire', o.full_name, 'etape', p.etape,
        'budget_min', p.budget_min, 'budget_max', p.budget_max, 'voulues', p.soumissions_voulues, 'limite', p.soumissions_limite, 'travaux_debut', p.travaux_debut, 'fin_prevue', p.fin_prevue,
        'recues', (select count(*) from maint.projet_soumissions s where s.projet_id = p.id and s.statut <> 'attendue'))
      order by (p.etape in ('termine', 'annule')), p.created_at desc) from maint.projets p left join public.buildings b on b.id = p.building_id left join public.owners o on o.id = p.owner_id), '[]'),
    'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'adresse', b.address) order by b.address) from public.buildings b), '[]'),
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $$;

create or replace function public.lanceur_projet(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à Maintenance.' using errcode = 'PT403'; end if;
  select to_jsonb(p) || jsonb_build_object('adresse', b.address, 'proprietaire', o.full_name,
      'soumissions', coalesce((select jsonb_agg(to_jsonb(s) || jsonb_build_object('fournisseur', w.name) order by (s.statut = 'attendue'), s.recue_le nulls last, w.name)
        from maint.projet_soumissions s join public.workers w on w.id = s.worker_id where s.projet_id = p.id), '[]'),
      'fournisseurs', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'nom', w.name, 'specialite', w.specialty) order by w.name) from public.workers w
        where not exists (select 1 from maint.projet_soumissions s where s.projet_id = p.id and s.worker_id = w.id)), '[]'),
      'peut_ecrire', crm.can('maintenance.ecrire'))
  into r from maint.projets p left join public.buildings b on b.id = p.building_id left join public.owners o on o.id = p.owner_id where p.id = p_id;
  if r is null then raise exception 'Projet introuvable.' using errcode = 'PT404'; end if;
  return r;
end $$;

-- Actions : creer, approuver (accord du propriétaire), inviter (demander une soumission + tâche de relance), soumission (inscrire une soumission reçue),
-- demander_prix (tâche : prix d'un élément non couvert), choisir (à la dernière soumission attendue ou après la date limite), etape (travaux commencés, terminé, annulé).
create or replace function public.lanceur_projet_action(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare pr maint.projets; s maint.projet_soumissions; v_nom text; v_id uuid; v_recues int;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas de modifier les projets.' using errcode = 'PT403'; end if;
  if p ->> 'action' = 'creer' then
    insert into maint.projets (titre, building_id, owner_id, budget_min, budget_max, besoin, cree_par)
    values (btrim(p ->> 'titre'), nullif(p ->> 'building_id', '')::uuid, (select owner_id from public.buildings where id = nullif(p ->> 'building_id', '')::uuid),
            nullif(p ->> 'budget_min', '')::numeric, nullif(p ->> 'budget_max', '')::numeric, nullif(btrim(p ->> 'besoin'), ''), auth.uid()) returning * into pr;
    perform crm.journal('projet.cree', 'maint.projets', pr.id, null, to_jsonb(pr), 'create-project');
    return jsonb_build_object('id', pr.id);
  end if;
  if p ->> 'action' in ('demander_prix', 'soumission', 'choisir') then
    select * into s from maint.projet_soumissions where id = (p ->> 'soumission_id')::uuid;
    v_id := coalesce(s.projet_id, (p ->> 'projet_id')::uuid);
  else v_id := (p ->> 'id')::uuid; end if;
  select * into pr from maint.projets where id = coalesce(v_id, (p ->> 'projet_id')::uuid) for update;
  if not found then raise exception 'Projet introuvable.' using errcode = 'PT404'; end if;
  case p ->> 'action'
  when 'approuver' then
    update maint.projets set etape = 'soumissions', cadrage_fin = coalesce(cadrage_fin, current_date), approuve_le = current_date, approuve_par = coalesce(nullif(btrim(p ->> 'par'), ''), (select full_name from public.owners where id = pr.owner_id)),
      approuve_via = nullif(btrim(p ->> 'via'), ''), soumissions_limite = coalesce(soumissions_limite, current_date + 6), updated_at = now() where id = pr.id;
  when 'inviter' then
    select name into v_nom from public.workers where id = (p ->> 'worker_id')::uuid;
    if v_nom is null then raise exception 'Fournisseur introuvable.' using errcode = 'PT404'; end if;
    insert into maint.projet_soumissions (projet_id, worker_id, relance_le) values (pr.id, (p ->> 'worker_id')::uuid, current_date + 5) returning * into s;
    perform crm.creer_tache(jsonb_build_object('title', 'Relancer ' || v_nom || ' pour la soumission ' || pr.numero, 'context', 'Maintenance · ' || pr.titre,
      'due_at', (current_date + 5)::timestamptz + interval '9 hours', 'assignee_user_id', auth.uid(), 'entity_type', 'maint.projets', 'entity_id', pr.id, 'canal', 'interface'));
  when 'soumission' then
    if s.id is null then raise exception 'Soumission introuvable.' using errcode = 'PT404'; end if;
    if not ((p ->> 'montant')::numeric > 0) then raise exception 'Montant de la soumission requis.' using errcode = 'PT422'; end if;
    update maint.projet_soumissions set statut = 'recue', recue_le = current_date, montant = (p ->> 'montant')::numeric, montant_note = nullif(btrim(p ->> 'montant_note'), ''),
      couverture = coalesce(p -> 'couverture', couverture), estimation_manquants = nullif(p ->> 'estimation_manquants', '')::numeric, garantie = nullif(btrim(p ->> 'garantie'), ''),
      debut = nullif(p ->> 'debut', '')::date, updated_at = now() where id = s.id;
    update crm.tasks set status = 'done', done_at = now() where entity_type = 'maint.projets' and entity_id = pr.id and status <> 'done'
      and title = 'Relancer ' || (select name from public.workers where id = s.worker_id) || ' pour la soumission ' || pr.numero;
  when 'demander_prix' then
    perform crm.creer_tache(jsonb_build_object('title', 'Demander le prix de « ' || coalesce(p ->> 'element', 'l’élément manquant') || ' » à ' || (select name from public.workers where id = s.worker_id),
      'context', 'Maintenance · ' || pr.numero || ' · pour comparer à portée égale', 'due_at', now() + interval '1 day', 'assignee_user_id', auth.uid(), 'entity_type', 'maint.projets', 'entity_id', pr.id, 'canal', 'interface'));
  when 'choisir' then
    select count(*) into v_recues from maint.projet_soumissions where projet_id = pr.id and statut <> 'attendue';
    if v_recues < pr.soumissions_voulues and (pr.soumissions_limite is null or current_date <= pr.soumissions_limite) then
      raise exception 'Le choix s''active à la % soumission, au plus tard le %.', pr.soumissions_voulues || 'e', to_char(pr.soumissions_limite, 'DD/MM') using errcode = 'PT409'; end if;
    if s.statut <> 'recue' then raise exception 'Seule une soumission reçue peut être choisie.' using errcode = 'PT422'; end if;
    update maint.projet_soumissions set statut = case when id = s.id then 'choisie' else 'refusee' end, updated_at = now() where projet_id = pr.id and statut in ('recue', 'attendue');
    update maint.projets set etape = 'travaux', travaux_debut = coalesce(s.debut, travaux_debut), updated_at = now() where id = pr.id;
  when 'etape' then
    if p ->> 'etape' not in ('travaux', 'termine', 'annule') then raise exception 'Étape : travaux, terminé ou annulé.' using errcode = 'PT422'; end if;
    update maint.projets set etape = p ->> 'etape', termine_le = case when p ->> 'etape' = 'termine' then current_date end, updated_at = now() where id = pr.id;
  else raise exception 'Action inconnue.' using errcode = 'PT422';
  end case;
  perform crm.journal('projet.' || (p ->> 'action'), 'maint.projets', pr.id, null, p - 'action', 'update-project');
  return jsonb_build_object('ok', true, 'id', pr.id);
end $$;

revoke all on function public.lanceur_projets(), public.lanceur_projet(uuid), public.lanceur_projet_action(jsonb) from public, anon;
grant execute on function public.lanceur_projets(), public.lanceur_projet(uuid), public.lanceur_projet_action(jsonb) to authenticated, service_role;
