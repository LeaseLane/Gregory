-- Prélèvement automatique des loyers par BMO (Paiements Canada, règle H1 et norme 005).
--   1. Le locataire signe un accord de DPA personnel dans son portail (coordonnées bancaires, montant fixe = loyer, le 1er du mois).
--      Le texte signé est conservé tel quel. Premier prélèvement au moins 10 jours après la signature : l'accord (confirmation,
--      H1 art. 16) est disponible dans le portail dès la signature. Révocation en tout temps dans le portail (préavis de 10 jours).
--   2. L'équipe crée le lot d'une échéance (Finances › Prélèvements), télécharge le fichier BMO (fonction prelevements), le dépose
--      dans les Services bancaires en ligne pour entreprises, inscrit les refus (NSF, compte fermé…), puis l'encaissement :
--      loyers payés + registre du fidéicommis (les débits arrivent dans le compte en fidéicommis de Lease Lane).
-- Les numéros de compte ne sortent que par lanceur_prelevement_fichier (finances, 2FA); ailleurs, les 3 derniers chiffres.
-- ponytail: texte de l'accord à faire valider par l'avocate; avis de changement de montant par le portail seulement (H1 art. 17 :
-- « fournir ou rendre disponible »), courriel à ajouter avec un gabarit; nouvel essai d'un débit refusé (H1 : une fois, 30 jours) à la main.

-- ── 1. Accord de DPA ──────────────────────────────────────────────────────
alter table public.tenant_pad_authorizations
  add column if not exists titulaire text,
  add column if not exists institution text check (institution ~ '^\d{3}$'),
  add column if not exists transit text check (transit ~ '^\d{5}$'),
  add column if not exists compte text check (compte ~ '^\d{5,12}$'),
  add column if not exists montant numeric(10,2) check (montant > 0),
  add column if not exists montant_avis_le date,
  add column if not exists premier_prelevement date,
  add column if not exists texte text,
  add column if not exists signe_ip text,
  add column if not exists signe_agent text;
-- Le propriétaire et le locataire lisent l'accord par leurs politiques : jamais les coordonnées bancaires ni la trace de signature.
revoke select on public.tenant_pad_authorizations from authenticated;
grant select (id, lease_id, tenant_id, status, consented_at, consent_method, processor, revoked_at, created_at, titulaire, montant, premier_prelevement)
  on public.tenant_pad_authorizations to authenticated;

create or replace function crm.texte_dpa(p_lease uuid, p_titulaire text, p_institution text, p_transit text, p_compte text, p_montant numeric, p_premier date)
returns text language sql stable security definer set search_path = '' as $$
  select 'Accord de débit préautorisé (DPA) personnel' || E'\n\n' ||
    'Payeur : ' || p_titulaire || E'\n' ||
    'Compte : institution ' || p_institution || ', transit ' || p_transit || ', compte se terminant par ' || right(p_compte, 3) || E'\n' ||
    'Bénéficiaire : Solutions Locatives LeaseLane inc. (Lease Lane), 1516, rue du Layon, Lévis (Québec) G7A 0E6, info@leaselane.ca' || E'\n' ||
    'Logement : ' || b.address || coalesce(', logement ' || u.unit_number, '') || E'\n\n' ||
    'Lease Lane perçoit ce loyer à titre de mandataire du locateur, ' || coalesce(o.full_name, 'le propriétaire') || ', et le dépose dans son compte en fidéicommis.' || E'\n\n' ||
    'J’autorise Lease Lane à débiter le compte ci-dessus d’un montant fixe de ' || replace(to_char(p_montant, 'FM999990.00'), '.', ',') || ' $ le 1er de chaque mois, à compter du ' ||
      to_char(p_premier, 'DD/MM/YYYY') || ', pour le loyer de ce logement. Ces débits sont des DPA personnels. Si le montant ou la date change (par exemple au ' ||
      'renouvellement du bail), Lease Lane m’en avisera au moins 10 jours à l’avance.' || E'\n\n' ||
    'Je peux révoquer cette autorisation en tout temps, avec un préavis de 10 jours, dans mon portail ou en écrivant à info@leaselane.ca. Pour obtenir un modèle de ' ||
      'formulaire d’annulation ou plus d’information sur mon droit d’annuler un accord de DPA, je peux communiquer avec mon institution financière ou visiter www.paiements.ca. ' ||
      'Mettre fin à cet accord ne modifie pas le bail.' || E'\n\n' ||
    'J’ai certains droits de recours si un débit n’est pas conforme au présent accord. Par exemple, j’ai le droit de recevoir le remboursement de tout débit ' ||
      'non autorisé ou non conforme au présent accord de DPA. Pour obtenir plus d’information sur mes droits de recours, je peux communiquer avec mon institution ' ||
      'financière ou visiter www.paiements.ca.'
  from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id left join public.owners o on o.id = b.owner_id
  where l.id = p_lease;
$$;
revoke all on function crm.texte_dpa(uuid, text, text, text, text, numeric, date) from public, anon, authenticated;

-- Premier prélèvement possible : la première échéance ouverte au moins 10 jours après aujourd'hui, sinon le 1er du mois qui suit ce délai.
create or replace function crm.premier_dpa(p_lease uuid) returns date language sql stable security definer set search_path = '' as $$
  select coalesce((select min(due_date) from public.payments where lease_id = p_lease and status <> 'paid' and due_date >= current_date + 10),
    case when extract(day from current_date + 10) = 1 then current_date + 10 else (date_trunc('month', current_date + 10) + interval '1 month')::date end);
$$;
revoke all on function crm.premier_dpa(uuid) from public, anon, authenticated;

-- Aperçu (montant, première date, texte à signer) ou accord en vigueur.
create or replace function public.portail_locataire_dpa() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); v_l uuid; a public.tenant_pad_authorizations;
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  v_l := crm.bail_locataire(v_t);
  if v_l is null then raise exception 'Aucun bail actif.' using errcode = 'PT404'; end if;
  select * into a from public.tenant_pad_authorizations where lease_id = v_l and status = 'active' and revoked_at is null;
  if a.id is not null and a.texte is not null then
    return jsonb_build_object('actif', true, 'texte', a.texte, 'signe_le', a.consented_at, 'montant', a.montant, 'premier', a.premier_prelevement, 'compte', '••• ' || right(a.compte, 3));
  end if;
  return jsonb_build_object('actif', false, 'montant', (select monthly_rent from public.leases where id = v_l), 'premier', crm.premier_dpa(v_l),
    'modele', crm.texte_dpa(v_l, '{titulaire}', '{institution}', '{transit}', '000', (select monthly_rent from public.leases where id = v_l), crm.premier_dpa(v_l)));
end $$;

create or replace function public.portail_locataire_dpa_signer(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); v_l uuid; v_m numeric; v_premier date; v_texte text; v_id uuid; h jsonb;
  v_tit text := btrim(coalesce(p ->> 'titulaire', '')); v_inst text := regexp_replace(coalesce(p ->> 'institution', ''), '\D', '', 'g');
  v_tr text := regexp_replace(coalesce(p ->> 'transit', ''), '\D', '', 'g'); v_cpt text := regexp_replace(coalesce(p ->> 'compte', ''), '\D', '', 'g');
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  v_l := crm.bail_locataire(v_t);
  if v_l is null then raise exception 'Aucun bail actif.' using errcode = 'PT404'; end if;
  if coalesce((p ->> 'accepte')::boolean, false) is not true then raise exception 'Cochez la case pour autoriser le prélèvement.' using errcode = 'PT422'; end if;
  if length(v_tit) < 2 or length(v_tit) > 30 then raise exception 'Nom du titulaire du compte requis (30 caractères au plus).' using errcode = 'PT422'; end if;
  if v_inst !~ '^\d{3}$' or v_tr !~ '^\d{5}$' or v_cpt !~ '^\d{5,12}$' then
    raise exception 'Coordonnées invalides : institution 3 chiffres, transit 5 chiffres, compte 5 à 12 chiffres (voir un spécimen de chèque).' using errcode = 'PT422';
  end if;
  if exists (select 1 from public.tenant_pad_authorizations where lease_id = v_l and status = 'active' and revoked_at is null and texte is not null) then
    raise exception 'Un prélèvement est déjà en place. Annulez-le d’abord pour changer de compte.' using errcode = 'PT409';
  end if;
  select monthly_rent into v_m from public.leases where id = v_l;
  if coalesce(v_m, 0) <= 0 then raise exception 'Loyer du bail inconnu : écrivez à votre gestionnaire.' using errcode = 'PT422'; end if;
  v_premier := crm.premier_dpa(v_l);
  v_texte := crm.texte_dpa(v_l, v_tit, v_inst, v_tr, v_cpt, v_m, v_premier) || E'\n\n' ||
    'Signé électroniquement par ' || v_tit || ' le ' || to_char(now() at time zone 'America/Toronto', 'DD/MM/YYYY à HH24:MI') || ', dans le portail Lease Lane.';
  h := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  insert into public.tenant_pad_authorizations (lease_id, tenant_id, status, consented_at, consent_method, processor, revoked_at, titulaire, institution, transit, compte,
    montant, montant_avis_le, premier_prelevement, texte, signe_ip, signe_agent)
  values (v_l, v_t, 'active', now(), 'portail', 'bmo', null, v_tit, v_inst, v_tr, v_cpt, v_m, null, v_premier, v_texte,
    split_part(coalesce(h ->> 'x-forwarded-for', ''), ',', 1), left(h ->> 'user-agent', 300))
  on conflict (lease_id) do update set tenant_id = excluded.tenant_id, status = 'active', consented_at = excluded.consented_at, consent_method = excluded.consent_method,
    processor = excluded.processor, revoked_at = null, titulaire = excluded.titulaire, institution = excluded.institution, transit = excluded.transit, compte = excluded.compte,
    montant = excluded.montant, montant_avis_le = null, premier_prelevement = excluded.premier_prelevement, texte = excluded.texte, signe_ip = excluded.signe_ip, signe_agent = excluded.signe_agent
  returning id into v_id;
  perform crm.journal('pad.signed', 'public.tenant_pad_authorizations', v_id, null, jsonb_build_object('montant', v_m, 'premier', v_premier, 'compte', '••• ' || right(v_cpt, 3)), 'sign-pad', 'portail');
  return jsonb_build_object('premier', v_premier, 'montant', v_m);
end $$;

create or replace function public.portail_locataire_dpa_annuler() returns void language plpgsql security definer set search_path = '' as $$
declare v_t uuid := public.auth_tenant_id(); v_id uuid;
begin
  if v_t is null then raise exception 'Réservé aux locataires.' using errcode = 'PT403'; end if;
  perform crm.exiger_niveau_portail(false);
  update public.tenant_pad_authorizations set status = 'revoked', revoked_at = now()
   where tenant_id = v_t and status = 'active' and revoked_at is null returning id into v_id;
  if v_id is null then raise exception 'Aucun prélèvement en place.' using errcode = 'PT404'; end if;
  perform crm.journal('pad.revoked', 'public.tenant_pad_authorizations', v_id, null, null, 'revoke-pad', 'portail');
end $$;
revoke all on function public.portail_locataire_dpa(), public.portail_locataire_dpa_signer(jsonb), public.portail_locataire_dpa_annuler() from public, anon;
grant execute on function public.portail_locataire_dpa(), public.portail_locataire_dpa_signer(jsonb), public.portail_locataire_dpa_annuler() to authenticated;

-- ── 2. Lots de prélèvements ───────────────────────────────────────────────
create table if not exists public.prelevement_lots (
  id uuid primary key default gen_random_uuid(),
  echeance date not null,
  statut text not null default 'prepare' check (statut in ('prepare', 'envoye', 'encaisse', 'annule')),
  cpa005_numero int,
  total numeric(12,2) not null default 0,
  nombre int not null default 0,
  cree_par uuid,
  created_at timestamptz not null default now(),
  envoye_le timestamptz,
  encaisse_le date,
  transaction_id uuid references public.bank_transactions(id)
);
create unique index if not exists prelevement_lots_une_echeance on public.prelevement_lots (echeance) where statut <> 'annule';
create table if not exists public.prelevement_lignes (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.prelevement_lots(id),
  payment_id uuid not null references public.payments(id),
  autorisation_id uuid not null references public.tenant_pad_authorizations(id),
  montant numeric(10,2) not null check (montant > 0),
  statut text not null default 'envoye' check (statut in ('envoye', 'refuse', 'encaisse')),
  motif text
);
alter table public.prelevement_lots enable row level security;
alter table public.prelevement_lignes enable row level security;
revoke all on public.prelevement_lots, public.prelevement_lignes from anon, authenticated;
create policy prelevement_lots_finances on public.prelevement_lots for select to authenticated using (crm.can('finances.lire'));
create policy prelevement_lignes_finances on public.prelevement_lignes for select to authenticated using (crm.can('finances.lire'));

-- Numéro de fichier CPA 005 : même compteur que les versements (un émetteur, une suite de numéros), attribué une seule fois par lot.
create or replace function crm.prelevement_lot_numero(p_lot uuid) returns int language plpgsql security definer set search_path = '' as $$
declare v int;
begin
  select cpa005_numero into v from public.prelevement_lots where id = p_lot for update;
  if v is not null then return v; end if;
  update public.company_settings set bmo_dernier_numero = bmo_dernier_numero % 9999 + 1 where id returning bmo_dernier_numero into v;
  update public.prelevement_lots set cpa005_numero = v where id = p_lot;
  return v;
end $$;
revoke all on function crm.prelevement_lot_numero(uuid) from public, anon, authenticated;

-- Candidats d'une échéance, avec la raison d'une exclusion (le lot ne prend que les « ok »).
create or replace function crm.prelevement_candidats(p_echeance date) returns table (payment_id uuid, autorisation_id uuid, montant numeric, locataire text, logement text, raison text)
language sql stable security definer set search_path = '' as $$
  select p.id, a.id, a.montant, coalesce(a.titulaire, t.full_name), b.address || coalesce(' — ' || u.unit_number, ''),
    case when a.compte is null or a.texte is null then 'Accord signé hors du portail : coordonnées bancaires à recueillir'
         when a.premier_prelevement > p_echeance then 'Premier prélèvement prévu le ' || to_char(a.premier_prelevement, 'DD/MM/YYYY')
         when p.amount - coalesce(p.amount_received, 0) <> a.montant then 'Montant dû différent de l’accord : aviser le locataire 10 jours avant'
         when a.montant_avis_le > p_echeance - 10 then 'Nouveau montant avisé il y a moins de 10 jours'
         else 'ok' end
  from public.payments p join public.tenant_pad_authorizations a on a.lease_id = p.lease_id and a.status = 'active' and a.revoked_at is null
    join public.leases l on l.id = p.lease_id join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
    left join public.tenants t on t.id = l.tenant_id
  where p.due_date = p_echeance and p.status <> 'paid' and coalesce(p.collection_status, 'manual') = 'manual';
$$;
revoke all on function crm.prelevement_candidats(date) from public, anon, authenticated;

create or replace function public.lanceur_prelevements(p_echeance date) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux Finances.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'candidats', coalesce((select jsonb_agg(to_jsonb(c) order by c.raison <> 'ok', c.locataire) from crm.prelevement_candidats(p_echeance) c), '[]'::jsonb),
    'lots', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'echeance', l.echeance, 'statut', l.statut, 'numero', l.cpa005_numero, 'total', l.total, 'nombre', l.nombre,
        'envoye_le', l.envoye_le, 'encaisse_le', l.encaisse_le,
        'lignes', (select jsonb_agg(jsonb_build_object('id', g.id, 'montant', g.montant, 'statut', g.statut, 'motif', g.motif, 'locataire', a.titulaire, 'compte', '••• ' || right(a.compte, 3))
          order by a.titulaire) from public.prelevement_lignes g join public.tenant_pad_authorizations a on a.id = g.autorisation_id where g.lot_id = l.id))
      order by l.echeance desc) from public.prelevement_lots l where l.echeance >= p_echeance - 62), '[]'::jsonb),
    'accords', (select count(*) from public.tenant_pad_authorizations where status = 'active' and revoked_at is null and texte is not null),
    'bmo_pret', exists (select 1 from public.company_settings where bmo_originateur is not null and bmo_centre is not null and fiducie_compte is not null),
    'peut_ecrire', crm.can('finances.paiements.ecrire'));
end $$;

create or replace function public.lanceur_prelevement_creer(p_echeance date) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_lot uuid; n int; t numeric;
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas de préparer des prélèvements.' using errcode = 'PT403'; end if;
  if exists (select 1 from public.prelevement_lots where echeance = p_echeance and statut <> 'annule') then
    raise exception 'Un lot existe déjà pour cette échéance.' using errcode = 'PT409';
  end if;
  select count(*), sum(c.montant) into n, t from crm.prelevement_candidats(p_echeance) c where c.raison = 'ok';
  if n = 0 then raise exception 'Aucun loyer à prélever pour cette échéance.' using errcode = 'PT422'; end if;
  insert into public.prelevement_lots (echeance, total, nombre, cree_par) values (p_echeance, t, n, auth.uid()) returning id into v_lot;
  insert into public.prelevement_lignes (lot_id, payment_id, autorisation_id, montant)
    select v_lot, c.payment_id, c.autorisation_id, c.montant from crm.prelevement_candidats(p_echeance) c where c.raison = 'ok';
  update public.payments set collection_status = 'scheduled', collection_error = null where id in (select payment_id from public.prelevement_lignes where lot_id = v_lot);
  perform crm.journal('pad_batch.created', 'public.prelevement_lots', v_lot, null, jsonb_build_object('echeance', p_echeance, 'nombre', n, 'total', t), 'create-pad-batch');
  return v_lot;
end $$;

-- Données du fichier BMO (comptes complets) : lues par la fonction prelevements avec le jeton de la personne.
create or replace function public.lanceur_prelevement_fichier(p_lot uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare l public.prelevement_lots; s public.company_settings;
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas de produire le fichier de prélèvements.' using errcode = 'PT403'; end if;
  select * into l from public.prelevement_lots where id = p_lot;
  if l.id is null then raise exception 'Lot introuvable.' using errcode = 'PT404'; end if;
  if l.statut not in ('prepare', 'envoye') then raise exception 'Lot annulé ou déjà encaissé : aucun fichier.' using errcode = 'PT409'; end if;
  select * into s from public.company_settings where id;
  if s.bmo_originateur is null or s.bmo_centre is null or s.fiducie_institution is null or s.fiducie_transit is null or s.fiducie_compte is null then
    raise exception 'Réglages BMO incomplets : ID d’émetteur, centre de traitement et compte en fidéicommis requis.' using errcode = 'PT409';
  end if;
  perform crm.journal('pad_batch.file', 'public.prelevement_lots', p_lot, null, null, 'export-pad-file', 'interface', null, 'person', null, null, null, true);
  return jsonb_build_object('numero', crm.prelevement_lot_numero(p_lot), 'echeance', l.echeance,
    'originateur', s.bmo_originateur, 'centre', s.bmo_centre, 'retour', jsonb_build_object('institution', s.fiducie_institution, 'transit', s.fiducie_transit, 'compte', s.fiducie_compte),
    'lignes', (select jsonb_agg(jsonb_build_object('montant', g.montant, 'institution', a.institution, 'transit', a.transit, 'compte', a.compte, 'nom', a.titulaire,
        'reference', coalesce(u.reference_paiement, 'LL')) order by a.titulaire)
      from public.prelevement_lignes g join public.tenant_pad_authorizations a on a.id = g.autorisation_id join public.leases le on le.id = a.lease_id
        join public.units u on u.id = le.unit_id where g.lot_id = p_lot));
end $$;

create or replace function public.lanceur_prelevement_action(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare l public.prelevement_lots; g public.prelevement_lignes; v_action text := p ->> 'action'; v_tx public.bank_transactions; v_le date; bail record;
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas de modifier les prélèvements.' using errcode = 'PT403'; end if;
  if v_action = 'refuser' then
    -- Débit retourné par la banque (NSF, compte fermé, révoqué…) : le loyer redevient dû, le locataire voit « Prélèvement refusé ».
    select * into g from public.prelevement_lignes where id = (p ->> 'ligne')::uuid for update;
    select * into l from public.prelevement_lots where id = g.lot_id;
    if g.id is null or g.statut <> 'envoye' or l.statut not in ('prepare', 'envoye') then raise exception 'Ligne introuvable ou déjà traitée.' using errcode = 'PT409'; end if;
    if length(btrim(coalesce(p ->> 'motif', ''))) < 3 then raise exception 'Motif du refus requis (ex. : provision insuffisante).' using errcode = 'PT422'; end if;
    update public.prelevement_lignes set statut = 'refuse', motif = btrim(p ->> 'motif') where id = g.id;
    update public.payments set collection_status = 'failed', collection_error = btrim(p ->> 'motif') where id = g.payment_id;
    update public.prelevement_lots set total = total - g.montant, nombre = nombre - 1 where id = l.id;
    perform crm.journal('pad_batch.item_returned', 'public.prelevement_lignes', g.id, null, jsonb_build_object('motif', p ->> 'motif'), 'return-pad-item');
    return;
  end if;
  select * into l from public.prelevement_lots where id = (p ->> 'lot')::uuid for update;
  if l.id is null then raise exception 'Lot introuvable.' using errcode = 'PT404'; end if;
  if v_action = 'envoye' then
    if l.statut <> 'prepare' or l.cpa005_numero is null then raise exception 'Téléchargez d’abord le fichier du lot.' using errcode = 'PT409'; end if;
    update public.prelevement_lots set statut = 'envoye', envoye_le = now() where id = l.id;
  elsif v_action = 'annuler' then
    if l.statut <> 'prepare' then raise exception 'Seul un lot pas encore déposé chez BMO s’annule.' using errcode = 'PT409'; end if;
    update public.payments set collection_status = 'manual' where id in (select payment_id from public.prelevement_lignes where lot_id = l.id and statut = 'envoye');
    update public.prelevement_lots set statut = 'annule' where id = l.id;
  elsif v_action = 'encaisser' then
    -- Les débits non refusés sont arrivés dans le compte en fidéicommis : loyers payés et registre du propriétaire.
    if l.statut <> 'envoye' then raise exception 'Le lot doit être déposé chez BMO avant d’être encaissé.' using errcode = 'PT409'; end if;
    v_le := coalesce(nullif(p ->> 'le', '')::date, current_date);
    if v_le > current_date or v_le < l.echeance then raise exception 'Date d’encaissement invalide.' using errcode = 'PT422'; end if;
    if nullif(p ->> 'transaction', '') is not null then
      select * into v_tx from public.bank_transactions where id = (p ->> 'transaction')::uuid for update;
      if v_tx.id is null or v_tx.compte <> 'fiducie' or v_tx.match_status in ('matched', 'overpaid') then raise exception 'Dépôt introuvable ou déjà rapproché.' using errcode = 'PT409'; end if;
      if v_tx.amount <> l.total then raise exception 'Le dépôt (% $) ne correspond pas au total du lot (% $).', v_tx.amount, l.total using errcode = 'PT422'; end if;
    end if;
    for g in select * from public.prelevement_lignes where lot_id = l.id and statut = 'envoye' loop
      select le.id, le.unit_id, u.building_id, b.owner_id, coalesce(a.titulaire, 'locataire') nom, u.unit_number into bail
        from public.payments pa join public.leases le on le.id = pa.lease_id join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id
        join public.tenant_pad_authorizations a on a.id = g.autorisation_id where pa.id = g.payment_id;
      insert into public.fiducie_mouvements (owner_id, building_id, lease_id, type, montant, date_valeur, description, source_type, source_id, cree_par)
      values (bail.owner_id, bail.building_id, bail.id, 'loyer', g.montant, v_le, 'Loyer prélevé — ' || bail.nom || ', logement ' || coalesce(bail.unit_number, ''),
        'prelevement_ligne', g.id, (select id from public.users where id = auth.uid()));
      update public.payments set amount_received = coalesce(amount_received, 0) + g.montant, collection_status = 'collected',
        status = case when coalesce(amount_received, 0) + g.montant >= amount then 'paid' else status end,
        paid_date = case when coalesce(amount_received, 0) + g.montant >= amount then v_le else paid_date end where id = g.payment_id;
      update public.prelevement_lignes set statut = 'encaisse' where id = g.id;
    end loop;
    if v_tx.id is not null then
      update public.bank_transactions set match_status = 'matched', reconciled_by = (select id from public.users where id = auth.uid()), reconciled_at = now() where id = v_tx.id;
    end if;
    update public.prelevement_lots set statut = 'encaisse', encaisse_le = v_le, transaction_id = v_tx.id where id = l.id;
  else
    raise exception 'Action inconnue.' using errcode = 'PT422';
  end if;
  perform crm.journal('pad_batch.' || v_action, 'public.prelevement_lots', l.id, jsonb_build_object('statut', l.statut), p, v_action || '-pad-batch');
end $$;
revoke all on function public.lanceur_prelevements(date), public.lanceur_prelevement_creer(date), public.lanceur_prelevement_fichier(uuid), public.lanceur_prelevement_action(jsonb) from public, anon;
grant execute on function public.lanceur_prelevements(date), public.lanceur_prelevement_creer(date), public.lanceur_prelevement_fichier(uuid), public.lanceur_prelevement_action(jsonb) to authenticated;
