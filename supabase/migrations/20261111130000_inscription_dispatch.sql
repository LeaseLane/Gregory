-- « Inscrire mon entreprise », dispatch d'abord (Grégory, 2026-11-04) : une entreprise = une fiche fournisseur = un accès pour son
-- dispatch, qui reçoit toutes nos demandes. Le formulaire demande maintenant le nom de l'entreprise, ses métiers (codes de
-- assets/metiers.js), ses secteurs desservis et son numéro RBQ; « Inviter » les reporte dans la fiche (company_name, specialties,
-- zones, rbq_license), ce qui permet à l'attribution des bons de travail de choisir qui reçoit quoi. Les ouvriers d'une entreprise
-- (membres sous une même fiche) viendront plus tard, au besoin.
alter table public.inscriptions_entreprises
  add column if not exists entreprise text check (entreprise is null or char_length(entreprise) between 2 and 200),
  add column if not exists metiers text[] not null default '{}',
  add column if not exists secteurs text[] not null default '{}',
  add column if not exists rbq text check (rbq is null or rbq ~ '^\d{4}-\d{4}-\d{2}$');
