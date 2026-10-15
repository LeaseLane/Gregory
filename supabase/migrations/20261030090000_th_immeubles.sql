-- TH · Immeubles (e26 parc, e27 fiche, e31 ajout, e28 logements, l13 mise en marché, e30 publier, e29 annonces).
-- Médiane du quartier : calculée sur le parc (même quartier, même type, au moins 2 loyers). Le site Lease Lane reste publié automatiquement
-- (déclencheur notify_listing_needed); Marketplace, Kijiji et Louer.ca se publient à la main : une tâche part à la location, puis on marque « en ligne ».
-- Cléo propose (crm.proposals, agent mise_en_marche) une baisse vers la médiane et des canaux gratuits pour une annonce en ligne depuis plus de 21 jours;
-- une personne approuve depuis Annonces ou « À approuver ».

alter table public.units add column if not exists photo_urls jsonb default '[]'::jsonb, add column if not exists updated_at timestamptz not null default now(),
  add column if not exists listing_reviewed_by uuid references auth.users(id), add column if not exists listing_reviewed_at timestamptz;
drop trigger if exists units_touch_updated_at on public.units;
create trigger units_touch_updated_at before update on public.units for each row execute function crm.touch_updated_at();
alter table public.inquiries add column if not exists channel text check (channel is null or channel in ('site', 'marketplace', 'kijiji', 'louer'));

create table if not exists crm.listing_channels (
  id uuid primary key default gen_random_uuid(), unit_id uuid not null references public.units(id) on delete cascade,
  channel text not null check (channel in ('site', 'marketplace', 'kijiji', 'louer')),
  status text not null default 'a_publier' check (status in ('a_publier', 'en_ligne', 'retiree')),
  published_at timestamptz, url text, views int not null default 0 check (views >= 0), task_id uuid references crm.tasks(id) on delete set null,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), unique (unit_id, channel)
);
alter table crm.listing_channels enable row level security;
create policy listing_channels_lecture on crm.listing_channels for select to authenticated using (crm.can('immeubles.lire'));
revoke all on crm.listing_channels from anon, authenticated; grant select on crm.listing_channels to authenticated; grant all on crm.listing_channels to service_role;

-- ── Aides ──
create or replace function crm.etat_logement(p_unit uuid) returns text language sql stable security definer set search_path = '' as $$
  select case when u.status = 'available' or not exists (select 1 from public.leases l where l.unit_id = u.id and l.status = 'active') then 'vacant'
              when u.status = 'soon_available' or exists (select 1 from public.leases l where l.unit_id = u.id and l.status = 'active' and l.renewal_response = 'refused') then 'preavis'
              else 'loue' end from public.units u where u.id = p_unit;
$$;
create or replace function crm.loyer_logement(p_unit uuid) returns numeric language sql stable security definer set search_path = '' as $$
  select coalesce((select l.monthly_rent from public.leases l where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1), u.rent) from public.units u where u.id = p_unit;
$$;
create or replace function crm.mediane_loyer(p_zone text, p_type text) returns numeric language sql stable security definer set search_path = '' as $$
  select round(percentile_cont(0.5) within group (order by r)::numeric) from (select crm.loyer_logement(u.id) r from public.units u join public.buildings b on b.id = u.building_id
    where b.zone = p_zone and u.unit_type = p_type) x where r > 0 having count(*) >= 2;
$$;
-- Occupation à une fin de mois : logements existants, logements couverts par un bail à cette date.
create or replace function crm.occupation_mois(p_zone text, p_fin date) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('logements', count(*), 'occupes', count(*) filter (where exists (select 1 from public.leases l where l.unit_id = u.id and l.start_date <= p_fin and coalesce(l.end_date, 'infinity') >= p_fin)))
  from public.units u join public.buildings b on b.id = u.building_id where (p_zone is null or b.zone = p_zone) and u.created_at::date <= p_fin;
$$;
create or replace function crm.jours_en_ligne(p_unit uuid) returns int language sql stable security definer set search_path = '' as $$
  select case when listing_published_at is null then null else (current_date - listing_published_at::date) end from public.units where id = p_unit;
$$;
create or replace function crm.libelle_logement(p_unit uuid) returns text language sql stable security definer set search_path = '' as $$
  select b.address || ' — ' || u.unit_number from public.units u join public.buildings b on b.id = u.building_id where u.id = p_unit;
$$;

-- ── e26 Immeubles ──
create or replace function public.lanceur_immeubles(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_fin date := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir les immeubles.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'indicateurs', (select jsonb_build_object('immeubles', count(distinct b.id), 'proprietaires', count(distinct b.owner_id), 'quartiers', count(distinct b.zone),
        'logements', count(u.id), 'loues', count(u.id) filter (where crm.etat_logement(u.id) <> 'vacant'),
        'vacants', count(u.id) filter (where crm.etat_logement(u.id) = 'vacant'),
        'annonces', count(u.id) filter (where crm.etat_logement(u.id) = 'vacant' and u.listing_published_at is not null),
        'depuis_janvier', count(u.id) filter (where u.created_at >= date_trunc('year', current_date)))
      from public.buildings b left join public.units u on u.building_id = b.id),
    'serie', (select jsonb_agg(crm.occupation_mois(null, (m + interval '1 month - 1 day')::date) || jsonb_build_object('mois', to_char(m, 'YYYY-MM')) order by m)
      from generate_series(date_trunc('month', current_date) - interval '11 months', date_trunc('month', current_date), interval '1 month') m),
    'immeubles', coalesce((select jsonb_agg(x order by (x ->> 'urgentes')::int desc, (x ->> 'demandes')::int desc, x ->> 'adresse') from (
        select jsonb_build_object('id', b.id, 'adresse', b.address, 'quartier', b.zone, 'proprietaire', o.full_name, 'owner_id', o.id,
          'logements', (select count(*) from public.units u where u.building_id = b.id),
          'occupes', (select count(*) from public.units u where u.building_id = b.id and crm.etat_logement(u.id) <> 'vacant'),
          'demandes', (select count(*) from public.service_requests sr join public.units u on u.id = sr.unit_id where u.building_id = b.id and sr.status <> 'closed'),
          'urgentes', (select count(*) from public.service_requests sr join public.units u on u.id = sr.unit_id where u.building_id = b.id and sr.status <> 'closed'
                        and (coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique') or coalesce(sr.safety_override, false)))) x
        from public.buildings b left join public.owners o on o.id = b.owner_id
        where p ->> 'q' is null or b.address ilike '%' || (p ->> 'q') || '%' or b.zone ilike '%' || (p ->> 'q') || '%') z), '[]'::jsonb),
    'quartiers', coalesce((select jsonb_agg(jsonb_build_object('quartier', q.zone, 'mois', (select jsonb_agg(crm.occupation_mois(q.zone, (m + interval '1 month - 1 day')::date) || jsonb_build_object('mois', to_char(m, 'YYYY-MM')) order by m)
        from generate_series(date_trunc('month', current_date) - interval '5 months', date_trunc('month', current_date), interval '1 month') m)) order by q.zone)
      from (select distinct zone from public.buildings where zone is not null) q), '[]'::jsonb),
    'proprietaires', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'nom', full_name, 'depuis', created_at) order by full_name) from public.owners), '[]'::jsonb),
    'quartiers_connus', coalesce((select jsonb_agg(distinct zone order by zone) from public.buildings where zone is not null), '[]'::jsonb));
end $$;

-- ── e27 Fiche immeuble ──
create or replace function public.lanceur_immeuble(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare b public.buildings; o public.owners;
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir les immeubles.' using errcode = 'PT403'; end if;
  select * into b from public.buildings where id = p_id;
  if not found then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
  select * into o from public.owners where id = b.owner_id;
  return jsonb_build_object('id', b.id, 'adresse', b.address, 'quartier', b.zone, 'annee', b.year_built, 'renovation', b.renovated_year, 'etages', b.floors, 'chauffage', b.heating,
    'stationnement', b.parking, 'photo', b.photo_path, 'depuis', b.created_at, 'nb_logements', b.unit_count,
    'proprietaire', case when o.id is not null then jsonb_build_object('id', o.id, 'nom', o.full_name) end,
    'responsable', (select jsonb_build_object('nom', tm.display_name, 'initiales', tm.initials) from crm.team_members tm where tm.user_id = o.responsable_id),
    'logements', coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'numero', u.unit_number, 'type', u.unit_type, 'loyer', crm.loyer_logement(u.id), 'etat', crm.etat_logement(u.id),
        'locataire', t.full_name, 'tenant_id', t.id, 'fin', l.end_date, 'depart', l.renewal_response = 'refused', 'retard', crm.retard_bail(l.id), 'photos', jsonb_array_length(coalesce(u.photo_urls, '[]'::jsonb)))
        order by nullif(regexp_replace(u.unit_number, '\D', '', 'g'), '')::int nulls last, u.unit_number) from public.units u
      left join lateral (select * from public.leases le where le.unit_id = u.id and le.status = 'active' order by le.start_date desc limit 1) l on true
      left join public.tenants t on t.id = l.tenant_id where u.building_id = b.id), '[]'::jsonb),
    'entretien', jsonb_build_object(
      'total', (select count(*) from public.work_orders w join public.units u on u.id = w.unit_id where u.building_id = b.id),
      'annee', (select coalesce(sum(coalesce(w.invoice_total_cents / 100.0, w.estimated_cost)), 0) from public.work_orders w join public.units u on u.id = w.unit_id
                 where u.building_id = b.id and w.status = 'completed' and coalesce(w.worker_reported_done_at, w.created_at) >= date_trunc('year', current_date)),
      'en_cours', (select count(*) from public.work_orders w join public.units u on u.id = w.unit_id where u.building_id = b.id and w.status in ('open', 'assigned', 'in_progress')),
      'derniers', coalesce((select jsonb_agg(x) from (select jsonb_build_object('id', w.id, 'titre', coalesce(nullif(w.description, ''), 'Travaux') || ' · logement ' || u.unit_number,
          'fournisseur', coalesce(wk.company_name, wk.name), 'statut', w.status, 'le', coalesce(w.worker_reported_done_at, w.appointment_at, w.created_at),
          'montant', coalesce(w.invoice_total_cents / 100.0, w.estimated_cost), 'soumissions', (select count(*) from maint.quotes q where q.work_order_id = w.id),
          'accord', exists (select 1 from public.approvals a where a.work_order_id = w.id and a.status = 'pending')) x
        from public.work_orders w join public.units u on u.id = w.unit_id left join public.workers wk on wk.id = w.worker_id where u.building_id = b.id
        order by (w.status in ('open', 'assigned', 'in_progress')) desc, coalesce(w.worker_reported_done_at, w.created_at) desc limit 4) z), '[]'::jsonb)),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.title, 'type', d.doc_type, 'le', d.created_at, 'valide', d.validation_status) order by d.created_at desc)
      from public.documents d where d.building_id = b.id), '[]'::jsonb),
    'revenu', (select jsonb_agg(jsonb_build_object('mois', to_char(m, 'YYYY-MM'),
        'paye', (select coalesce(sum(pa.amount_received), 0) from public.payments pa join public.leases l on l.id = pa.lease_id join public.units u on u.id = l.unit_id
                  where u.building_id = b.id and pa.status = 'paid' and date_trunc('month', pa.due_date) = m),
        'du', (select coalesce(sum(pa.amount - coalesce(pa.amount_received, 0)), 0) from public.payments pa join public.leases l on l.id = pa.lease_id join public.units u on u.id = l.unit_id
                  where u.building_id = b.id and pa.status <> 'paid' and pa.due_date < current_date and date_trunc('month', pa.due_date) = m)) order by m)
      from generate_series(date_trunc('month', current_date) - interval '11 months', date_trunc('month', current_date), interval '1 month') m));
end $$;

create or replace function public.lanceur_immeuble_maj(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare b public.buildings;
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un immeuble.' using errcode = 'PT403'; end if;
  select * into b from public.buildings where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
  if char_length(btrim(coalesce(p ->> 'adresse', ''))) < 5 then raise exception 'Adresse requise.' using errcode = 'PT422'; end if;
  if exists (select 1 from public.buildings x where x.id <> b.id and lower(btrim(x.address)) = lower(btrim(p ->> 'adresse'))) then
    raise exception 'Cette adresse est déjà enregistrée.' using errcode = 'PT409'; end if;
  update public.buildings set address = btrim(p ->> 'adresse'), zone = nullif(btrim(p ->> 'quartier'), ''), year_built = nullif(p ->> 'annee', '')::int,
    floors = nullif(p ->> 'etages', '')::int, heating = nullif(btrim(p ->> 'chauffage'), ''), parking = nullif(btrim(p ->> 'stationnement'), '') where id = b.id;
  perform crm.journal('building.updated', 'public.buildings', b.id, to_jsonb(b), p, 'update-building');
end $$;

-- ── e31 Ajouter un immeuble ──
create or replace function public.lanceur_creer_immeuble(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v uuid; n int := coalesce(nullif(p ->> 'logements', '')::int, 0);
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.ecrire') then raise exception 'Votre rôle ne permet pas d’ajouter un immeuble.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(p ->> 'adresse', ''))) < 5 then raise exception 'Adresse requise.' using errcode = 'PT422'; end if;
  if nullif(p ->> 'owner_id', '') is null or not exists (select 1 from public.owners where id = (p ->> 'owner_id')::uuid) then raise exception 'Propriétaire requis.' using errcode = 'PT422'; end if;
  if n < 1 or n > 400 then raise exception 'Nombre de logements entre 1 et 400.' using errcode = 'PT422'; end if;
  if exists (select 1 from public.buildings where lower(btrim(address)) = lower(btrim(p ->> 'adresse'))) then raise exception 'Cette adresse est déjà enregistrée.' using errcode = 'PT409'; end if;
  insert into public.buildings (owner_id, address, unit_count, zone, year_built) values ((p ->> 'owner_id')::uuid, btrim(p ->> 'adresse'), n, nullif(btrim(p ->> 'quartier'), ''), nullif(p ->> 'annee', '')::int)
  returning id into v;
  -- Logements créés d'office : numérotés de 1 à n, « loués » par défaut (types et loyers à compléter); aucune annonce ne part.
  if coalesce((p ->> 'creer_logements')::boolean, true) then
    insert into public.units (building_id, unit_number, status) select v, g::text, 'occupied' from generate_series(1, n) g;
  end if;
  perform crm.journal('building.created', 'public.buildings', v, null, p, 'create-building');
  return jsonb_build_object('id', v);
end $$;

-- ── e28 Logements ──
create or replace function public.lanceur_logements(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_s text := coalesce(p ->> 'statut', 'tous');
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir les logements.' using errcode = 'PT403'; end if;
  return (with base as (
      select u.id, b.id building_id, b.address || ' — ' || u.unit_number libelle, b.zone, u.unit_type, crm.loyer_logement(u.id) loyer, crm.etat_logement(u.id) etat,
        crm.mediane_loyer(b.zone, u.unit_type) mediane, u.listing_published_at, u.status, u.status_changed_at,
        (select l.end_date from public.leases l where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1) fin
      from public.units u join public.buildings b on b.id = u.building_id),
    filtre as (select * from base where (v_s = 'tous' or (v_s = 'loues' and etat = 'loue') or (v_s = 'vacants' and etat = 'vacant') or (v_s = 'preavis' and etat = 'preavis'))
      and (p ->> 'immeuble' is null or building_id = (p ->> 'immeuble')::uuid) and (p ->> 'type' is null or unit_type = p ->> 'type'))
    select jsonb_build_object(
      'logements', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'libelle', libelle, 'quartier', zone, 'type', unit_type, 'loyer', loyer, 'mediane', mediane, 'etat', etat, 'fin', fin,
          'libre', case when etat <> 'loue' then coalesce(fin, status_changed_at::date) end) order by etat = 'loue', libelle collate "C") from filtre), '[]'::jsonb),
      'total', (select count(*) from filtre), 'loyer_moyen', (select round(avg(loyer)) from filtre where loyer > 0),
      'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'adresse', address) order by address) from public.buildings), '[]'::jsonb),
      'types', coalesce((select jsonb_agg(distinct unit_type order by unit_type) from public.units where unit_type is not null), '[]'::jsonb),
      'sous_marche', coalesce((select jsonb_agg(x order by (x ->> 'ecart')::numeric desc) from (select jsonb_build_object('id', id, 'libelle', libelle, 'ecart', mediane - loyer) x
          from base where etat <> 'vacant' and mediane is not null and loyer > 0 and loyer < mediane order by mediane - loyer desc limit 5) z), '[]'::jsonb),
      'sous_marche_total', (select count(*) from base where etat <> 'vacant' and mediane is not null and loyer > 0 and loyer < mediane),
      'sous_marche_somme', (select coalesce(sum(mediane - loyer), 0) from base where etat <> 'vacant' and mediane is not null and loyer > 0 and loyer < mediane),
      'vacants', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'libelle', libelle, 'type', unit_type, 'loyer', loyer, 'libre', coalesce(fin, status_changed_at::date), 'annonce', listing_published_at is not null)
          order by listing_published_at is not null, libelle collate "C") from base where etat <> 'loue'), '[]'::jsonb)));
end $$;

-- ── l13 Mise en marché ──
create or replace function public.lanceur_mise_en_marche(p_unit uuid default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare u public.units; v_unit uuid := p_unit; v_pub timestamptz;
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir la mise en marché.' using errcode = 'PT403'; end if;
  if v_unit is null then select u2.id into v_unit from public.units u2 where crm.etat_logement(u2.id) <> 'loue' order by u2.listing_published_at nulls last, u2.id limit 1; end if;
  select * into u from public.units where id = v_unit;
  v_pub := u.listing_published_at;
  return jsonb_build_object(
    'a_louer', coalesce((select jsonb_agg(x order by x ->> 'jours' desc nulls last) from (select jsonb_build_object('id', u2.id, 'libelle', crm.libelle_logement(u2.id), 'type', u2.unit_type,
        'loyer', crm.loyer_logement(u2.id), 'etat', crm.etat_logement(u2.id), 'jours', crm.jours_en_ligne(u2.id),
        'libre', coalesce((select l.end_date from public.leases l where l.unit_id = u2.id and l.status = 'active' order by l.start_date desc limit 1), u2.status_changed_at::date)) x
      from public.units u2 where crm.etat_logement(u2.id) <> 'loue') z), '[]'::jsonb),
    'objectif', 21,
    'annonce', case when u.id is not null then jsonb_build_object('id', u.id, 'libelle', crm.libelle_logement(u.id), 'type', u.unit_type, 'loyer', crm.loyer_logement(u.id),
      'suggere', u.suggested_rent, 'superficie', u.area_sqft, 'etage', u.floor, 'inclus', u.amenities,
      'titre', coalesce(u.marketplace_title, crm.libelle_logement(u.id)), 'texte', coalesce(u.listing_description, u.listing_description_short), 'genere_le', u.marketplace_generated_at,
      'photos', coalesce(u.photo_urls, '[]'::jsonb), 'qualite', u.listing_quality_score, 'note_qualite', u.listing_quality_notes,
      'relue_par', crm.nom_membre(u.listing_reviewed_by), 'relue_le', u.listing_reviewed_at, 'publiee_le', v_pub, 'jours', crm.jours_en_ligne(u.id),
      'libre', coalesce((select l.end_date from public.leases l where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1), u.status_changed_at::date),
      'canaux', (select jsonb_object_agg(c, (select jsonb_build_object('statut', lc.status, 'le', lc.published_at, 'vues', lc.views, 'url', lc.url) from crm.listing_channels lc where lc.unit_id = u.id and lc.channel = c))
                 from unnest(array['site', 'marketplace', 'kijiji', 'louer']) c),
      'demandes_canal', (select jsonb_object_agg(ch, n) from (select coalesce(i.channel, 'site') ch, count(*) n from public.inquiries i where i.unit_id = u.id and (v_pub is null or i.created_at >= v_pub) group by 1) z),
      'entonnoir', jsonb_build_object(
        'demandes', (select count(*) from public.inquiries i where i.unit_id = u.id and (v_pub is null or i.created_at >= v_pub)),
        'visites', (select count(*) from public.visits v where v.unit_id = u.id and (v_pub is null or v.created_at >= v_pub) and v.status not in ('declined', 'cancelled')),
        'candidatures', (select count(*) from crm.deals d where d.unit_id = u.id and (v_pub is null or d.created_at >= v_pub))),
      'location', (select tm.display_name from crm.team_members tm where tm.role = 'location' and tm.active order by tm.created_at limit 1)) end);
end $$;

create or replace function public.lanceur_annonce_maj(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare u public.units;
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.ecrire') then raise exception 'Votre rôle ne permet pas de modifier une annonce.' using errcode = 'PT403'; end if;
  select * into u from public.units where id = (p ->> 'unit_id')::uuid for update;
  if not found then raise exception 'Logement introuvable.' using errcode = 'PT404'; end if;
  if char_length(btrim(coalesce(p ->> 'titre', ''))) < 5 then raise exception 'Titre requis.' using errcode = 'PT422'; end if;
  if char_length(btrim(coalesce(p ->> 'texte', ''))) < 40 then raise exception 'Texte de l’annonce trop court.' using errcode = 'PT422'; end if;
  -- Texte relu par une personne : condition pour publier ailleurs que sur le site. Le loyer ne change pas ici (il se modifie à la fiche, ou par la proposition de Cléo).
  update public.units set marketplace_title = btrim(p ->> 'titre'), listing_description = btrim(p ->> 'texte'), listing_reviewed_by = auth.uid(), listing_reviewed_at = now() where id = u.id;
  perform crm.journal('listing.reviewed', 'public.units', u.id, jsonb_build_object('titre', u.marketplace_title, 'texte', u.listing_description), p, 'review-listing');
end $$;

-- ── e30 Publier l'annonce ──
create or replace function public.lanceur_annonce_publier(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare u public.units; c text; v_t crm.tasks; v_quand timestamptz := coalesce(nullif(p ->> 'le', '')::timestamptz, now()); v_lib text; n int := 0;
  v_noms jsonb := '{"site": "Site Lease Lane", "marketplace": "Marketplace", "kijiji": "Kijiji", "louer": "Louer.ca"}';
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.ecrire') then raise exception 'Votre rôle ne permet pas de publier une annonce.' using errcode = 'PT403'; end if;
  select * into u from public.units where id = (p ->> 'unit_id')::uuid for update;
  if not found then raise exception 'Logement introuvable.' using errcode = 'PT404'; end if;
  if crm.etat_logement(u.id) = 'loue' then raise exception 'Ce logement est loué : rien à annoncer.' using errcode = 'PT409'; end if;
  if jsonb_array_length(coalesce(u.photo_urls, '[]'::jsonb)) = 0 then raise exception 'Vérification manquante : ajoutez au moins une photo.' using errcode = 'PT422'; end if;
  if coalesce(crm.loyer_logement(u.id), 0) <= 0 then raise exception 'Vérification manquante : le loyer demandé.' using errcode = 'PT422'; end if;
  if u.listing_reviewed_at is null then raise exception 'Vérification manquante : le texte doit être relu par une personne.' using errcode = 'PT422'; end if;
  if jsonb_array_length(coalesce(p -> 'canaux', '[]'::jsonb)) = 0 then raise exception 'Choisissez au moins un canal.' using errcode = 'PT422'; end if;
  v_lib := crm.libelle_logement(u.id);
  if u.listing_published_at is null then update public.units set listing_published_at = v_quand where id = u.id; end if;
  for c in select jsonb_array_elements_text(p -> 'canaux') loop
    if not v_noms ? c then raise exception 'Canal inconnu : %.', c using errcode = 'PT422'; end if;
    if exists (select 1 from crm.listing_channels where unit_id = u.id and channel = c and status <> 'retiree') then continue; end if;
    if c = 'site' then
      insert into crm.listing_channels (unit_id, channel, status, published_at, created_by) values (u.id, c, 'en_ligne', v_quand, auth.uid())
      on conflict (unit_id, channel) do update set status = 'en_ligne', published_at = v_quand;
    else -- aucune API : une personne de la location publie, puis marque l'annonce en ligne
      v_t := crm.creer_tache(jsonb_build_object('title', 'Publier sur ' || (v_noms ->> c) || ' : ' || v_lib, 'context', 'Immeubles · Mise en marché', 'due_at', v_quand,
        'assignee_role', 'location', 'source', 'system', 'entity_type', 'public.units', 'entity_id', u.id));
      insert into crm.listing_channels (unit_id, channel, status, task_id, created_by) values (u.id, c, 'a_publier', v_t.id, auth.uid())
      on conflict (unit_id, channel) do update set status = 'a_publier', task_id = v_t.id, published_at = null;
    end if;
    n := n + 1;
  end loop;
  perform crm.journal('listing.published', 'public.units', u.id, null, p, 'publish-listing');
  return jsonb_build_object('canaux', n);
end $$;

create or replace function public.lanceur_canal_en_ligne(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare lc crm.listing_channels;
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.ecrire') then raise exception 'Votre rôle ne permet pas de modifier une annonce.' using errcode = 'PT403'; end if;
  select * into lc from crm.listing_channels where unit_id = (p ->> 'unit_id')::uuid and channel = p ->> 'canal' for update;
  if not found then raise exception 'Canal non demandé pour cette annonce.' using errcode = 'PT404'; end if;
  if coalesce(p ->> 'statut', 'en_ligne') = 'retiree' then update crm.listing_channels set status = 'retiree' where id = lc.id;
  else
    update crm.listing_channels set status = 'en_ligne', published_at = coalesce(published_at, now()), url = coalesce(nullif(btrim(p ->> 'url'), ''), url),
      views = coalesce(nullif(p ->> 'vues', '')::int, views) where id = lc.id;
    if lc.channel = 'marketplace' then update public.units set marketplace_posted_at = coalesce(marketplace_posted_at, now()) where id = lc.unit_id; end if;
    update crm.tasks set status = 'done', done_at = now(), done_by = auth.uid() where id = lc.task_id and status = 'open';
  end if;
  perform crm.journal('listing.channel', 'public.units', lc.unit_id, to_jsonb(lc), p, 'update-listing-channel');
end $$;

-- ── e29 Annonces + proposition de Cléo (annonce en ligne depuis plus de 21 jours) ──
create or replace function crm.appliquer_annonce(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare u public.units; c text;
begin
  if coalesce(current_setting('crm.via_proposal', true), '') <> 'on' or auth.uid() is null then
    raise exception 'Un changement d’annonce proposé s’approuve par une personne.' using errcode = 'PT403'; end if;
  select * into u from public.units where id = (p ->> 'id')::uuid for update;
  if crm.etat_logement(u.id) = 'loue' then raise exception 'Ce logement est loué : la proposition ne s’applique plus.' using errcode = 'PT409'; end if;
  if (p ->> 'rent') is not null then
    if (p ->> 'rent')::numeric <= 0 then raise exception 'Loyer invalide.' using errcode = 'PT422'; end if;
    update public.units set rent = (p ->> 'rent')::numeric where id = u.id;
  end if;
  for c in select jsonb_array_elements_text(coalesce(p -> 'canaux', '[]'::jsonb)) loop
    perform public.lanceur_annonce_publier(jsonb_build_object('unit_id', u.id, 'canaux', jsonb_build_array(c)));
  end loop;
  return jsonb_build_object('unit_id', u.id);
end $$;
insert into crm.operation_registry (name, sql_function, target_table, permission, espace, proposable, field_labels, default_role)
values ('adjust-listing', 'crm.appliquer_annonce(jsonb)', 'public.units', 'immeubles.ecrire', 'immeubles', true, '{"rent": "Loyer demandé", "canaux": "Canaux"}', 'location')
on conflict (name) do nothing;

create or replace function crm.proposer_annonces() returns int language plpgsql security definer set search_path = '' as $$
declare r record; v_med numeric; v_after jsonb; v_can jsonb; n int := 0;
begin
  for r in select u.id, u.unit_type, b.zone, crm.loyer_logement(u.id) loyer, crm.jours_en_ligne(u.id) jours from public.units u join public.buildings b on b.id = u.building_id
           where crm.etat_logement(u.id) = 'vacant' and u.listing_published_at is not null and crm.jours_en_ligne(u.id) > 21
             and u.listing_reviewed_at is not null and jsonb_array_length(coalesce(u.photo_urls, '[]'::jsonb)) > 0
             and not exists (select 1 from crm.proposals pr where pr.target_id = u.id and pr.operation = 'adjust-listing' and pr.status = 'pending') loop
    v_med := crm.mediane_loyer(r.zone, r.unit_type); v_after := '{}';
    if v_med is not null and r.loyer > v_med then v_after := jsonb_build_object('rent', v_med); end if;
    -- canaux gratuits seulement (jamais Louer.ca, payant)
    select coalesce(jsonb_agg(c), '[]') into v_can from unnest(array['site', 'marketplace', 'kijiji']) c
     where not exists (select 1 from crm.listing_channels lc where lc.unit_id = r.id and lc.channel = c and lc.status <> 'retiree');
    if jsonb_array_length(v_can) > 0 then v_after := v_after || jsonb_build_object('canaux', v_can); end if;
    continue when v_after = '{}';
    perform crm.create_proposal(jsonb_build_object('agent', 'mise_en_marche', 'operation', 'adjust-listing', 'target_id', r.id, 'after', v_after,
      'reason', 'En ligne depuis ' || r.jours || ' jours, soit ' || (r.jours - 21) || ' de plus que l’objectif.'
        || case when v_med is not null then ' Les ' || coalesce(r.unit_type, 'logements') || ' de ' || coalesce(r.zone, 'ce quartier') || ' se louent ' || comms.montant_court(v_med) || ' en médiane.' else '' end,
      'source_type', 'systeme', 'confidence', 70, 'idempotency_key', 'annonce:' || r.id || ':' || current_date));
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.lanceur_annonces() returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.lire') then raise exception 'Votre rôle ne permet pas de voir les annonces.' using errcode = 'PT403'; end if;
  perform crm.proposer_annonces();
  return jsonb_build_object('objectif', 21,
    'annonces', coalesce((select jsonb_agg(x order by (x ->> 'jours')::int desc) from (select jsonb_build_object('id', u.id, 'titre', coalesce(u.marketplace_title, crm.libelle_logement(u.id)),
        'libelle', crm.libelle_logement(u.id), 'loyer', crm.loyer_logement(u.id), 'photo', u.photo_urls ->> 0, 'jours', crm.jours_en_ligne(u.id),
        'canaux', coalesce((select jsonb_agg(jsonb_build_object('canal', lc.channel, 'statut', lc.status) order by lc.channel) from crm.listing_channels lc where lc.unit_id = u.id and lc.status <> 'retiree'), '[]'::jsonb),
        'vues', (select coalesce(sum(lc.views), 0) from crm.listing_channels lc where lc.unit_id = u.id),
        'demandes', (select count(*) from public.inquiries i where i.unit_id = u.id and i.created_at >= u.listing_published_at)) x
      from public.units u where u.listing_published_at is not null and crm.etat_logement(u.id) <> 'loue') z), '[]'::jsonb),
    'canaux', coalesce((select jsonb_object_agg(ch, n) from (select coalesce(i.channel, 'site') ch, count(*) n from public.inquiries i join public.units u on u.id = i.unit_id
        where u.listing_published_at is not null and i.created_at >= greatest(u.listing_published_at, now() - interval '30 days') group by 1) z), '{}'::jsonb),
    'diffusion', coalesce((select jsonb_object_agg(channel, n) from (select lc.channel, count(*) n from crm.listing_channels lc join public.units u on u.id = lc.unit_id
        where lc.status = 'en_ligne' and crm.etat_logement(u.id) <> 'loue' group by lc.channel) z), '{}'::jsonb),
    'propositions', coalesce((select jsonb_agg(jsonb_build_object('id', pr.id, 'unit_id', pr.target_id, 'libelle', crm.libelle_logement(pr.target_id), 'raison', pr.reason,
        'avant', jsonb_build_object('rent', crm.loyer_logement(pr.target_id), 'canaux', (select count(*) from crm.listing_channels lc where lc.unit_id = pr.target_id and lc.status <> 'retiree')),
        'apres', pr.after) order by pr.created_at) from crm.proposals pr where pr.operation = 'adjust-listing' and pr.status = 'pending'), '[]'::jsonb));
end $$;

revoke all on function crm.etat_logement(uuid), crm.loyer_logement(uuid), crm.mediane_loyer(text, text), crm.occupation_mois(text, date), crm.jours_en_ligne(uuid), crm.libelle_logement(uuid),
  crm.appliquer_annonce(jsonb), crm.proposer_annonces() from public, anon, authenticated;
grant execute on function crm.proposer_annonces() to service_role;
revoke all on function public.lanceur_immeubles(jsonb), public.lanceur_immeuble(uuid), public.lanceur_immeuble_maj(jsonb), public.lanceur_creer_immeuble(jsonb), public.lanceur_logements(jsonb),
  public.lanceur_mise_en_marche(uuid), public.lanceur_annonce_maj(jsonb), public.lanceur_annonce_publier(jsonb), public.lanceur_canal_en_ligne(jsonb), public.lanceur_annonces() from public, anon;
grant execute on function public.lanceur_immeubles(jsonb), public.lanceur_immeuble(uuid), public.lanceur_immeuble_maj(jsonb), public.lanceur_creer_immeuble(jsonb), public.lanceur_logements(jsonb),
  public.lanceur_mise_en_marche(uuid), public.lanceur_annonce_maj(jsonb), public.lanceur_annonce_publier(jsonb), public.lanceur_canal_en_ligne(jsonb), public.lanceur_annonces() to authenticated;
