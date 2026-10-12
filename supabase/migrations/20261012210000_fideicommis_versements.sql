-- Compte en fidéicommis, étape 4 : versements du 15.
--
-- Un « lot » = tous les virements aux propriétaires d'une date donnée.
-- fiducie_lot(date, par, executer) :
--   1. prélève au registre les factures Lease Lane émises et pas encore payées
--      (honoraires de gestion + coordination + taxes), si le solde le permet;
--      la facture est alors marquée payée (retenue sur les loyers, pas de prélèvement);
--   2. verse à chaque propriétaire son disponible : solde − réserve de ses immeubles;
--   3. inscrit les versements au registre et le lot (fichier pour la banque).
-- executer = false : simulation, rien n'est écrit (aperçu avant de confirmer).
-- Tout ou rien; une seule fois par date (sauf lot annulé).

alter table public.owners
  add column if not exists versement_nom_compte text,
  add column if not exists versement_institution text,
  add column if not exists versement_transit text,
  add column if not exists versement_compte text;

do $$ begin
  alter table public.owners add constraint owners_versement_format check (
    (versement_institution is null or versement_institution ~ '^\d{3}$')
    and (versement_transit is null or versement_transit ~ '^\d{5}$')
    and (versement_compte is null or versement_compte ~ '^\d{5,12}$'));
exception when duplicate_object then null; end $$;

create table if not exists public.fiducie_lots (
  id uuid primary key default gen_random_uuid(),
  date_versement date not null,
  statut text not null default 'prepare' check (statut in ('prepare', 'envoye', 'annule')),
  total numeric(12,2) not null default 0,
  nombre int not null default 0,
  cree_par uuid references public.users(id),
  created_at timestamptz not null default now(),
  envoye_le timestamptz,
  annule_le timestamptz
);
create unique index if not exists fiducie_lots_une_date on public.fiducie_lots (date_versement) where statut <> 'annule';

create table if not exists public.fiducie_lot_lignes (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.fiducie_lots(id),
  owner_id uuid not null references public.owners(id),
  montant numeric(12,2) not null check (montant > 0),
  mouvement_id uuid not null references public.fiducie_mouvements(id),
  nom_compte text not null,
  institution text not null,
  transit text not null,
  compte text not null
);
alter table public.fiducie_lots enable row level security;
alter table public.fiducie_lot_lignes enable row level security;
revoke all on public.fiducie_lots, public.fiducie_lot_lignes from anon, authenticated;

create or replace function public.fiducie_lot(p_date date, p_par uuid default null, p_executer boolean default false)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
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

  for o in select id, full_name, versement_nom_compte, versement_institution, versement_transit, versement_compte from owners order by full_name loop
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
$$;

-- Annuler un lot pas encore envoyé à la banque : chaque versement est remis au
-- registre par un ajustement (le registre ne s'efface jamais). Les honoraires
-- prélevés restent prélevés (la facture est payée).
create or replace function public.fiducie_annuler_lot(p_lot uuid, p_par uuid default null)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
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
  update fiducie_lots set statut = 'annule', annule_le = now() where id = p_lot;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.fiducie_lot(date, uuid, boolean), public.fiducie_annuler_lot(uuid, uuid) from public, anon, authenticated;
