-- Lot G4.3 — permet au locataire d'écrire à Lease Lane.
--
-- ⚠️  NON APPLIQUÉE. Écrite le 2026-09-09, à relire avant exécution.
--
-- POURQUOI. La table `messages` ne portait qu'un `owner_id` : elle avait
-- été conçue pour la seule conversation propriétaire ↔ équipe. Le
-- locataire pouvait signaler un problème (une demande de service) mais
-- pas poser une question ordinaire — « quand passe le déneigeur ? »,
-- « puis-je installer un lave-vaisselle ? ».
--
-- Ces questions repartaient donc par courriel, hors du système. C'est
-- exactement ce que Grégory demande d'éviter : « les informations
-- uniquement dans des courriels ».
--
-- CE QUE FAIT CE FICHIER. Ajoute `tenant_id` à `messages`, élargit la
-- contrainte `sender`, et pose les politiques RLS pour que chacun ne voie
-- que sa propre conversation.

-- ============================================================
-- 1. La colonne et les contraintes
-- ============================================================
-- owner_id est déjà nullable : un message de locataire porte tenant_id et
-- laisse owner_id à null, et inversement. Une seule table, deux fils de
-- conversation distincts.

alter table messages add column if not exists tenant_id uuid
  references tenants(id) on delete cascade;

create index if not exists messages_tenant_id_idx on messages (tenant_id);

-- 'tenant' rejoint 'owner' et 'team' comme expéditeur possible.
alter table messages drop constraint if exists messages_sender_check;
alter table messages add constraint messages_sender_check
  check (sender in ('owner', 'team', 'tenant'));

-- Un message appartient à UNE conversation : soit celle d'un
-- propriétaire, soit celle d'un locataire, jamais les deux ni aucune.
-- Sans cette contrainte, un message sans destinataire disparaîtrait des
-- deux portails sans que personne le remarque.
alter table messages drop constraint if exists messages_un_seul_fil;
alter table messages add constraint messages_un_seul_fil
  check (num_nonnulls(owner_id, tenant_id) = 1);

-- ============================================================
-- 2. Politiques RLS
-- ============================================================
-- Mêmes règles que pour le propriétaire, transposées au locataire :
-- il ne lit que son fil, il n'écrit que dans son fil, et il ne peut pas
-- se faire passer pour l'équipe.

drop policy if exists "own tenant messages" on messages;
create policy "own tenant messages" on messages
  for select using (tenant_id = auth_tenant_id());

drop policy if exists "own tenant messages insert" on messages;
create policy "own tenant messages insert" on messages
  for insert with check (
    tenant_id = auth_tenant_id()
    -- `sender` est vérifié ici et non côté client : sans cette
    -- condition, un locataire pourrait insérer un message signé
    -- « team » et fabriquer une réponse officielle de Lease Lane.
    and sender = 'tenant'
  );

-- ============================================================
-- Vérification après exécution
-- ============================================================
--   select column_name from information_schema.columns
--   where table_name = 'messages' and column_name = 'tenant_id';
--   → une ligne.
--
--   select policyname from pg_policies
--   where tablename = 'messages' order by policyname;
--   → 4 politiques : les 2 du propriétaire + les 2 du locataire.
--
-- Les messages existants ne bougent pas : ils gardent leur owner_id et
-- un tenant_id null, ce que la contrainte messages_un_seul_fil accepte.
--
-- RESTE À FAIRE HORS DE CE FICHIER. Le portail admin ne lit aujourd'hui
-- que les messages de propriétaires (`admin-api`, clé `messages_sans_reponse`).
-- Tant qu'il n'affiche pas aussi les fils locataires, une question posée
-- ici n'atteint personne. Les deux vont ensemble.
