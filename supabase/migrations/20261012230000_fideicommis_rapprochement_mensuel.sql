-- Compte en fidéicommis, étape 5 : rapprochement mensuel (pour le comptable).
--
-- Règle : le solde du compte bancaire en fidéicommis doit égaler le total dû
-- aux propriétaires (registre). Un écart doit s'expliquer entièrement par :
--   + des dépôts reçus à la banque mais pas encore attribués à un propriétaire;
--   + des sorties inscrites au registre (versements, honoraires, fournisseurs)
--     que la banque n'a pas encore débitées (en transit);
--   − des sorties débitées par la banque mais absentes du registre (ex. frais
--     bancaires) : à régulariser, ce n'est pas l'argent des propriétaires.
-- ponytail: en transit et hors registre sont comparés en net (totaux des sorties);
-- un appariement sortie par sortie viendra si le comptable le demande.
-- Ce qui reste = écart non expliqué. Il doit être 0 $.
--
-- fiducie_calculer_rapprochement(date, solde_releve) calcule sans rien écrire;
-- le rapprochement enregistré garde les chiffres du jour et qui l'a vérifié.

create table if not exists public.fiducie_rapprochements (
  id uuid primary key default gen_random_uuid(),
  date_fin date not null,
  solde_releve numeric(12,2) not null,
  total_registre numeric(12,2) not null,
  depots_non_attribues numeric(12,2) not null,
  sorties_en_transit numeric(12,2) not null,
  sorties_hors_registre numeric(12,2) not null,
  ecart numeric(12,2) not null,
  detail jsonb not null default '{}'::jsonb,
  note text,
  cree_par uuid references public.users(id),
  created_at timestamptz not null default now(),
  verifie_par text,
  verifie_le timestamptz
);
alter table public.fiducie_rapprochements enable row level security;
revoke all on public.fiducie_rapprochements from anon, authenticated;

create or replace function public.fiducie_calculer_rapprochement(p_date date, p_solde_releve numeric)
  returns jsonb language sql stable security definer set search_path to 'public' as $$
  with reg as (
    select coalesce(sum(montant), 0) as total,
           coalesce(sum(-montant) filter (where montant < 0), 0) as sorties
      from fiducie_mouvements where date_valeur <= p_date
  ),
  banque as (
    select coalesce(sum(amount), 0) as solde_calcule,
           coalesce(sum(-amount) filter (where amount < 0), 0) as sorties,
           coalesce(sum(amount) filter (where amount > 0 and match_status not in ('matched', 'overpaid')), 0) as non_attribues
      from bank_transactions where compte = 'fiducie' and transaction_date <= p_date
  ),
  calc as (
    select reg.total, reg.sorties as sorties_registre, banque.solde_calcule, banque.sorties as sorties_banque, banque.non_attribues,
           reg.sorties - banque.sorties as net_sorties
      from reg, banque
  )
  select jsonb_build_object(
    'date_fin', p_date,
    'solde_releve', round(p_solde_releve, 2),
    'solde_calcule_transactions', round(c.solde_calcule, 2),
    'total_registre', round(c.total, 2),
    'depots_non_attribues', round(c.non_attribues, 2),
    'sorties_en_transit', round(greatest(c.net_sorties, 0), 2),
    'sorties_hors_registre', round(greatest(-c.net_sorties, 0), 2),
    -- relevé = registre + non attribués + (sorties du registre pas encore à la banque − sorties bancaires hors registre)
    'ecart', round(p_solde_releve - c.total - c.non_attribues - c.net_sorties, 2),
    'soldes_negatifs', (select count(*) from (select owner_id from fiducie_mouvements where date_valeur <= p_date group by owner_id having sum(montant) < 0) n),
    'par_proprietaire', coalesce((select jsonb_agg(jsonb_build_object('proprietaire', o.full_name, 'solde', s.solde) order by o.full_name)
                                    from (select owner_id, round(sum(montant), 2) as solde from fiducie_mouvements where date_valeur <= p_date group by owner_id) s
                                    join owners o on o.id = s.owner_id where s.solde <> 0), '[]'::jsonb),
    'depots_a_attribuer', coalesce((select jsonb_agg(jsonb_build_object('date', transaction_date, 'description', description, 'montant', amount, 'statut', match_status) order by transaction_date)
                                      from bank_transactions where compte = 'fiducie' and transaction_date <= p_date and amount > 0 and match_status not in ('matched', 'overpaid')), '[]'::jsonb)
  )
  from calc c;
$$;
revoke all on function public.fiducie_calculer_rapprochement(date, numeric) from public, anon, authenticated;
