-- TF · Relevés 31 (renseignements sur l'occupation d'un logement au 31 décembre) : admin x15, propriétaire 10 « Produire et remettre »,
-- locataire 08 « Relevé 31 ». Spec : ordre-des-tranches.md § TF; inventaire x15.
--   • Un relevé par logement et par occupant (locataire du bail actif au 31 décembre de l'année). Aucun relevé sans le numéro
--     d'identification du logement attribué par Revenu Québec (units.rl31_numero) : le logement est listé « numéro manquant ».
--   • Le relevé est figé (donnees) à la production. Aucune remise au locataire sans la validation du propriétaire.
--   • Correction = nouveau relevé (code A, « modifié ») lié à l'ancien, qui est conservé (statut « remplacé »).
--   • Production possible seulement après le 31 décembre de l'année visée; remise avant la fin de février (rappel à l'équipe).
--   • Le format du fichier de transmission à Revenu Québec est à valider avec le guide RL-31 : l'export fourni est un CSV de contrôle.

alter table public.units add column if not exists rl31_numero text check (rl31_numero is null or rl31_numero ~ '^[0-9A-Za-z-]{6,20}$');
comment on column public.units.rl31_numero is 'Numéro d''identification du logement attribué par Revenu Québec (Relevé 31).';
alter table public.owners add column if not exists mailing_address text;
comment on column public.owners.mailing_address is 'RP · adresse du locateur · identifier le locateur sur le Relevé 31 · durée du mandat + 6 ans';

create table if not exists fin.rl31_slips (
  id uuid primary key default gen_random_uuid(), annee int not null check (annee between 2023 and 2100),
  unit_id uuid not null references public.units(id) on delete restrict, lease_id uuid references public.leases(id) on delete set null,
  owner_id uuid not null references public.owners(id) on delete restrict, tenant_id uuid not null references public.tenants(id) on delete restrict,
  code text not null default 'R' check (code in ('R', 'A')), corrige_id uuid references fin.rl31_slips(id) on delete restrict,
  statut text not null default 'brouillon' check (statut in ('brouillon', 'remis', 'remplace')), donnees jsonb not null,
  produit_par uuid references auth.users(id) on delete set null, produit_le timestamptz not null default now(),
  valide_par uuid references auth.users(id) on delete set null, remis_le timestamptz,
  check (statut <> 'remis' or (valide_par is not null or remis_le is not null))
);
create unique index if not exists rl31_un_actif on fin.rl31_slips (annee, unit_id, tenant_id) where statut <> 'remplace';
create index if not exists rl31_owner_idx on fin.rl31_slips (owner_id, annee);
create index if not exists rl31_tenant_idx on fin.rl31_slips (tenant_id);
create index if not exists rl31_unit_idx on fin.rl31_slips (unit_id);
create index if not exists rl31_lease_idx on fin.rl31_slips (lease_id);
create index if not exists rl31_corrige_idx on fin.rl31_slips (corrige_id);
create index if not exists rl31_produit_par_idx on fin.rl31_slips (produit_par);
create index if not exists rl31_valide_par_idx on fin.rl31_slips (valide_par);
alter table fin.rl31_slips enable row level security;
drop policy if exists "rl31 lus par l'equipe, le proprietaire et le locataire remis" on fin.rl31_slips;
create policy "rl31 lus par l'equipe, le proprietaire et le locataire remis" on fin.rl31_slips for select to authenticated
  using (crm.can('finances.lire') or owner_id = public.auth_owner_id() or (tenant_id = public.auth_tenant_id() and statut = 'remis'));
revoke all on fin.rl31_slips from anon, authenticated; grant select on fin.rl31_slips to authenticated; grant all on fin.rl31_slips to service_role;

-- Occupants au 31 décembre : bail en cours ce jour-là (un locataire par bail dans le modèle actuel).
create or replace function crm.rl31_occupants(p_annee int, p_owner uuid default null) returns table (unit_id uuid, lease_id uuid, owner_id uuid, tenant_id uuid, numero text)
language sql stable security definer set search_path = '' as $$
  select distinct on (u.id, l.tenant_id) u.id, l.id, b.owner_id, l.tenant_id, u.rl31_numero
  from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
  where l.tenant_id is not null and l.start_date <= make_date(p_annee, 12, 31) and (l.end_date is null or l.end_date >= make_date(p_annee, 12, 31))
    and (p_owner is null or b.owner_id = p_owner)
  order by u.id, l.tenant_id, l.start_date desc
$$;

-- Contenu figé d'un relevé (locateur, logement, occupant).
create or replace function crm.rl31_donnees(p_unit uuid, p_tenant uuid, p_annee int) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('annee', p_annee, 'numero_logement', u.rl31_numero,
    'logement', jsonb_build_object('adresse', b.address || ' — logement ' || u.unit_number, 'ville', b.city, 'code_postal', b.postal_code),
    'locateur', jsonb_build_object('nom', coalesce(o.company_name, o.full_name), 'adresse', o.mailing_address),
    'mandataire', (select jsonb_build_object('nom', cs.legal_name, 'neq', cs.neq) from public.company_settings cs where cs.id),
    'occupant', jsonb_build_object('nom', t.full_name))
  from public.units u join public.buildings b on b.id = u.building_id join public.owners o on o.id = b.owner_id, public.tenants t where u.id = p_unit and t.id = p_tenant
$$;

-- Production (brouillons) pour une année, tous les propriétaires ou un seul. Retourne les relevés créés et les logements sans numéro.
create or replace function crm.rl31_produire(p_annee int, p_owner uuid default null) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0; v_manquants jsonb := '[]'::jsonb;
begin
  if make_date(p_annee, 12, 31) >= current_date then raise exception 'Les Relevés 31 de % se produisent après le 31 décembre.', p_annee using errcode = 'PT422'; end if;
  for r in select * from crm.rl31_occupants(p_annee, p_owner) loop
    if r.numero is null then
      v_manquants := v_manquants || jsonb_build_object('unit_id', r.unit_id, 'logement', (select b.address || ' — logement ' || u.unit_number from public.units u join public.buildings b on b.id = u.building_id where u.id = r.unit_id));
      continue;
    end if;
    insert into fin.rl31_slips (annee, unit_id, lease_id, owner_id, tenant_id, donnees, produit_par)
    values (p_annee, r.unit_id, r.lease_id, r.owner_id, r.tenant_id, crm.rl31_donnees(r.unit_id, r.tenant_id, p_annee), auth.uid())
    on conflict (annee, unit_id, tenant_id) where statut <> 'remplace' do nothing;
    if found then n := n + 1; end if;
  end loop;
  return jsonb_build_object('crees', n, 'manquants', (select coalesce(jsonb_agg(distinct x), '[]'::jsonb) from jsonb_array_elements(v_manquants) x));
end $$;

-- ── Équipe (x15) ──
create or replace function public.lanceur_rl31(p_annee int) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne permet pas de voir les finances.' using errcode = 'PT403'; end if;
  return jsonb_build_object('annee', p_annee, 'echeance', make_date(p_annee + 1, 2, 28), 'production_possible', make_date(p_annee, 12, 31) < current_date,
    'proprietaires', coalesce((select jsonb_agg(x order by x ->> 'proprietaire') from (
        select jsonb_build_object('owner_id', o.id, 'proprietaire', o.full_name, 'adresse_locateur', o.mailing_address is not null,
          'occupants', (select count(*) from crm.rl31_occupants(p_annee, o.id)), 'sans_numero', (select count(*) from crm.rl31_occupants(p_annee, o.id) c where c.numero is null),
          'brouillons', (select count(*) from fin.rl31_slips s where s.owner_id = o.id and s.annee = p_annee and s.statut = 'brouillon'),
          'remis', (select count(*) from fin.rl31_slips s where s.owner_id = o.id and s.annee = p_annee and s.statut = 'remis')) x
        from public.owners o where exists (select 1 from crm.rl31_occupants(p_annee, o.id))) z), '[]'::jsonb),
    'releves', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'proprietaire', o.full_name, 'logement', s.donnees -> 'logement' ->> 'adresse', 'numero_logement', s.donnees ->> 'numero_logement',
        'occupant', s.donnees -> 'occupant' ->> 'nom', 'code', s.code, 'statut', s.statut, 'corrige_id', s.corrige_id, 'produit_le', s.produit_le, 'remis_le', s.remis_le) order by o.full_name, s.donnees -> 'logement' ->> 'adresse', s.produit_le)
      from fin.rl31_slips s join public.owners o on o.id = s.owner_id where s.annee = p_annee), '[]'::jsonb),
    'sans_numero', coalesce((select jsonb_agg(jsonb_build_object('unit_id', c.unit_id, 'logement', b.address || ' — logement ' || u.unit_number, 'proprietaire', o.full_name) order by b.address, u.unit_number)
      from crm.rl31_occupants(p_annee) c join public.units u on u.id = c.unit_id join public.buildings b on b.id = u.building_id join public.owners o on o.id = b.owner_id where c.numero is null), '[]'::jsonb));
end $$;

create or replace function public.lanceur_rl31_produire(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r jsonb;
begin
  perform crm.require_aal2();
  if not crm.can('finances.ecritures.ecrire') then raise exception 'Votre rôle ne permet pas de produire les Relevés 31.' using errcode = 'PT403'; end if;
  r := crm.rl31_produire((p ->> 'annee')::int, (p ->> 'owner_id')::uuid);
  if (r ->> 'crees')::int > 0 then
    perform crm.creer_tache(jsonb_build_object('title', 'Relevés 31 ' || (p ->> 'annee') || ' : faire valider par les propriétaires, remise avant le 28 février', 'context', (r ->> 'crees') || ' relevé(s) produit(s)',
      'due_at', make_date((p ->> 'annee')::int + 1, 2, 15), 'assignee_role', 'comptabilite', 'source', 'system', 'entity_type', 'fin.rl31_slips', 'canal', 'interface'));
  end if;
  perform crm.journal('rl31.produced', 'fin.rl31_slips', null, null, r || jsonb_build_object('annee', p ->> 'annee'), 'generate-rl31');
  return r;
end $$;

-- Numéro d'identification du logement (Revenu Québec).
create or replace function public.lanceur_rl31_numero(p_unit uuid, p_numero text) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not (crm.can('finances.ecritures.ecrire') or crm.can('immeubles.ecrire')) then raise exception 'Votre rôle ne permet pas de modifier un logement.' using errcode = 'PT403'; end if;
  if btrim(coalesce(p_numero, '')) !~ '^[0-9A-Za-z-]{6,20}$' then raise exception 'Numéro d’identification du logement invalide (6 à 20 caractères).' using errcode = 'PT422'; end if;
  update public.units set rl31_numero = btrim(p_numero) where id = p_unit;
  if not found then raise exception 'Logement introuvable.' using errcode = 'PT404'; end if;
  perform crm.journal('unit.rl31_number_set', 'public.units', p_unit, null, jsonb_build_object('numero', btrim(p_numero)), 'update-unit');
end $$;

-- Correction : nouveau relevé « modifié » (code A) lié à l'ancien, qui est conservé et marqué « remplacé »; il repasse par le propriétaire.
create or replace function public.lanceur_rl31_corriger(p jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare s fin.rl31_slips; v uuid;
begin
  perform crm.require_aal2();
  if not crm.can('finances.ecritures.ecrire') then raise exception 'Votre rôle ne permet pas de corriger un Relevé 31.' using errcode = 'PT403'; end if;
  select * into s from fin.rl31_slips where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Relevé introuvable.' using errcode = 'PT404'; end if;
  if s.statut = 'remplace' then raise exception 'Ce relevé a déjà été corrigé : corrigez le plus récent.' using errcode = 'PT409'; end if;
  if char_length(btrim(coalesce(p ->> 'motif', ''))) < 5 then raise exception 'Indiquez le motif de la correction.' using errcode = 'PT422'; end if;
  update fin.rl31_slips set statut = 'remplace' where id = s.id;
  insert into fin.rl31_slips (annee, unit_id, lease_id, owner_id, tenant_id, code, corrige_id, donnees, produit_par)
  values (s.annee, s.unit_id, s.lease_id, s.owner_id, s.tenant_id, 'A', s.id,
          crm.rl31_donnees(s.unit_id, s.tenant_id, s.annee) || coalesce(p -> 'donnees', '{}'::jsonb) || jsonb_build_object('motif_correction', btrim(p ->> 'motif')), auth.uid())
  returning id into v;
  perform crm.journal('rl31.corrected', 'fin.rl31_slips', v, jsonb_build_object('remplace', s.id), jsonb_build_object('motif', p ->> 'motif'), 'correct-rl31');
  return v;
end $$;

-- Contrôle de transmission (CSV) : relevés remis de l'année.
create or replace function public.lanceur_rl31_fichier(p_annee int) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne permet pas de voir les finances.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('code', s.code, 'annee', s.annee, 'numero_logement', s.donnees ->> 'numero_logement', 'adresse', s.donnees -> 'logement' ->> 'adresse',
      'code_postal', s.donnees -> 'logement' ->> 'code_postal', 'occupant', s.donnees -> 'occupant' ->> 'nom', 'locateur', s.donnees -> 'locateur' ->> 'nom', 'remis_le', s.remis_le) order by s.donnees -> 'logement' ->> 'adresse')
    from fin.rl31_slips s where s.annee = p_annee and s.statut = 'remis'), '[]'::jsonb);
end $$;

-- ── Propriétaire (écran 10) : produire ses brouillons, puis valider et remettre (aucune remise sans lui) ──
create or replace function public.portail_rl31(p_annee int) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id();
begin
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(true);
  return jsonb_build_object('annee', p_annee, 'echeance', make_date(p_annee + 1, 2, 28), 'production_possible', make_date(p_annee, 12, 31) < current_date,
    'logements', coalesce((select jsonb_agg(jsonb_build_object('immeuble', b.address, 'logement', u.unit_number, 'locataire', t.full_name, 'numero', c.numero is not null,
        'releve', (select jsonb_build_object('id', s.id, 'statut', s.statut, 'code', s.code) from fin.rl31_slips s where s.annee = p_annee and s.unit_id = c.unit_id and s.tenant_id = c.tenant_id and s.statut <> 'remplace'))
        order by b.address, u.unit_number)
      from crm.rl31_occupants(p_annee, v_o) c join public.units u on u.id = c.unit_id join public.buildings b on b.id = u.building_id join public.tenants t on t.id = c.tenant_id), '[]'::jsonb));
end $$;

create or replace function public.portail_rl31_produire(p_annee int) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r jsonb;
begin
  perform crm.exiger_niveau_portail(true); perform crm.proprio_peut_ecrire();
  if public.auth_owner_id() is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  r := crm.rl31_produire(p_annee, public.auth_owner_id());
  perform crm.journal('rl31.produced', 'fin.rl31_slips', null, null, r || jsonb_build_object('annee', p_annee), 'generate-rl31', 'portail');
  return r;
end $$;

create or replace function public.portail_rl31_remettre(p_annee int) returns int language plpgsql security definer set search_path = '' as $$
declare v_o uuid := public.auth_owner_id(); n int; s record;
begin
  perform crm.exiger_niveau_portail(true); perform crm.proprio_peut_ecrire();
  if v_o is null then raise exception 'Réservé aux propriétaires.' using errcode = 'PT403'; end if;
  n := 0;
  for s in update fin.rl31_slips set statut = 'remis', valide_par = auth.uid(), remis_le = now() where owner_id = v_o and annee = p_annee and statut = 'brouillon' returning id, tenant_id loop
    perform crm.notifier(array(select user_id from public.tenants where id = s.tenant_id), 'info', 'file', 'Votre Relevé 31 de ' || p_annee || ' est disponible.', 'Pour votre déclaration de revenus (crédit d’impôt pour solidarité).',
      null, '/locataire/paiements?rl31=' || s.id, 'fin.rl31_slips', s.id);
    n := n + 1;
  end loop;
  if n = 0 then raise exception 'Aucun relevé à remettre : produisez d’abord les relevés.' using errcode = 'PT409'; end if;
  perform crm.journal('rl31.validated_and_issued', 'fin.rl31_slips', null, null, jsonb_build_object('annee', p_annee, 'nombre', n), 'issue-rl31', 'portail');
  return n;
end $$;

-- ── Locataire (écran 08) : ses relevés remis ──
create or replace function public.portail_locataire_rl31(p_id uuid default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id();
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  if p_id is not null then
    return (select jsonb_build_object('id', s.id, 'annee', s.annee, 'code', s.code, 'remis_le', s.remis_le, 'donnees', s.donnees) from fin.rl31_slips s where s.id = p_id and s.tenant_id = v_t and s.statut = 'remis');
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'annee', s.annee, 'code', s.code, 'remis_le', s.remis_le) order by s.annee desc, s.remis_le desc)
    from fin.rl31_slips s where s.tenant_id = v_t and s.statut = 'remis'), '[]'::jsonb);
end $$;

-- Locataire 05 et 08 : le Relevé 31 vient des relevés remis (plus des documents).
create or replace function public.portail_locataire_paiements() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); v_l uuid; v_baux uuid[]; pad record; v_prochain record;
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  v_l := crm.bail_locataire(v_t); v_baux := array(select id from public.leases where tenant_id = v_t);   -- l'année et l'historique couvrent aussi le bail précédent
  select * into pad from public.tenant_pad_authorizations where tenant_id = v_t and status = 'active' and revoked_at is null order by consented_at desc nulls last limit 1;
  select * into v_prochain from public.payments where lease_id = v_l and status <> 'paid' order by due_date limit 1;
  return jsonb_build_object(
    'prochain', case when v_prochain.id is not null then jsonb_build_object('echeance', v_prochain.due_date, 'montant', v_prochain.amount - coalesce(v_prochain.amount_received, 0),
      'en_retard', v_prochain.due_date < current_date, 'jours', current_date - v_prochain.due_date, 'echec', v_prochain.collection_status = 'failed') end,
    'annee', jsonb_build_object('paye', coalesce((select sum(amount_received) from public.payments where lease_id = any (v_baux) and status = 'paid' and extract(year from due_date) = extract(year from current_date)), 0),
      'loyers', (select count(*) from public.payments where lease_id = any (v_baux) and status = 'paid' and extract(year from due_date) = extract(year from current_date)),
      'prevus', (select count(*) from public.payments where lease_id = any (v_baux) and extract(year from due_date) = extract(year from current_date))),
    'retards', (select count(*) from public.payments where lease_id = any (v_baux) and coalesce(paid_date, current_date) > due_date + 1 and due_date < current_date),
    'en_retard', (select coalesce(sum(amount - coalesce(amount_received, 0)), 0) from public.payments where lease_id = any (v_baux) and status <> 'paid' and due_date < current_date),
    'historique', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'periode', p.due_date, 'recu_le', p.paid_date, 'mode', case when p.collection_status = 'collected' then 'Prélèvement' when p.status = 'paid' then 'Virement' end,
        'montant', p.amount, 'statut', case when p.status = 'paid' then 'paye' when p.due_date < current_date then 'retard' else 'a_venir' end) order by p.due_date desc)
      from public.payments p where p.lease_id = any (v_baux) and p.due_date <= current_date), '[]'::jsonb),
    'mode', case when pad.id is not null then jsonb_build_object('type', 'prelevement', 'depuis', pad.consented_at, 'compte', pad.notes) else jsonb_build_object('type', 'virement') end,
    'interac', (select c.courriel_interac from public.consigne_paiement_locataire() c limit 1),
    'reference', (select c.reference_paiement from public.consigne_paiement_locataire() c limit 1),
    'releve31', (select jsonb_build_object('id', s.id, 'annee', s.annee) from fin.rl31_slips s where s.tenant_id = v_t and s.statut = 'remis' order by s.annee desc, s.remis_le desc limit 1));
end $$;

create or replace function public.portail_locataire_logement() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); l record;
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  select le.*, u.unit_number, u.unit_type, u.area_sqft, u.floor, u.parking_spots, b.id as building_id, b.address, b.zone, b.city, b.postal_code, b.year_built, b.renovated_year, b.unit_count, b.floors,
         b.access_notes, b.collection_notes, b.photo_path into l
    from public.leases le join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id where le.id = crm.bail_locataire(v_t);
  if l.id is null then return jsonb_build_object('bail', null); end if;
  return jsonb_build_object(
    'adresse', l.address, 'logement', l.unit_number, 'secteur', l.zone, 'ville', l.city, 'code_postal', l.postal_code, 'photo', l.photo_path is not null, 'immeuble_id', l.building_id,
    'logement_info', jsonb_build_object('type', l.unit_type, 'superficie', l.area_sqft, 'etage', l.floor, 'stationnements', l.parking_spots),
    'bail', jsonb_build_object('id', l.id, 'loyer', l.monthly_rent, 'debut', l.start_date, 'fin', l.end_date, 'statut', l.status, 'fenetre', crm.fenetre_avis(l.start_date, l.end_date)::text,
      'document', (select d.id from public.documents d where (d.lease_id = l.id or d.tenant_id = v_t) and d.visibility = 'tous' and (d.category = 'Bail et annexes' or d.doc_type = 'bail')
                   and (d.storage_path is not null or d.file_url is not null) order by d.created_at desc limit 1)),
    'inclusions', to_jsonb(l.inclusions),
    'immeuble', jsonb_build_object('construit', l.year_built, 'renove', l.renovated_year, 'logements', l.unit_count, 'etages', l.floors, 'acces', l.access_notes, 'collecte', l.collection_notes),
    'contact', crm.contact_locataire(),
    'cession', (select jsonb_build_object('id', a.id, 'statut', a.status) from crm.assignments a where a.lease_id = l.id and a.status in ('recue', 'solvabilite', 'accord_proprietaire') limit 1),
    'documents', coalesce((select jsonb_agg(x) from (select jsonb_build_object('id', d.id, 'titre', d.title, 'categorie', coalesce(d.category, 'Autres'), 'le', d.created_at,
          'lisible', d.storage_path is not null or d.file_url is not null) x
        from public.documents d where (d.lease_id = l.id or d.tenant_id = v_t) and d.visibility = 'tous' order by d.created_at desc limit 4) z), '[]'::jsonb),
    'releve31', (select jsonb_build_object('id', s.id, 'annee', s.annee) from fin.rl31_slips s where s.tenant_id = v_t and s.statut = 'remis' order by s.annee desc, s.remis_le desc limit 1));
end $$;

revoke all on function public.portail_locataire_paiements(), public.portail_locataire_logement() from public, anon;
grant execute on function public.portail_locataire_paiements(), public.portail_locataire_logement() to authenticated;

revoke all on function crm.rl31_occupants(int, uuid), crm.rl31_donnees(uuid, uuid, int), crm.rl31_produire(int, uuid) from public, anon, authenticated;
revoke all on function public.lanceur_rl31(int), public.lanceur_rl31_produire(jsonb), public.lanceur_rl31_numero(uuid, text), public.lanceur_rl31_corriger(jsonb), public.lanceur_rl31_fichier(int),
  public.portail_rl31(int), public.portail_rl31_produire(int), public.portail_rl31_remettre(int), public.portail_locataire_rl31(uuid) from public, anon;
grant execute on function public.lanceur_rl31(int), public.lanceur_rl31_produire(jsonb), public.lanceur_rl31_numero(uuid, text), public.lanceur_rl31_corriger(jsonb), public.lanceur_rl31_fichier(int),
  public.portail_rl31(int), public.portail_rl31_produire(int), public.portail_rl31_remettre(int), public.portail_locataire_rl31(uuid) to authenticated;
