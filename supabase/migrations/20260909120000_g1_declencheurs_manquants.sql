-- Lot G1 — rétablit trois déclencheurs perdus et six colonnes manquantes.
--
-- ⚠️  NON APPLIQUÉE. Écrite le 2026-09-09, à relire avant exécution.
--
-- POURQUOI CE FICHIER. `supabase db dump` n'a pas exporté les CREATE
-- TRIGGER : la référence `schema.sql` en déclare 15, la production n'en a
-- que 11 dans le schéma public. Trois manquent réellement (le quatrième,
-- on_auth_user_created, vit dans le schéma `auth` et est bien présent).
--
-- Constaté en production le 2026-09-09 :
--
--   select tgname from pg_trigger t join pg_class c on c.oid = t.tgrelid
--   where not tgisinternal and relname in ('documents','approvals','inquiries');
--   → restrict_documents_owner_insert_trigger  (seul survivant)
--
-- Les trois absents :
--
--   1. on_document_insert                     — extraction IA des documents
--   2. restrict_approvals_owner_update_trigger — garde-fou sur approvals
--   3. restrict_inquiries_owner_update_trigger — garde-fou Loi 25 sur inquiries
--
-- Les deux garde-fous sont les plus urgents des trois : la politique RLS
-- `owner update own unit visit inquiries` ne contrôle QUE les lignes
-- visibles (type = 'visite' et unit_id dans son parc), pas les colonnes
-- modifiées. Un propriétaire peut donc aujourd'hui réécrire le nom, le
-- courriel, le téléphone et le message de la personne qui a soumis une
-- demande de visite sur son unité — un tiers dont les renseignements
-- personnels ne devraient jamais lui être modifiables (Loi 25).
--
-- ⚠️  L'URL des fonctions edge N'EST PAS écrite en dur ici, contrairement
-- aux 21 occurrences de la référence de schéma. Elle est lue depuis un
-- réglage de base de données, ce qui rend ce fichier exécutable tel quel
-- sur une préproduction sans qu'elle appelle la PRODUCTION. Voir plus bas.

-- ============================================================
-- 1. Colonnes manquantes sur documents
-- ============================================================
-- handle-document-upload/index.ts écrit dans 17 colonnes ai_*. Six
-- n'existent pas en production : l'extraction échouerait même une fois le
-- déclencheur rétabli. Le portail propriétaire teste `d.ai_processed`
-- pour afficher « En traitement… » — une colonne absente, donc toujours
-- indéfini, donc le message ne disparaît jamais.

alter table documents add column if not exists ai_processed boolean default false;
alter table documents add column if not exists ai_summary text;
alter table documents add column if not exists ai_parties text;
alter table documents add column if not exists ai_key_amount numeric(12,2);
alter table documents add column if not exists ai_expiry_date date;
alter table documents add column if not exists ai_extracted jsonb;

-- ============================================================
-- 2. Garde-fou : approvals
-- ============================================================
-- L'interface propriétaire ne modifie que status/decided_at/
-- rejection_note. Sans ce garde-fou, elle peut réécrire n'importe quelle
-- autre colonne de l'approbation (montant, description, work_order_id).

create or replace function restrict_approvals_owner_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.role() = 'authenticated' and not auth_is_admin() then
    if (to_jsonb(new) - array['status','decided_at','rejection_note'])
       is distinct from (to_jsonb(old) - array['status','decided_at','rejection_note']) then
      raise exception 'Modification non autorisée sur cette approbation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists restrict_approvals_owner_update_trigger on approvals;
create trigger restrict_approvals_owner_update_trigger
  before update on approvals
  for each row execute function restrict_approvals_owner_update();

-- ============================================================
-- 3. Garde-fou Loi 25 : inquiries
-- ============================================================
-- Le propriétaire ne modifie que `status` sur une demande de visite qui
-- concerne son unité. Les coordonnées du demandeur — un tiers — ne lui
-- sont jamais modifiables.

create or replace function restrict_inquiries_owner_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.role() = 'authenticated' and not auth_is_admin() then
    if (to_jsonb(new) - array['status'])
       is distinct from (to_jsonb(old) - array['status']) then
      raise exception 'Modification non autorisée sur cette demande';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists restrict_inquiries_owner_update_trigger on inquiries;
create trigger restrict_inquiries_owner_update_trigger
  before update on inquiries
  for each row execute function restrict_inquiries_owner_update();

-- ============================================================
-- 4. Extraction IA des documents
-- ============================================================
-- ⚠️  CE DÉCLENCHEUR DÉPENSE DE L'ARGENT. Chaque document téléversé avec
-- un fichier déclenche un appel à l'API Anthropic (claude-haiku-4-5).
-- Sur une préproduction alimentée par une copie de production, un import
-- massif de documents déclencherait autant d'appels facturés.
--
-- L'URL vient d'un réglage de base de données plutôt que d'être écrite en
-- dur. À définir UNE FOIS par environnement, avant ou après cette
-- migration (la fonction lit le réglage à chaque appel, pas à la
-- création) :
--
--   alter database postgres set app.functions_base_url =
--     'https://<ref-du-projet>.supabase.co/functions/v1';
--
-- Sans ce réglage, la fonction ne fait rien et le signale dans les
-- journaux — elle n'appelle JAMAIS une URL de repli, pour qu'une
-- préproduction mal configurée reste silencieuse au lieu de taper sur la
-- production. C'est le comportement voulu : un environnement sans réglage
-- ne déclenche aucune extraction, ce qui se voit tout de suite.

create or replace function notify_new_document()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_url text := current_setting('app.functions_base_url', true);
  anon_key text := current_setting('app.functions_anon_key', true);
begin
  if new.file_url is null then
    return new;
  end if;

  if base_url is null or base_url = '' or anon_key is null or anon_key = '' then
    raise warning 'notify_new_document : app.functions_base_url ou app.functions_anon_key absent — extraction IA ignorée pour le document %', new.id;
    return new;
  end if;

  perform net.http_post(
    url := base_url || '/handle-document-upload',
    body := jsonb_build_object('document_id', new.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'apikey', anon_key
    )
  );
  return new;
end;
$$;

drop trigger if exists on_document_insert on documents;
create trigger on_document_insert
  after insert on documents
  for each row execute function notify_new_document();

-- ============================================================
-- Vérification après exécution
-- ============================================================
-- Les trois déclencheurs doivent apparaître :
--
--   select c.relname, t.tgname from pg_trigger t
--   join pg_class c on c.oid = t.tgrelid
--   where not t.tgisinternal
--     and c.relname in ('documents','approvals','inquiries')
--   order by 1, 2;
--
-- Les six colonnes doivent exister :
--
--   select column_name from information_schema.columns
--   where table_name = 'documents' and column_name in
--     ('ai_processed','ai_summary','ai_parties','ai_key_amount',
--      'ai_expiry_date','ai_extracted');
--
-- Les 2 documents déjà en production restent non analysés : le
-- déclencheur ne vaut que pour les insertions futures. Pour les reprendre,
-- appeler handle-document-upload manuellement avec leur document_id.
