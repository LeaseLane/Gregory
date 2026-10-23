-- Démo (préproduction) : correctifs sur les données fictives déjà insérées par seed-demo-univers-admin.sql.
-- La confiance de rapprochement se lit sur 100 (reconcile-bank-transactions), pas sur 1.
\set ON_ERROR_STOP on
update public.bank_transactions set ai_confidence = ai_confidence * 100 where external_id like 'DEMO-%' and ai_confidence <= 1;
update public.bank_transactions set match_confidence = match_confidence * 100 where external_id like 'DEMO-%' and match_confidence <= 1;
