-- Relevé du compte en fidéicommis (revue du 18 nov. 2026) : chaque ligne importée garde le solde du relevé et sa position dans
-- la journée, pour vérifier qu'un nouvel import suit exactement le précédent (aucune ligne manquante ni comptée deux fois).
alter table public.bank_transactions add column if not exists solde numeric(12,2), add column if not exists ordre integer;
comment on column public.bank_transactions.solde is 'Solde du compte après cette ligne, tel qu''écrit dans le relevé importé (null : export sans solde).';
comment on column public.bank_transactions.ordre is 'Position de la ligne dans sa journée, dans l''ordre chronologique du relevé.';
create index if not exists bank_transactions_fiducie_chrono on public.bank_transactions (transaction_date desc, ordre desc) where compte = 'fiducie';
