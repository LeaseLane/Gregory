-- Compte en fidéicommis, étape 3 : rapprochement des dépôts du compte unique.
--
-- Un dépôt arrive dans le compte en fidéicommis (relevé importé, plus tard
-- Plaid). On le relie à un bail (par la référence LL-xxxxx du message, ou par
-- confirmation de l'admin), puis fiducie_appliquer_depot fait TOUT d'un coup,
-- ou rien :
--   1. crédite le registre du propriétaire (mouvement « loyer »);
--   2. impute le montant aux loyers ouverts du bail, du plus ancien au plus
--      récent (paiement partiel conservé dans amount_received);
--   3. marque le dépôt « rapproché ».
-- Un même dépôt ne peut être appliqué qu'une fois (index unique du registre).

alter table public.bank_transactions
  add column if not exists compte text not null default 'proprietaire',
  add column if not exists lease_id uuid references public.leases(id),
  add column if not exists unit_id uuid references public.units(id),
  add column if not exists reference_detectee text;

do $$ begin
  alter table public.bank_transactions add constraint bank_transactions_compte_check check (compte in ('proprietaire', 'fiducie'));
exception when duplicate_object then null; end $$;

-- Dédoublonnage des dépôts du compte unique (le même relevé importé deux fois).
create unique index if not exists bank_transactions_fiducie_externe
  on public.bank_transactions (external_id) where compte = 'fiducie' and external_id is not null;

create or replace function public.fiducie_appliquer_depot(p_transaction uuid, p_lease uuid, p_par uuid default null)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  tx record;
  bail record;
  reste numeric;
  pr record;
  du numeric;
  pris numeric;
  premier uuid;
  soldes int := 0;
begin
  select * into tx from bank_transactions where id = p_transaction for update;
  if tx is null then raise exception 'Dépôt introuvable'; end if;
  if tx.compte <> 'fiducie' then raise exception 'Ce dépôt n''est pas dans le compte en fidéicommis'; end if;
  if tx.amount <= 0 then raise exception 'Seuls les dépôts (montants positifs) se rapprochent à un loyer'; end if;
  if tx.match_status in ('matched', 'overpaid') then return jsonb_build_object('deja', true); end if;

  select l.id, l.tenant_id, l.unit_id, u.building_id, b.owner_id, t.full_name, u.unit_number, u.reference_paiement
    into bail
    from leases l join units u on u.id = l.unit_id join buildings b on b.id = u.building_id left join tenants t on t.id = l.tenant_id
   where l.id = p_lease;
  if bail is null then raise exception 'Bail introuvable'; end if;

  -- 1. Registre du propriétaire.
  insert into fiducie_mouvements (owner_id, building_id, lease_id, type, montant, date_valeur, description, source_type, source_id, cree_par)
  values (bail.owner_id, bail.building_id, bail.id, 'loyer', tx.amount, tx.transaction_date,
          'Loyer — ' || coalesce(bail.full_name, 'locataire') || ', logement ' || bail.unit_number || ' (' || bail.reference_paiement || ')',
          'bank_transaction', tx.id, p_par);

  -- 2. Imputation aux loyers ouverts, du plus ancien au plus récent.
  reste := tx.amount;
  for pr in select id, amount, coalesce(amount_received, 0) as recu from payments
             where lease_id = bail.id and status in ('pending', 'late') order by due_date, created_at for update loop
    exit when reste <= 0;
    du := pr.amount - pr.recu;
    continue when du <= 0;
    pris := least(reste, du);
    update payments
       set amount_received = pr.recu + pris,
           status = case when pr.recu + pris >= pr.amount then 'paid' else status end,
           paid_date = case when pr.recu + pris >= pr.amount then tx.transaction_date else paid_date end
     where id = pr.id;
    if premier is null then premier := pr.id; end if;
    if pr.recu + pris >= pr.amount then soldes := soldes + 1; end if;
    reste := reste - pris;
  end loop;

  -- 3. Dépôt rapproché (un excédent reste au registre du propriétaire, signalé).
  update bank_transactions
     set match_status = case when reste > 0 then 'overpaid' when premier is null then 'overpaid' else 'matched' end,
         matched_payment_id = premier, owner_id = bail.owner_id, unit_id = bail.unit_id, lease_id = bail.id,
         reconciled_by = p_par, reconciled_at = now()
   where id = tx.id;

  return jsonb_build_object('owner_id', bail.owner_id, 'loyers_soldes', soldes, 'excedent', greatest(reste, 0));
end;
$$;
revoke all on function public.fiducie_appliquer_depot(uuid, uuid, uuid) from public, anon, authenticated;
