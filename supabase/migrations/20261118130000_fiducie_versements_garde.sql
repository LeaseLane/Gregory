-- Versements du 15 et coordonnées bancaires des propriétaires (revue du 18 nov. 2026).
-- 1. Les honoraires de LeaseLane retenus au registre quittent le compte en fidéicommis dans le même lot (une ligne vers le compte
--    d'exploitation de LeaseLane) : avant, ils restaient à la banque alors que le registre les disait sortis.
-- 2. Un lot s'envoie par fichier OU à la main, jamais les deux (sinon les propriétaires seraient payés deux fois).
-- 3. Les sorties du relevé se rapprochent des versements envoyés (débit global du fichier, ou un virement par propriétaire,
--    ou le transfert des honoraires); ce qui reste introuvable s'affiche.
-- 4. Coordonnées bancaires : toute saisie ou modification doit être vérifiée par une AUTRE personne (rappel au numéro au dossier)
--    avant qu'un versement parte vers ce compte.

alter table public.fiducie_lots add column if not exists mode_envoi text check (mode_envoi in ('fichier', 'manuel')), add column if not exists envoye_par uuid references auth.users(id);
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
  -- une seule fois, avant tout envoi (revue de code : un fichier retéléchargé aurait rattaché des honoraires jamais transférés);
  -- honoraires des factures seulement (une écriture manuelle d'honoraires peut déjà avoir été transférée à la main)
  if lot.statut = 'prepare' and lot.mode_envoi is null then
    insert into fiducie_lot_honoraires (lot_id, mouvement_id, montant)
    select p_lot, m.id, -m.montant from fiducie_mouvements m
     where m.type in ('honoraires', 'coordination') and m.montant < 0 and m.source_type = 'invoice' and m.date_valeur <= lot.date_versement
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
  update fiducie_lots set statut = 'envoye', envoye_le = now(), envoye_par = p_par where id = p_lot;
end $$;

-- Sorties du relevé ↔ versements envoyés. Sans ambiguïté seulement (un seul candidat); le reste attend une personne.
create or replace function public.fiducie_rapprocher_sorties() returns jsonb language plpgsql security definer set search_path to 'public' as $$
-- Une sortie se rapproche seulement si UN SEUL versement attendu, toutes catégories confondues, a ce montant dans la fenêtre de dates
-- (revue de code : un chèque de fournisseur du même montant qu'un versement le masquait). Une sortie déjà décidée par une personne
-- (reconciled_by) n'est pas touchée. Sinon elle reste à regarder.
declare s record; n int := 0; c record;
begin
  for s in select * from bank_transactions where compte = 'fiducie' and amount < 0 and match_status in ('unmatched', 'ignored') and reconciled_by is null
             and fiducie_lot_id is null and not exists (select 1 from fiducie_attentes a where a.sortie_id = bank_transactions.id) order by transaction_date for update loop
    with cand as (
      select l.id lot_id, null::uuid ligne_id, 'Fichier de versements envoyé (lot du ' || l.date_versement || ')' note from fiducie_lots l
       where l.statut = 'envoye' and l.mode_envoi = 'fichier' and s.transaction_date between l.date_versement - 5 and l.date_versement + 10
         and not exists (select 1 from bank_transactions b where b.fiducie_lot_id = l.id and b.fiducie_lot_ligne_id is null)
         and round(-s.amount, 2) = round(l.total + coalesce((select sum(montant) from fiducie_lot_honoraires h where h.lot_id = l.id), 0), 2)
      union all
      select l.id, li.id, 'Versement au propriétaire (' || li.nom_compte || ')' from fiducie_lot_lignes li join fiducie_lots l on l.id = li.lot_id
       where l.statut = 'envoye' and l.mode_envoi = 'manuel' and s.transaction_date between l.date_versement - 5 and l.date_versement + 10
         and round(-s.amount, 2) = li.montant and not exists (select 1 from bank_transactions b where b.fiducie_lot_ligne_id = li.id)
      union all
      select l.id, null, 'Honoraires transférés au compte d''exploitation' from fiducie_lots l
       where l.statut = 'envoye' and l.mode_envoi = 'manuel' and s.transaction_date between l.date_versement - 5 and l.date_versement + 10
         and round(-s.amount, 2) = (select sum(montant) from fiducie_lot_honoraires h where h.lot_id = l.id)
         and not exists (select 1 from bank_transactions b where b.fiducie_lot_id = l.id and b.fiducie_lot_ligne_id is null)
    )
    select count(*) nb, min(lot_id::text)::uuid lot_id, min(ligne_id::text)::uuid ligne_id, min(note) note into c from cand;
    if c.nb = 1 then
      update bank_transactions set match_status = 'matched', fiducie_lot_id = c.lot_id, fiducie_lot_ligne_id = c.ligne_id, ai_suggestion_note = c.note where id = s.id;
      n := n + 1;
    end if;
  end loop;
  return jsonb_build_object('rapprochees', n);
end $$;

-- Défaire un rapprochement automatique (mauvaise sortie) : la sortie redevient à regarder, le versement redevient attendu.
create or replace function public.fiducie_delier_sortie(p_sortie uuid, p_par uuid) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  update bank_transactions set match_status = 'ignored', fiducie_lot_id = null, fiducie_lot_ligne_id = null, reconciled_by = p_par, reconciled_at = now(),
         ai_suggestion_note = 'Rapprochement défait : à vérifier' where id = p_sortie and compte = 'fiducie' and amount < 0 and fiducie_lot_id is not null;
  if not found then raise exception 'Sortie introuvable ou non rapprochée d''un versement'; end if;
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
  perform set_config('fiducie.coordonnees_maj', '1', true);   -- la garde owners_versement_garde laisse passer cette saisie (auteur connu)
  update owners set versement_nom_compte = nullif(btrim(p_nom), ''), versement_institution = p_institution, versement_transit = p_transit, versement_compte = p_compte,
         versement_modifie_le = now(), versement_modifie_par = p_par, versement_verifie_le = null, versement_verifie_par = null, versement_verification_note = null
   where id = p_owner;
  perform set_config('fiducie.coordonnees_maj', '', true);
  if not found then raise exception 'Propriétaire introuvable'; end if;
end $$;

drop function if exists public.fiducie_coordonnees_verifier(uuid, uuid, text);   -- l'ancienne version sans contrôle d'auteur ni de version
create or replace function public.fiducie_coordonnees_verifier(p_owner uuid, p_par uuid, p_note text, p_vu timestamptz) returns void
language plpgsql security definer set search_path to 'public' as $$
declare o record;
begin
  select * into o from owners where id = p_owner for update;
  if o is null or o.versement_compte is null then raise exception 'Aucune coordonnée à vérifier'; end if;
  if p_par is null then raise exception 'Vérificateur requis'; end if;
  if o.versement_modifie_par is null then raise exception 'Auteur de la saisie inconnu (saisie antérieure) : réenregistrez les coordonnées, puis faites-les vérifier par un collègue'; end if;
  if o.versement_modifie_par = p_par then raise exception 'La personne qui a saisi les coordonnées ne peut pas les vérifier : demandez à un collègue'; end if;
  if p_vu is null or o.versement_modifie_le is distinct from p_vu then raise exception 'Les coordonnées ont changé depuis que vous les avez ouvertes : rouvrez-les et refaites le rappel'; end if;
  if char_length(btrim(coalesce(p_note, ''))) < 10 then raise exception 'Décrivez la vérification (ex. rappel au 418-… le 18 nov., confirmé par le propriétaire)'; end if;
  update owners set versement_verifie_le = now(), versement_verifie_par = p_par, versement_verification_note = btrim(p_note) where id = p_owner;
end $$;

revoke all on function public.fiducie_lot_joindre_honoraires(uuid), public.fiducie_lot_mode(uuid, text), public.fiducie_lot_marquer_envoye(uuid, text, uuid),
  public.fiducie_rapprocher_sorties(), public.fiducie_sorties_attendues(), public.fiducie_coordonnees_maj(uuid, text, text, text, text, uuid),
  public.fiducie_coordonnees_verifier(uuid, uuid, text, timestamptz), public.fiducie_delier_sortie(uuid, uuid) from public, anon, authenticated;

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
    perform fiducie_lot_joindre_honoraires(v_lot);   -- même transaction : un lot préparé a toujours ses honoraires à transférer
  end if;
  return jsonb_build_object('lot_id', v_lot, 'date', p_date, 'total', v_total, 'nombre', v_nb, 'lignes', lignes);
end;
$function$;

-- Annulation d'un lot : ses honoraires redeviennent à transférer.
drop function if exists public.fiducie_annuler_lot(uuid, uuid);
create or replace function public.fiducie_annuler_lot(p_lot uuid, p_par uuid DEFAULT NULL::uuid, p_refuse_par_bmo boolean DEFAULT false)
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
  -- revue de code : un fichier téléchargé a peut-être été déposé chez BMO; annuler puis refaire paierait deux fois
  if lot.mode_envoi is not null and not p_refuse_par_bmo then
    raise exception 'L''envoi de ce lot a commencé (%) : annulez seulement si BMO a refusé le fichier ou si aucun virement n''est parti', case lot.mode_envoi when 'fichier' then 'fichier téléchargé' else 'virements à la main' end;
  end if;
  for l in select * from fiducie_lot_lignes where lot_id = p_lot loop
    insert into fiducie_mouvements (owner_id, type, montant, date_valeur, description, source_type, source_id, cree_par)
    values (l.owner_id, 'ajustement', l.montant, current_date, 'Annulation du versement du ' || to_char(lot.date_versement, 'YYYY-MM-DD'), 'fiducie_lot_annule', l.id, p_par);
  end loop;
  delete from fiducie_lot_honoraires where lot_id = p_lot;   -- les honoraires de ce lot redeviennent à transférer
  update fiducie_lots set statut = 'annule', annule_le = now() where id = p_lot;
  return jsonb_build_object('ok', true);
end;
$function$;

-- revue de code : une fonction recréée hérite des droits par défaut (authenticated); seul ops-api (service_role) l'appelle
revoke all on function public.fiducie_annuler_lot(uuid, uuid, boolean) from public, anon, authenticated;

-- ===================== Revue de code n° 2 (19 nov. 2026) =====================
-- Virements à la main : chaque virement fait est coché (au registre), pour ne jamais le refaire ni annuler un lot entamé.
alter table public.fiducie_lot_lignes add column if not exists vire_le timestamptz, add column if not exists vire_par uuid references auth.users(id);
alter table public.fiducie_lots add column if not exists honoraires_vire_le timestamptz, add column if not exists honoraires_vire_par uuid references auth.users(id);
-- Une sortie du relevé par lot (fichier ou honoraires à la main) : deux rapprochements simultanés ne peuvent pas prendre deux sorties.
create unique index if not exists bank_transactions_lot_global on public.bank_transactions (fiducie_lot_id) where fiducie_lot_id is not null and fiducie_lot_ligne_id is null;
-- Compte d'exploitation : chiffres seulement, jamais le compte en fidéicommis (contrôlé par la base, pas seulement par ops-api).
alter table public.company_settings drop constraint if exists company_settings_exploitation_ok;
alter table public.company_settings add constraint company_settings_exploitation_ok check (
  (exploitation_institution is null or exploitation_institution ~ '^\d{3}$') and (exploitation_transit is null or exploitation_transit ~ '^\d{5}$')
  and (exploitation_compte is null or exploitation_compte ~ '^\d{5,12}$')
  and (exploitation_compte is null or fiducie_compte is null
       or (exploitation_institution, exploitation_transit, ltrim(exploitation_compte, '0')) is distinct from (fiducie_institution, fiducie_transit, ltrim(fiducie_compte, '0'))));

-- Toute modification des coordonnées hors de fiducie_coordonnees_maj (import, SQL, futur écran) remet la vérification à zéro, auteur inconnu.
create or replace function public.owners_versement_garde() returns trigger language plpgsql set search_path to 'public' as $$
begin
  if (new.versement_institution, new.versement_transit, new.versement_compte, new.versement_nom_compte) is distinct from (old.versement_institution, old.versement_transit, old.versement_compte, old.versement_nom_compte)
     and coalesce(current_setting('fiducie.coordonnees_maj', true), '') <> '1' then
    new.versement_modifie_le := now(); new.versement_modifie_par := null;
    new.versement_verifie_le := null; new.versement_verifie_par := null; new.versement_verification_note := null;
  end if;
  return new;
end $$;
drop trigger if exists owners_versement_garde on public.owners;
create trigger owners_versement_garde before update on public.owners for each row execute function public.owners_versement_garde();

-- Mode d'envoi : fixé seulement si chaque ligne paie encore le compte actuel et vérifié du propriétaire.
create or replace function public.fiducie_lot_mode(p_lot uuid, p_mode text) returns void language plpgsql security definer set search_path to 'public' as $$
declare lot record; n int;
begin
  select * into lot from fiducie_lots where id = p_lot for update;
  if lot is null or lot.statut = 'annule' then raise exception 'Lot introuvable ou annulé'; end if;
  if p_mode not in ('fichier', 'manuel') then raise exception 'Mode d''envoi inconnu'; end if;
  if lot.mode_envoi is not null and lot.mode_envoi <> p_mode then
    raise exception 'Ce lot est déjà prévu %; l''envoyer aussi % paierait les propriétaires deux fois', case lot.mode_envoi when 'fichier' then 'par fichier' else 'à la main' end, case p_mode when 'fichier' then 'par fichier' else 'à la main' end;
  end if;
  if lot.mode_envoi is null then
    select count(*) into n from fiducie_lot_lignes li join owners o on o.id = li.owner_id where li.lot_id = p_lot
       and ((li.institution, li.transit, li.compte) is distinct from (o.versement_institution, o.versement_transit, o.versement_compte)
            or o.versement_verifie_le is null or o.versement_verifie_le < o.versement_modifie_le);
    if n > 0 then raise exception '% propriétaire(s) du lot ont changé de coordonnées ou ne sont plus vérifiés depuis la préparation : annulez le lot et préparez-le de nouveau', n; end if;
  end if;
  update fiducie_lots set mode_envoi = p_mode where id = p_lot;
end $$;

-- Coche d'un virement fait à la main (p_ligne null = le virement des honoraires).
create or replace function public.fiducie_lot_virement_fait(p_lot uuid, p_ligne uuid, p_par uuid) returns void language plpgsql security definer set search_path to 'public' as $$
declare lot record;
begin
  select * into lot from fiducie_lots where id = p_lot for update;
  if lot is null or lot.statut <> 'prepare' or lot.mode_envoi is distinct from 'manuel' then raise exception 'Lot introuvable, déjà envoyé, ou pas prévu à la main'; end if;
  if p_ligne is null then
    if not exists (select 1 from fiducie_lot_honoraires where lot_id = p_lot) then raise exception 'Ce lot n''a pas d''honoraires à transférer'; end if;
    update fiducie_lots set honoraires_vire_le = coalesce(honoraires_vire_le, now()), honoraires_vire_par = coalesce(honoraires_vire_par, p_par) where id = p_lot;
  else
    update fiducie_lot_lignes set vire_le = coalesce(vire_le, now()), vire_par = coalesce(vire_par, p_par) where id = p_ligne and lot_id = p_lot;
    if not found then raise exception 'Virement introuvable dans ce lot'; end if;
  end if;
end $$;

create or replace function public.fiducie_lot_marquer_envoye(p_lot uuid, p_mode text, p_par uuid default null) returns void language plpgsql security definer set search_path to 'public' as $$
declare lot record; n int;
begin
  perform fiducie_lot_mode(p_lot, p_mode);
  select * into lot from fiducie_lots where id = p_lot for update;
  if lot.statut <> 'prepare' then raise exception 'Seul un lot préparé peut être marqué envoyé'; end if;
  if p_mode = 'manuel' then
    select count(*) + case when exists (select 1 from fiducie_lot_honoraires where lot_id = p_lot) and lot.honoraires_vire_le is null then 1 else 0 end into n
      from fiducie_lot_lignes where lot_id = p_lot and vire_le is null;
    if n > 0 then raise exception '% virement(s) pas encore cochés comme faits', n; end if;
  end if;
  update fiducie_lots set statut = 'envoye', envoye_le = now(), envoye_par = p_par where id = p_lot;
end $$;

-- Annulation : jamais après un virement coché, même « refusé par BMO ».
do $$ declare d text; begin
  select pg_get_functiondef('public.fiducie_annuler_lot(uuid,uuid,boolean)'::regprocedure) into d;
  if position('virement(s) déjà faits' in d) = 0 then
    d := replace(d, '  if lot.mode_envoi is not null and not p_refuse_par_bmo then',
      '  if exists (select 1 from fiducie_lot_lignes where lot_id = p_lot and vire_le is not null) or lot.honoraires_vire_le is not null then
    raise exception ''Des virement(s) déjà faits à la main : faites les autres, cochez-les, puis marquez le lot envoyé'';
  end if;
  if lot.mode_envoi is not null and not p_refuse_par_bmo then');
    if position('virement(s) déjà faits' in d) = 0 then raise exception 'fiducie_annuler_lot : garde non insérée'; end if;
    execute d;
  end if;
end $$;

-- Relier à la main une sortie du relevé à un versement envoyé (après « Défaire », ou quand le rapprochement est ambigu).
create or replace function public.fiducie_lier_sortie(p_sortie uuid, p_lot uuid, p_ligne uuid, p_par uuid) returns void language plpgsql security definer set search_path to 'public' as $$
declare s record; lot record; attendu numeric;
begin
  select * into s from bank_transactions where id = p_sortie and compte = 'fiducie' and amount < 0 for update;
  if s is null or s.fiducie_lot_id is not null or s.match_status not in ('unmatched', 'ignored') or exists (select 1 from fiducie_attentes a where a.sortie_id = p_sortie) then
    raise exception 'Sortie introuvable ou déjà reliée'; end if;
  select * into lot from fiducie_lots where id = p_lot and statut = 'envoye';
  if lot is null then raise exception 'Seul un lot envoyé se relie à une sortie du relevé'; end if;
  if s.transaction_date < lot.date_versement - 5 then raise exception 'Cette sortie précède le versement'; end if;
  if p_ligne is not null then
    if lot.mode_envoi <> 'manuel' then raise exception 'Un lot envoyé par fichier sort en un seul débit : reliez le lot entier'; end if;
    select montant into attendu from fiducie_lot_lignes where id = p_ligne and lot_id = p_lot;
    if exists (select 1 from bank_transactions where fiducie_lot_ligne_id = p_ligne) then raise exception 'Ce virement est déjà relié'; end if;
  else
    attendu := coalesce((select sum(montant) from fiducie_lot_honoraires where lot_id = p_lot), 0) + case when lot.mode_envoi = 'fichier' then lot.total else 0 end;
    if exists (select 1 from bank_transactions where fiducie_lot_id = p_lot and fiducie_lot_ligne_id is null) then raise exception 'Ce versement est déjà relié'; end if;
  end if;
  if attendu is null or round(-s.amount, 2) <> round(attendu, 2) then raise exception 'Montants différents : sortie %, versement attendu %', -s.amount, attendu; end if;
  update bank_transactions set match_status = 'matched', fiducie_lot_id = p_lot, fiducie_lot_ligne_id = p_ligne, reconciled_by = p_par, reconciled_at = now(),
         ai_suggestion_note = 'Relié à la main au versement du ' || lot.date_versement where id = p_sortie;
end $$;

-- Rapprochement : un seul candidat ET une seule sortie de ce montant dans la fenêtre du candidat; un rapprochement à la fois.
create or replace function public.fiducie_rapprocher_sorties() returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare s record; n int := 0; c record; rivales int;
begin
  perform pg_advisory_xact_lock(hashtext('fiducie_rapprocher_sorties'));
  for s in select * from bank_transactions where compte = 'fiducie' and amount < 0 and match_status in ('unmatched', 'ignored') and reconciled_by is null
             and fiducie_lot_id is null and not exists (select 1 from fiducie_attentes a where a.sortie_id = bank_transactions.id) order by transaction_date for update loop
    with cand as (
      select l.id lot_id, null::uuid ligne_id, l.date_versement d, 'Fichier de versements envoyé (lot du ' || l.date_versement || ')' note from fiducie_lots l
       where l.statut = 'envoye' and l.mode_envoi = 'fichier' and s.transaction_date between l.date_versement - 5 and l.date_versement + 10
         and not exists (select 1 from bank_transactions b where b.fiducie_lot_id = l.id and b.fiducie_lot_ligne_id is null)
         and round(-s.amount, 2) = round(l.total + coalesce((select sum(montant) from fiducie_lot_honoraires h where h.lot_id = l.id), 0), 2)
      union all
      select l.id, li.id, l.date_versement, 'Versement au propriétaire (' || li.nom_compte || ')' from fiducie_lot_lignes li join fiducie_lots l on l.id = li.lot_id
       where l.statut = 'envoye' and l.mode_envoi = 'manuel' and s.transaction_date between l.date_versement - 5 and l.date_versement + 10
         and round(-s.amount, 2) = li.montant and not exists (select 1 from bank_transactions b where b.fiducie_lot_ligne_id = li.id)
      union all
      select l.id, null, l.date_versement, 'Honoraires transférés au compte d''exploitation' from fiducie_lots l
       where l.statut = 'envoye' and l.mode_envoi = 'manuel' and s.transaction_date between l.date_versement - 5 and l.date_versement + 10
         and round(-s.amount, 2) = (select sum(montant) from fiducie_lot_honoraires h where h.lot_id = l.id)
         and not exists (select 1 from bank_transactions b where b.fiducie_lot_id = l.id and b.fiducie_lot_ligne_id is null)
    )
    select count(*) nb, min(lot_id::text)::uuid lot_id, min(ligne_id::text)::uuid ligne_id, min(d) d, min(note) note into c from cand;
    if c.nb = 1 then
      -- revue n° 2 : un chèque de fournisseur du même montant dans la fenêtre rend la sortie ambiguë (il ne doit pas prendre la place du vrai virement)
      select count(*) into rivales from bank_transactions b where b.compte = 'fiducie' and b.amount = s.amount and b.fiducie_lot_id is null
         and b.match_status in ('unmatched', 'ignored') and b.transaction_date between c.d - 5 and c.d + 10
         and not exists (select 1 from fiducie_attentes a where a.sortie_id = b.id);
      if rivales = 1 then
        update bank_transactions set match_status = 'matched', fiducie_lot_id = c.lot_id, fiducie_lot_ligne_id = c.ligne_id, ai_suggestion_note = c.note where id = s.id;
        n := n + 1;
      end if;
    end if;
  end loop;
  return jsonb_build_object('rapprochees', n);
end $$;

-- Sorties attendues : de quoi relier à la main (lot, ligne).
create or replace function public.fiducie_sorties_attendues() returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_agg(x order by x ->> 'date'), '[]'::jsonb) from (
    select jsonb_build_object('lot_id', l.id, 'ligne_id', null, 'date', l.date_versement, 'mode', l.mode_envoi, 'quoi', 'Fichier de versements', 'montant', l.total + coalesce((select sum(montant) from fiducie_lot_honoraires h where h.lot_id = l.id), 0),
           'en_retard', current_date > l.date_versement + 5) x
      from fiducie_lots l where l.statut = 'envoye' and l.mode_envoi = 'fichier' and not exists (select 1 from bank_transactions b where b.fiducie_lot_id = l.id and b.fiducie_lot_ligne_id is null)
    union all
    select jsonb_build_object('lot_id', l.id, 'ligne_id', li.id, 'date', l.date_versement, 'mode', l.mode_envoi, 'quoi', 'Versement à ' || li.nom_compte, 'montant', li.montant, 'en_retard', current_date > l.date_versement + 5)
      from fiducie_lot_lignes li join fiducie_lots l on l.id = li.lot_id where l.statut = 'envoye' and l.mode_envoi = 'manuel' and not exists (select 1 from bank_transactions b where b.fiducie_lot_ligne_id = li.id)
    union all
    select jsonb_build_object('lot_id', l.id, 'ligne_id', null, 'date', l.date_versement, 'mode', l.mode_envoi, 'quoi', 'Honoraires vers le compte d''exploitation', 'montant', (select sum(montant) from fiducie_lot_honoraires h where h.lot_id = l.id), 'en_retard', current_date > l.date_versement + 5)
      from fiducie_lots l where l.statut = 'envoye' and l.mode_envoi = 'manuel' and exists (select 1 from fiducie_lot_honoraires h where h.lot_id = l.id)
       and not exists (select 1 from bank_transactions b where b.fiducie_lot_id = l.id and b.fiducie_lot_ligne_id is null)
  ) t;
$$;

revoke all on function public.fiducie_lot_mode(uuid, text), public.fiducie_lot_virement_fait(uuid, uuid, uuid), public.fiducie_lot_marquer_envoye(uuid, text, uuid),
  public.fiducie_lier_sortie(uuid, uuid, uuid, uuid), public.fiducie_rapprocher_sorties(), public.fiducie_sorties_attendues(), public.owners_versement_garde() from public, anon, authenticated;
