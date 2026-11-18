-- Versements du 15 et coordonnées bancaires des propriétaires (revue du 18 nov. 2026).
-- 1. Les honoraires de LeaseLane retenus au registre quittent le compte en fidéicommis dans le même lot (une ligne vers le compte
--    d'exploitation de LeaseLane) : avant, ils restaient à la banque alors que le registre les disait sortis.
-- 2. Un lot s'envoie par fichier OU à la main, jamais les deux (sinon les propriétaires seraient payés deux fois).
-- 3. Les sorties du relevé se rapprochent des versements envoyés (débit global du fichier, ou un virement par propriétaire,
--    ou le transfert des honoraires); ce qui reste introuvable s'affiche.
-- 4. Coordonnées bancaires : toute saisie ou modification doit être vérifiée par une AUTRE personne (rappel au numéro au dossier)
--    avant qu'un versement parte vers ce compte.

alter table public.fiducie_lots add column if not exists mode_envoi text check (mode_envoi in ('fichier', 'manuel'));
alter table public.company_settings add column if not exists exploitation_institution text, add column if not exists exploitation_transit text,
  add column if not exists exploitation_compte text, add column if not exists exploitation_nom text;
comment on column public.company_settings.exploitation_compte is 'Compte d''exploitation de LeaseLane (honoraires), à ne jamais confondre avec le compte en fidéicommis.';

create table if not exists public.fiducie_lot_honoraires (
  lot_id uuid not null references public.fiducie_lots(id) on delete cascade,
  mouvement_id uuid not null unique references public.fiducie_mouvements(id),
  montant numeric(12,2) not null check (montant > 0),
  primary key (lot_id, mouvement_id)
);
alter table public.fiducie_lot_honoraires enable row level security;
drop policy if exists fiducie_lot_honoraires_lecture on public.fiducie_lot_honoraires;
create policy fiducie_lot_honoraires_lecture on public.fiducie_lot_honoraires for select to authenticated using (crm.can('finances.lire'));
revoke all on public.fiducie_lot_honoraires from anon, authenticated; grant all on public.fiducie_lot_honoraires to service_role;

alter table public.bank_transactions add column if not exists fiducie_lot_id uuid references public.fiducie_lots(id),
  add column if not exists fiducie_lot_ligne_id uuid references public.fiducie_lot_lignes(id);
create unique index if not exists bank_transactions_lot_ligne on public.bank_transactions (fiducie_lot_ligne_id) where fiducie_lot_ligne_id is not null;

alter table public.owners add column if not exists versement_modifie_le timestamptz, add column if not exists versement_modifie_par uuid references auth.users(id),
  add column if not exists versement_verifie_le timestamptz, add column if not exists versement_verifie_par uuid references auth.users(id),
  add column if not exists versement_verification_note text;

-- Honoraires retenus pas encore transférés : rattachés au lot (idempotent); rend le total à transférer avec ce lot.
create or replace function public.fiducie_lot_joindre_honoraires(p_lot uuid) returns numeric language plpgsql security definer set search_path to 'public' as $$
declare lot record;
begin
  select * into lot from fiducie_lots where id = p_lot for update;
  if lot is null or lot.statut = 'annule' then raise exception 'Lot introuvable ou annulé'; end if;
  if lot.statut = 'prepare' then
    insert into fiducie_lot_honoraires (lot_id, mouvement_id, montant)
    select p_lot, m.id, -m.montant from fiducie_mouvements m
     where m.type in ('honoraires', 'coordination') and m.montant < 0 and m.date_valeur <= lot.date_versement
       and not exists (select 1 from fiducie_lot_honoraires h join fiducie_lots l on l.id = h.lot_id where h.mouvement_id = m.id and l.statut <> 'annule')
    on conflict (mouvement_id) do nothing;
  end if;
  return coalesce((select sum(montant) from fiducie_lot_honoraires where lot_id = p_lot), 0);
end $$;

-- Le fichier a été généré : ce lot s'envoie par fichier (refusé s'il a déjà été marqué envoyé à la main).
create or replace function public.fiducie_lot_mode(p_lot uuid, p_mode text) returns void language plpgsql security definer set search_path to 'public' as $$
declare lot record;
begin
  select * into lot from fiducie_lots where id = p_lot for update;
  if lot is null or lot.statut = 'annule' then raise exception 'Lot introuvable ou annulé'; end if;
  if p_mode not in ('fichier', 'manuel') then raise exception 'Mode d''envoi inconnu'; end if;
  if lot.mode_envoi is not null and lot.mode_envoi <> p_mode then
    raise exception 'Ce lot est déjà prévu %; l''envoyer aussi % paierait les propriétaires deux fois', case lot.mode_envoi when 'fichier' then 'par fichier' else 'à la main' end, case p_mode when 'fichier' then 'par fichier' else 'à la main' end;
  end if;
  update fiducie_lots set mode_envoi = p_mode where id = p_lot;
end $$;

create or replace function public.fiducie_lot_marquer_envoye(p_lot uuid, p_mode text, p_par uuid default null) returns void language plpgsql security definer set search_path to 'public' as $$
declare lot record;
begin
  perform fiducie_lot_mode(p_lot, p_mode);
  select * into lot from fiducie_lots where id = p_lot for update;
  if lot.statut <> 'prepare' then raise exception 'Seul un lot préparé peut être marqué envoyé'; end if;
  update fiducie_lots set statut = 'envoye', envoye_le = now() where id = p_lot;
end $$;

-- Sorties du relevé ↔ versements envoyés. Sans ambiguïté seulement (un seul candidat); le reste attend une personne.
create or replace function public.fiducie_rapprocher_sorties() returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare s record; n int := 0; c int; v_lot uuid; v_ligne uuid;
begin
  for s in select * from bank_transactions where compte = 'fiducie' and amount < 0 and match_status in ('unmatched', 'ignored')
             and fiducie_lot_id is null and not exists (select 1 from fiducie_attentes a where a.sortie_id = bank_transactions.id) order by transaction_date for update loop
    -- a. débit global d'un fichier : versements + honoraires du lot
    select count(*), min(l.id::text)::uuid into c, v_lot from fiducie_lots l
     where l.statut = 'envoye' and l.mode_envoi = 'fichier' and s.transaction_date between l.date_versement - 5 and l.date_versement + 10
       and not exists (select 1 from bank_transactions b where b.fiducie_lot_id = l.id and b.fiducie_lot_ligne_id is null)
       and round(-s.amount, 2) = round(l.total + coalesce((select sum(montant) from fiducie_lot_honoraires h where h.lot_id = l.id), 0), 2);
    if c = 1 then update bank_transactions set match_status = 'matched', fiducie_lot_id = v_lot, ai_suggestion_note = 'Fichier de versements envoyé (lot du ' || (select date_versement from fiducie_lots where id = v_lot) || ')' where id = s.id; n := n + 1; continue; end if;
    -- b. virement fait à la main pour un propriétaire
    select count(*), min(li.id::text)::uuid into c, v_ligne from fiducie_lot_lignes li join fiducie_lots l on l.id = li.lot_id
     where l.statut = 'envoye' and l.mode_envoi = 'manuel' and s.transaction_date between l.date_versement - 5 and l.date_versement + 10
       and round(-s.amount, 2) = li.montant and not exists (select 1 from bank_transactions b where b.fiducie_lot_ligne_id = li.id);
    if c = 1 then update bank_transactions set match_status = 'matched', fiducie_lot_ligne_id = v_ligne, fiducie_lot_id = (select lot_id from fiducie_lot_lignes where id = v_ligne),
                    ai_suggestion_note = 'Versement au propriétaire' where id = s.id; n := n + 1; continue; end if;
    -- c. transfert des honoraires (lot envoyé à la main)
    select count(*), min(l.id::text)::uuid into c, v_lot from fiducie_lots l
     where l.statut = 'envoye' and l.mode_envoi = 'manuel' and s.transaction_date between l.date_versement - 5 and l.date_versement + 10
       and round(-s.amount, 2) = (select sum(montant) from fiducie_lot_honoraires h where h.lot_id = l.id)
       and not exists (select 1 from bank_transactions b where b.fiducie_lot_id = l.id and b.fiducie_lot_ligne_id is null);
    if c = 1 then update bank_transactions set match_status = 'matched', fiducie_lot_id = v_lot, ai_suggestion_note = 'Honoraires transférés au compte d''exploitation' where id = s.id; n := n + 1; end if;
  end loop;
  return jsonb_build_object('rapprochees', n);
end $$;

-- Ce qui est parti du registre mais pas encore vu au relevé (plus de 5 jours après la date du versement = à regarder).
create or replace function public.fiducie_sorties_attendues() returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_agg(x order by x ->> 'date'), '[]'::jsonb) from (
    select jsonb_build_object('lot_id', l.id, 'date', l.date_versement, 'mode', l.mode_envoi, 'quoi', 'Fichier de versements', 'montant', l.total + coalesce((select sum(montant) from fiducie_lot_honoraires h where h.lot_id = l.id), 0),
           'en_retard', current_date > l.date_versement + 5) x
      from fiducie_lots l where l.statut = 'envoye' and l.mode_envoi = 'fichier' and not exists (select 1 from bank_transactions b where b.fiducie_lot_id = l.id and b.fiducie_lot_ligne_id is null)
    union all
    select jsonb_build_object('lot_id', l.id, 'date', l.date_versement, 'mode', l.mode_envoi, 'quoi', 'Versement à ' || li.nom_compte, 'montant', li.montant, 'en_retard', current_date > l.date_versement + 5)
      from fiducie_lot_lignes li join fiducie_lots l on l.id = li.lot_id where l.statut = 'envoye' and l.mode_envoi = 'manuel' and not exists (select 1 from bank_transactions b where b.fiducie_lot_ligne_id = li.id)
    union all
    select jsonb_build_object('lot_id', l.id, 'date', l.date_versement, 'mode', l.mode_envoi, 'quoi', 'Honoraires vers le compte d''exploitation', 'montant', (select sum(montant) from fiducie_lot_honoraires h where h.lot_id = l.id), 'en_retard', current_date > l.date_versement + 5)
      from fiducie_lots l where l.statut = 'envoye' and l.mode_envoi = 'manuel' and exists (select 1 from fiducie_lot_honoraires h where h.lot_id = l.id)
       and not exists (select 1 from bank_transactions b where b.fiducie_lot_id = l.id and b.fiducie_lot_ligne_id is null)
  ) t;
$$;

-- Coordonnées de versement : modification (garde qui et quand, remet la vérification à zéro) et vérification par une autre personne.
create or replace function public.fiducie_coordonnees_maj(p_owner uuid, p_nom text, p_institution text, p_transit text, p_compte text, p_par uuid) returns void
language plpgsql security definer set search_path to 'public' as $$
begin
  if p_institution !~ '^\d{3}$' or p_transit !~ '^\d{5}$' or p_compte !~ '^\d{5,12}$' then raise exception 'Coordonnées invalides : institution 3 chiffres, transit 5 chiffres, compte 5 à 12 chiffres'; end if;
  update owners set versement_nom_compte = nullif(btrim(p_nom), ''), versement_institution = p_institution, versement_transit = p_transit, versement_compte = p_compte,
         versement_modifie_le = now(), versement_modifie_par = p_par, versement_verifie_le = null, versement_verifie_par = null, versement_verification_note = null
   where id = p_owner;
  if not found then raise exception 'Propriétaire introuvable'; end if;
end $$;

create or replace function public.fiducie_coordonnees_verifier(p_owner uuid, p_par uuid, p_note text) returns void
language plpgsql security definer set search_path to 'public' as $$
declare o record;
begin
  select * into o from owners where id = p_owner for update;
  if o is null or o.versement_compte is null then raise exception 'Aucune coordonnée à vérifier'; end if;
  if p_par is null then raise exception 'Vérificateur requis'; end if;
  if o.versement_modifie_par = p_par then raise exception 'La personne qui a saisi les coordonnées ne peut pas les vérifier : demandez à un collègue'; end if;
  if char_length(btrim(coalesce(p_note, ''))) < 10 then raise exception 'Décrivez la vérification (ex. rappel au 418-… le 18 nov., confirmé par le propriétaire)'; end if;
  update owners set versement_verifie_le = now(), versement_verifie_par = p_par, versement_verification_note = btrim(p_note) where id = p_owner;
end $$;

revoke all on function public.fiducie_lot_joindre_honoraires(uuid), public.fiducie_lot_mode(uuid, text), public.fiducie_lot_marquer_envoye(uuid, text, uuid),
  public.fiducie_rapprocher_sorties(), public.fiducie_sorties_attendues(), public.fiducie_coordonnees_maj(uuid, text, text, text, text, uuid),
  public.fiducie_coordonnees_verifier(uuid, uuid, text) from public, anon, authenticated;

-- Lot : coordonnées vérifiées exigées.
create or replace function public.fiducie_lot(p_date date, p_par uuid DEFAULT NULL::uuid, p_executer boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  o record;
  f record;
  v_lot uuid;
  v_solde numeric;
  v_reserve numeric;
  v_honoraires numeric;
  v_versement numeric;
  v_mvt uuid;
  v_note text;
  lignes jsonb := '[]'::jsonb;
  v_total numeric := 0;
  v_nb int := 0;
begin
  if p_date is null then raise exception 'Date de versement requise'; end if;
  if p_executer then
    if exists (select 1 from fiducie_lots where date_versement = p_date and statut <> 'annule') then
      raise exception 'Un lot existe déjà pour le %', p_date;
    end if;
    insert into fiducie_lots (date_versement, cree_par) values (p_date, p_par) returning id into v_lot;
  end if;

  for o in select id, full_name, versement_nom_compte, versement_institution, versement_transit, versement_compte, versement_modifie_le, versement_verifie_le from owners order by full_name loop
    perform pg_advisory_xact_lock(hashtext('fiducie:' || o.id::text));
    select coalesce(sum(montant), 0) into v_solde from fiducie_mouvements where owner_id = o.id;
    select coalesce(sum(coalesce(fr.montant, 1000)), 0) into v_reserve
      from buildings b left join fiducie_reserves fr on fr.building_id = b.id where b.owner_id = o.id;
    -- Rien au compte : ce propriétaire n'est pas (encore) dans le modèle fidéicommis.
    continue when v_solde <= 0;
    v_honoraires := 0;
    v_note := null;

    -- 1. Factures émises non payées, de la plus ancienne à la plus récente, tant que le solde suffit.
    for f in select id, invoice_number, total_amount, management_fee_amount, coordination_fees_amount from invoices
              where owner_id = o.id and status = 'issued' and coalesce(total_amount, 0) > 0
                and not exists (select 1 from fiducie_mouvements m where m.source_type = 'invoice' and m.source_id = invoices.id)
              order by period_end loop
      if v_solde - f.total_amount < 0 then
        v_note := coalesce(v_note || ' ', '') || 'Facture ' || f.invoice_number || ' non prélevée : solde insuffisant (prélèvement habituel).';
        continue;
      end if;
      if p_executer then
        insert into fiducie_mouvements (owner_id, type, montant, date_valeur, description, source_type, source_id, cree_par)
        values (o.id, 'honoraires', -f.total_amount, p_date,
                'Facture ' || f.invoice_number || ' — gestion ' || f.management_fee_amount || ' $, coordination ' || coalesce(f.coordination_fees_amount, 0) || ' $, taxes incluses',
                'invoice', f.id, p_par);
        update invoices set status = 'paid', collection_status = 'collected', collected_at = now() where id = f.id;
      end if;
      v_solde := v_solde - f.total_amount;
      v_honoraires := v_honoraires + f.total_amount;
    end loop;

    -- 2. Versement : tout le disponible au-delà de la réserve.
    v_versement := round(v_solde - v_reserve, 2);
    if v_versement > 0 and (o.versement_institution is null or o.versement_transit is null or o.versement_compte is null) then
      v_note := coalesce(v_note || ' ', '') || 'Coordonnées bancaires manquantes : pas de versement.';
      v_versement := 0;
    elsif v_versement > 0 and (o.versement_verifie_le is null or o.versement_modifie_le > o.versement_verifie_le) then
      -- revue du 18 nov. 2026 : coordonnées nouvelles ou changées, pas encore confirmées par un rappel fait par une autre personne
      v_note := coalesce(v_note || ' ', '') || 'Coordonnées bancaires à vérifier (rappel au numéro au dossier) : pas de versement.';
      v_versement := 0;
    end if;
    if v_versement > 0 and p_executer then
      insert into fiducie_mouvements (owner_id, type, montant, date_valeur, description, source_type, source_id, cree_par)
      values (o.id, 'versement', -v_versement, p_date, 'Versement du ' || to_char(p_date, 'YYYY-MM-DD'), 'fiducie_lot', v_lot, p_par)
      returning id into v_mvt;
      insert into fiducie_lot_lignes (lot_id, owner_id, montant, mouvement_id, nom_compte, institution, transit, compte)
      values (v_lot, o.id, v_versement, v_mvt, coalesce(nullif(o.versement_nom_compte, ''), o.full_name), o.versement_institution, o.versement_transit, o.versement_compte);
    end if;
    if v_versement > 0 then v_total := v_total + v_versement; v_nb := v_nb + 1; end if;

    lignes := lignes || jsonb_build_object('owner_id', o.id, 'proprietaire', o.full_name, 'honoraires', v_honoraires,
      'reserve', v_reserve, 'versement', greatest(v_versement, 0), 'solde_apres', round(v_solde - greatest(v_versement, 0), 2),
      'coordonnees', o.versement_compte is not null, 'note', v_note);
  end loop;

  if p_executer then
    if v_nb = 0 then raise exception 'Aucun versement à faire pour le %', p_date; end if;
    update fiducie_lots set total = v_total, nombre = v_nb where id = v_lot;
  end if;
  return jsonb_build_object('lot_id', v_lot, 'date', p_date, 'total', v_total, 'nombre', v_nb, 'lignes', lignes);
end;
$function$;

-- Annulation d'un lot : ses honoraires redeviennent à transférer.
create or replace function public.fiducie_annuler_lot(p_lot uuid, p_par uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  lot record;
  l record;
begin
  select * into lot from fiducie_lots where id = p_lot for update;
  if lot is null then raise exception 'Lot introuvable'; end if;
  if lot.statut <> 'prepare' then raise exception 'Seul un lot pas encore envoyé à la banque peut être annulé'; end if;
  for l in select * from fiducie_lot_lignes where lot_id = p_lot loop
    insert into fiducie_mouvements (owner_id, type, montant, date_valeur, description, source_type, source_id, cree_par)
    values (l.owner_id, 'ajustement', l.montant, current_date, 'Annulation du versement du ' || to_char(lot.date_versement, 'YYYY-MM-DD'), 'fiducie_lot_annule', l.id, p_par);
  end loop;
  delete from fiducie_lot_honoraires where lot_id = p_lot;   -- les honoraires de ce lot redeviennent à transférer
  update fiducie_lots set statut = 'annule', annule_le = now() where id = p_lot;
  return jsonb_build_object('ok', true);
end;
$function$;
