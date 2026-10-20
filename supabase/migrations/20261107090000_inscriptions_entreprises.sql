-- « Inscrire mon entreprise » (site leaselane.ca) : une demande = téléphone, courriel, preuve d'assurance.
--
-- Écrite par la fonction inscription-entreprise (clé de service) AVANT le dépôt du fichier, avec la clé
-- d'idempotence du navigateur : un double clic ne crée qu'une demande. Une seule demande ouverte par courriel.
-- Le fichier va dans le stockage privé « documents » sous inscriptions/<id>/; l'équipe l'ouvre par un lien
-- signé de 10 minutes (ops-api inscription_document). « Inviter » (onboarding-api inviter_inscription) crée la
-- fiche travailleur, rattache la preuve (reçue, PAS vérifiée) et envoie un lien de connexion temporaire.

-- Stockage privé déjà créé à la main en production; créé ici pour les bases neuves (préproduction).
insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict (id) do nothing;

create table if not exists public.inscriptions_entreprises (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid not null unique,
  courriel text not null,
  telephone text not null check (telephone ~ '^\d{10}$'),
  poste text check (poste is null or poste ~ '^\d{1,6}$'),
  fichier_chemin text,
  fichier_type text,
  fichier_taille int,
  fichier_nom text,
  statut text not null default 'recue' check (statut in ('recue', 'a_completer', 'invitation_envoyee', 'ecartee')),
  note text,
  ip text,
  consent_purpose text,
  consented_at timestamptz,
  notifie_le timestamptz,
  notification_erreur text,
  worker_id uuid references public.workers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists inscriptions_entreprises_courriel_ouvert on public.inscriptions_entreprises (lower(courriel)) where statut <> 'ecartee';
create index if not exists inscriptions_entreprises_worker_idx on public.inscriptions_entreprises (worker_id);

drop trigger if exists inscriptions_entreprises_touch_updated_at on public.inscriptions_entreprises;
create trigger inscriptions_entreprises_touch_updated_at before update on public.inscriptions_entreprises for each row execute function crm.touch_updated_at();

-- Lecture réservée aux admins; aucune écriture directe (tout passe par les fonctions, clé de service).
alter table public.inscriptions_entreprises enable row level security;
drop policy if exists "admin lit les inscriptions d'entreprises" on public.inscriptions_entreprises;
create policy "admin lit les inscriptions d'entreprises" on public.inscriptions_entreprises for select to authenticated using (public.auth_is_admin());
revoke insert, update, delete on public.inscriptions_entreprises from anon, authenticated;

comment on table public.inscriptions_entreprises is 'Demandes « Inscrire mon entreprise » du site. Reçue → À compléter → Invitation envoyée (ou écartée). L''assurance reçue n''est pas vérifiée.';
comment on column public.inscriptions_entreprises.courriel is 'RP · coordonnées · traiter la demande et donner l''accès à la plateforme · effacé avec la fiche travailleur (Loi 25)';
comment on column public.inscriptions_entreprises.telephone is 'RP · coordonnées (10 chiffres) · contacter la personne au sujet de sa demande';
comment on column public.inscriptions_entreprises.poste is 'RP · coordonnées · poste téléphonique facultatif';
comment on column public.inscriptions_entreprises.fichier_chemin is 'RP · preuve d''assurance · stockage privé documents/inscriptions/<id>/, jamais publique';
comment on column public.inscriptions_entreprises.fichier_nom is 'RP · nom du fichier tel que transmis';
comment on column public.inscriptions_entreprises.ip is 'RP · identifiant technique · limite anti-abus du formulaire';
comment on column public.inscriptions_entreprises.consent_purpose is 'Finalité annoncée sous le formulaire (Loi 25)';
comment on column public.inscriptions_entreprises.notifie_le is 'Avis à l''équipe parti; nul = à renvoyer (voir notification_erreur)';

-- Loi 25 : l'effacement d'un travailleur retire aussi la preuve déposée par sa demande d'inscription.
create or replace function public.service_loi25_fichiers(p_request uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('bucket', o.bucket_id, 'chemin', o.name)), '[]'::jsonb) from public.personal_data_requests r join storage.objects o on
    (r.subject_type = 'owner' and o.bucket_id = 'documents' and o.name like r.subject_id || '/%') or (r.subject_type = 'tenant' and o.bucket_id = 'service-request-photos' and o.name like r.subject_id || '/%')
    or (r.subject_type = 'worker' and o.bucket_id = 'documents' and o.name like 'workers/' || r.subject_id || '/%')
    or (r.subject_type = 'worker' and o.bucket_id = 'documents' and exists (select 1 from public.inscriptions_entreprises ie where ie.worker_id = r.subject_id and o.name like 'inscriptions/' || ie.id || '/%'))
  where r.id = p_request and r.request_type = 'deletion';
$$;
revoke all on function public.service_loi25_fichiers(uuid) from public, anon, authenticated; grant execute on function public.service_loi25_fichiers(uuid) to service_role;
