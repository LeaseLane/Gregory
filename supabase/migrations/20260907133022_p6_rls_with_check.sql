-- Lot P6 — audit des règles d'accès : ajout des clauses WITH CHECK
-- manquantes sur les policies UPDATE.
--
-- Le problème. Une policy UPDATE avec USING seul ne contrôle que les
-- lignes qu'on a le DROIT DE MODIFIER, jamais l'état dans lequel on les
-- laisse. Postgres, faute de WITH CHECK, réutilise USING pour la lecture
-- mais n'impose rien à l'écriture : un propriétaire pouvait donc modifier
-- une de ses lignes en y inscrivant l'identifiant d'un AUTRE propriétaire.
-- La ligne sortait de son parc — et devenait invisible pour lui comme
-- pour sa victime, tout en restant comptabilisée.
--
-- Sur `approvals`, la portée est financière : la table porte
-- requested_amount et spending_cap_at_request, soit les approbations de
-- dépense. C'est exactement le genre d'écriture que le critère GO/NO-GO
-- exige de pouvoir tracer.
--
-- Le correctif. WITH CHECK reprend le même prédicat que USING : on ne
-- peut modifier que ses lignes, ET seulement vers un état qui reste le
-- sien. Aucun usage légitime n'est retiré : réassigner une approbation
-- à un autre propriétaire n'a jamais été une opération voulue depuis un
-- portail (les fonctions edge passent par service_role, non soumis aux
-- policies).

-- approvals : un propriétaire ne peut pas réassigner son approbation.
drop policy if exists "own approvals update" on approvals;
create policy "own approvals update" on approvals for update
  using (owner_id = auth_owner_id())
  with check (owner_id = auth_owner_id());

-- inquiries (propriétaire) : la demande de visite doit rester rattachée
-- à une unité du propriétaire, et rester de type 'visite' — sans quoi
-- une demande de visite pouvait être convertie en 'mandat', qui relève
-- du CRM et non du portail propriétaire.
drop policy if exists "owner update own unit visit inquiries" on inquiries;
create policy "owner update own unit visit inquiries" on inquiries for update
  using (type = 'visite' and unit_id in (select owned_unit_ids()))
  with check (type = 'visite' and unit_id in (select owned_unit_ids()));

-- inquiries (admin) : le prédicat ne dépend pas de la ligne, mais
-- l'expliciter garde la règle « toute policy UPDATE porte un WITH CHECK »
-- vérifiable mécaniquement, plutôt que sujette à interprétation.
drop policy if exists "admin update inquiries" on inquiries;
create policy "admin update inquiries" on inquiries for update
  using (auth_is_admin())
  with check (auth_is_admin());

-- documents DELETE ne prend pas de WITH CHECK : une suppression ne laisse
-- aucun état à valider. USING seul y est correct, ce n'est pas un oubli.

-- ---- automated_decisions ----
-- Même défaut, trouvé dans 20260820114237_journal_decisions_automatisees.sql :
-- les trois policies de demande de révision n'ont pas de WITH CHECK. Un
-- usager pouvait donc réécrire subject_type/subject_id et rattacher une
-- décision automatisée à quelqu'un d'autre. C'est le journal qui sert à
-- expliquer les décisions de l'IA : s'il peut être réattribué, la
-- traçabilité qu'il est censé fournir ne vaut plus rien.
drop policy if exists "request review as owner" on automated_decisions;
create policy "request review as owner" on automated_decisions for update
  using (subject_type = 'owner' and subject_id = auth_owner_id())
  with check (subject_type = 'owner' and subject_id = auth_owner_id());

drop policy if exists "request review as tenant" on automated_decisions;
create policy "request review as tenant" on automated_decisions for update
  using (subject_type = 'tenant' and subject_id = auth_tenant_id())
  with check (subject_type = 'tenant' and subject_id = auth_tenant_id());

drop policy if exists "request review as worker" on automated_decisions;
create policy "request review as worker" on automated_decisions for update
  using (subject_type = 'worker' and subject_id in (select id from workers where user_id = auth.uid()))
  with check (subject_type = 'worker' and subject_id in (select id from workers where user_id = auth.uid()));

-- ---- service_requests et work_orders ----
-- Ces deux policies n'existent NI dans schema.sql NI dans les migrations
-- du dépôt : elles ont été créées directement dans la production (le
-- dépôt et la base ont divergé). Trouvées en interrogeant pg_policies.
-- Même défaut : un propriétaire pouvait déplacer une demande de service
-- ou un bon de travail vers l'unité d'un AUTRE propriétaire, ce qui
-- transfère aussi la dépense associée.
drop policy if exists "own service_requests update" on service_requests;
create policy "own service_requests update" on service_requests for update
  using (unit_id in (select owned_unit_ids()))
  with check (unit_id in (select owned_unit_ids()));

drop policy if exists "own work_orders update" on work_orders;
create policy "own work_orders update" on work_orders for update
  using (unit_id in (select owned_unit_ids()))
  with check (unit_id in (select owned_unit_ids()));
