-- T3 · Contacts (maquette e13) et Importer un CSV (maquette e17).
-- 1. Une seule liste : locataires, propriétaires et fournisseurs existants deviennent des contacts liés (tenant_id,
--    owner_id, worker_id), tenus à jour par déclencheurs. Rien n'est copié deux fois (index uniques partiels).
-- 2. Import : chaque ligne est validée seule (rapport par ligne, l'import ne bloque pas tout); un doublon est ignoré
--    sauf choix contraire; une ligne avec immeuble ou portes devient un lead du pipeline Mandats, les autres restent
--    des contacts; le consentement d'une colonne n'est retenu que si une personne confirme qu'il est exprès.

alter table crm.contacts drop constraint if exists contacts_worker_fk;
alter table crm.contacts add constraint contacts_worker_fk foreign key (worker_id) references public.workers(id) on delete set null;
create index if not exists contacts_worker_idx on crm.contacts (worker_id);
create unique index if not exists contacts_un_par_locataire on crm.contacts (tenant_id) where tenant_id is not null and merged_into is null;
create unique index if not exists contacts_un_par_proprietaire on crm.contacts (owner_id) where owner_id is not null and merged_into is null;
create unique index if not exists contacts_un_par_fournisseur on crm.contacts (worker_id) where worker_id is not null and merged_into is null;

-- ── Synchronisation des fiches existantes ──
create or replace function crm.contact_depuis_locataire() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.anonymized_at is not null then update crm.contacts set anonymized_at = now(), full_name = 'Anonymisé', emails = '{}', phones_e164 = '{}' where tenant_id = new.id; return new; end if;
  insert into crm.contacts (kind, full_name, emails, phones_e164, tenant_id)
  values ('personne', new.full_name, array_remove(array[lower(nullif(btrim(new.email), ''))], null), array_remove(array[crm.normaliser_tel(new.phone)], null), new.id)
  on conflict (tenant_id) where tenant_id is not null and merged_into is null do update set full_name = excluded.full_name,
    emails = (select coalesce(array_agg(distinct e), '{}') from unnest(crm.contacts.emails || excluded.emails) e),
    phones_e164 = (select coalesce(array_agg(distinct t), '{}') from unnest(crm.contacts.phones_e164 || excluded.phones_e164) t), updated_at = now();
  return new;
end $$;
drop trigger if exists contact_locataire on public.tenants;
create trigger contact_locataire after insert or update of full_name, email, phone, anonymized_at on public.tenants for each row execute function crm.contact_depuis_locataire();

create or replace function crm.contact_depuis_proprietaire() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(current_setting('crm.sans_contact', true), '') = 'on' then return new; end if;   -- conversion d'un deal : le contact existe déjà
  insert into crm.contacts (kind, full_name, emails, phones_e164, company, owner_id)
  values ('personne', new.full_name, array_remove(array[(select lower(u.email) from public.users u where u.id = new.user_id)], null), array_remove(array[crm.normaliser_tel(new.phone)], null),
          new.company_name, new.id)
  on conflict (owner_id) where owner_id is not null and merged_into is null do update set full_name = excluded.full_name, company = coalesce(excluded.company, crm.contacts.company),
    emails = (select coalesce(array_agg(distinct e), '{}') from unnest(crm.contacts.emails || excluded.emails) e),
    phones_e164 = (select coalesce(array_agg(distinct t), '{}') from unnest(crm.contacts.phones_e164 || excluded.phones_e164) t), updated_at = now();
  return new;
end $$;
drop trigger if exists contact_proprietaire on public.owners;
create trigger contact_proprietaire after insert or update of full_name, phone, company_name, user_id on public.owners for each row execute function crm.contact_depuis_proprietaire();

create or replace function crm.contact_depuis_fournisseur() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into crm.contacts (kind, full_name, emails, phones_e164, company, worker_id)
  values (case when nullif(btrim(new.company_name), '') is not null then 'entreprise' else 'personne' end, coalesce(nullif(btrim(new.company_name), ''), new.name),
          array_remove(array[lower(nullif(btrim(new.email), ''))], null), array_remove(array[crm.normaliser_tel(new.phone)], null), new.rbq_license, new.id)
  on conflict (worker_id) where worker_id is not null and merged_into is null do update set full_name = excluded.full_name, company = excluded.company,
    emails = (select coalesce(array_agg(distinct e), '{}') from unnest(crm.contacts.emails || excluded.emails) e),
    phones_e164 = (select coalesce(array_agg(distinct t), '{}') from unnest(crm.contacts.phones_e164 || excluded.phones_e164) t), updated_at = now();
  return new;
end $$;
drop trigger if exists contact_fournisseur on public.workers;
create trigger contact_fournisseur after insert or update of name, company_name, email, phone, rbq_license on public.workers for each row execute function crm.contact_depuis_fournisseur();

-- Fiches existantes (une passe; un contact déjà créé par un prospect et le même courriel reste séparé : il apparaîtra en doublon).
insert into crm.contacts (kind, full_name, emails, phones_e164, tenant_id)
select 'personne', t.full_name, array_remove(array[lower(nullif(btrim(t.email), ''))], null), array_remove(array[crm.normaliser_tel(t.phone)], null), t.id
from public.tenants t where t.anonymized_at is null and not exists (select 1 from crm.contacts c where c.tenant_id = t.id);
insert into crm.contacts (kind, full_name, emails, phones_e164, company, owner_id)
select 'personne', o.full_name, array_remove(array[(select lower(u.email) from public.users u where u.id = o.user_id)], null), array_remove(array[crm.normaliser_tel(o.phone)], null), o.company_name, o.id
from public.owners o where not exists (select 1 from crm.contacts c where c.owner_id = o.id);
insert into crm.contacts (kind, full_name, emails, phones_e164, company, worker_id)
select case when nullif(btrim(w.company_name), '') is not null then 'entreprise' else 'personne' end, coalesce(nullif(btrim(w.company_name), ''), w.name),
       array_remove(array[lower(nullif(btrim(w.email), ''))], null), array_remove(array[crm.normaliser_tel(w.phone)], null), w.rbq_license, w.id
from public.workers w where not exists (select 1 from crm.contacts c where c.worker_id = w.id);

-- ── Contacts (e13) ──
create or replace function public.lanceur_contacts(p_role text default null, p_q text default null, p_limite int default 50) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (crm.can('ventes.lire') or crm.can('clients.lire')) then raise exception 'Votre rôle ne donne pas accès aux contacts.' using errcode = 'PT403'; end if;
  return (with base as (
    select c.*,
      array_remove(array[case when c.owner_id is not null or exists (select 1 from crm.deal_contacts dc where dc.contact_id = c.id and dc.role ilike 'propri%') then 'Propriétaire' end,
                         case when c.tenant_id is not null then 'Locataire' end, case when c.worker_id is not null then 'Fournisseur' end,
                         case when exists (select 1 from crm.deal_contacts dc where dc.contact_id = c.id and dc.role ilike 'référ%') then 'Référent' end,
                         case when exists (select 1 from crm.deal_contacts dc where dc.contact_id = c.id and dc.role = 'Candidat') then 'Candidat' end], null) as roles,
      exists (select 1 from comms.consents s where s.channel = 'email' and lower(s.address) = any(c.emails) and s.withdrawn_at is null and (s.expires_at is null or s.expires_at > now())) as c_email,
      exists (select 1 from comms.consents s where s.channel = 'sms' and s.address = any(c.phones_e164) and s.withdrawn_at is null and (s.expires_at is null or s.expires_at > now())) as c_sms,
      greatest(c.updated_at, (select max(a.occurred_at) from crm.activities a where a.contact_id = c.id or a.deal_id in (select dc.deal_id from crm.deal_contacts dc where dc.contact_id = c.id))) as derniere
    from crm.contacts c where c.merged_into is null and c.anonymized_at is null),
  filtre as (select * from base where (p_role is null or p_role = any(roles))
      and (coalesce(btrim(p_q), '') = '' or full_name ilike '%' || p_q || '%' or array_to_string(emails, ' ') ilike '%' || p_q || '%'
           or array_to_string(phones_e164, ' ') like '%' || regexp_replace(p_q, '\D', '', 'g') || '%' and regexp_replace(p_q, '\D', '', 'g') <> ''))
  select jsonb_build_object(
    'total', (select count(*) from base), 'filtres', (select count(*) from filtre),
    'contacts', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'nom', f.full_name, 'sous', coalesce(f.company, f.emails[1], f.phones_e164[1]), 'roles', f.roles,
        'deals', (select count(*) from crm.deal_contacts dc join crm.deals d on d.id = dc.deal_id where dc.contact_id = f.id and d.merged_into is null),
        'pipeline', (select pl.name from crm.deal_contacts dc join crm.deals d on d.id = dc.deal_id join crm.pipelines pl on pl.id = d.pipeline_id where dc.contact_id = f.id order by d.created_at desc limit 1),
        'deal_id', (select dc.deal_id from crm.deal_contacts dc join crm.deals d on d.id = dc.deal_id where dc.contact_id = f.id and d.merged_into is null order by d.created_at desc limit 1),
        'c_email', f.c_email, 'c_sms', f.c_sms, 'derniere', f.derniere,
        'quoi', (select a.title from crm.activities a where a.contact_id = f.id or a.deal_id in (select dc.deal_id from crm.deal_contacts dc where dc.contact_id = f.id) order by a.occurred_at desc limit 1))
        order by f.derniere desc nulls last) from (select * from filtre order by derniere desc nulls last limit greatest(1, least(p_limite, 500))) f), '[]'::jsonb),
    'consentements', jsonb_build_object('email', (select count(*) from base where c_email), 'sms', (select count(*) from base where c_sms), 'aucun', (select count(*) from base where not c_email and not c_sms)),
    'doublons', coalesce((select jsonb_agg(jsonb_build_object('a', pd.a, 'b', pd.b, 'nom', x.full_name, 'nom_b', y.full_name, 'confiance', pd.confiance,
        'pourquoi', concat_ws(' · ', case when pd.courriel then 'même courriel' end, case when pd.telephone then 'même téléphone' end, case when pd.nom then 'même nom' end),
        'detail_a', case when x.owner_id is not null then 'propriétaire' when x.tenant_id is not null then 'locataire' when x.worker_id is not null then 'fournisseur' else 'contact' end,
        'detail_b', case when y.owner_id is not null then 'propriétaire' when y.tenant_id is not null then 'locataire' when y.worker_id is not null then 'fournisseur' else 'contact' end)
        order by pd.confiance desc)
      from crm.paires_doublons() pd join crm.contacts x on x.id = pd.a join crm.contacts y on y.id = pd.b), '[]'::jsonb)));
end $$;

-- ── Import CSV (e17) ──
-- Vérification (étape 3) : pour chaque ligne, le contact déjà connu (courriel ou téléphone).
create or replace function public.lanceur_import_verifier(p_lignes jsonb) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('ventes.mandats.ecrire') then raise exception 'Votre rôle ne permet pas d’importer.' using errcode = 'PT403'; end if;
  if jsonb_array_length(p_lignes) > 2000 then raise exception 'Fichier trop gros (2 000 lignes au plus).' using errcode = 'PT422'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('ligne', (l.i - 1)::int, 'contact_id', c.id, 'nom', c.full_name))
    from jsonb_array_elements(p_lignes) with ordinality l(v, i)
    join lateral (select x.id, x.full_name from crm.contacts x where x.merged_into is null and x.anonymized_at is null
      and ((coalesce(l.v ->> 'courriel', '') <> '' and lower(btrim(l.v ->> 'courriel')) = any(x.emails)) or (crm.normaliser_tel(l.v ->> 'telephone') is not null and crm.normaliser_tel(l.v ->> 'telephone') = any(x.phones_e164)))
      limit 1) c on true), '[]'::jsonb);
end $$;

-- Confirmation (étape 4). Entrée : { source: 'Salon de l’habitation 2026', fichier, lignes: [{nom, courriel, telephone, immeuble, portes, consentement}],
--   consentement_confirme: bool, creer_doublons: [index de ligne] }. Retour : rapport par ligne.
create or replace function crm.import_contacts(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l record; v_source uuid; v_rapport jsonb := '[]'::jsonb; v_mail text; v_tel text; v_portes int; v_dbl uuid; v_contact uuid; v_prospect uuid;
  v_leads int := 0; v_contacts int := 0; v_ignores int := 0; v_erreurs int := 0; v_consent int := 0; v_import uuid := gen_random_uuid();
begin
  perform crm.require_aal2();
  if not crm.can('ventes.mandats.ecrire') then raise exception 'Votre rôle ne permet pas d’importer.' using errcode = 'PT403'; end if;
  if jsonb_array_length(p -> 'lignes') > 2000 then raise exception 'Fichier trop gros (2 000 lignes au plus).' using errcode = 'PT422'; end if;
  if coalesce(btrim(p ->> 'source'), '') = '' then raise exception 'Indiquez la source des contacts.' using errcode = 'PT422'; end if;
  insert into crm.sources (code, name) values ('csv:' || lower(regexp_replace(btrim(p ->> 'source'), '\W+', '-', 'g')), btrim(p ->> 'source'))
  on conflict (code) do update set name = excluded.name returning id into v_source;

  for l in select (x.i - 1)::int as i, x.v from jsonb_array_elements(p -> 'lignes') with ordinality x(v, i) loop
    v_mail := lower(nullif(btrim(l.v ->> 'courriel'), '')); v_tel := crm.normaliser_tel(l.v ->> 'telephone');
    v_portes := case when coalesce(l.v ->> 'portes', '') ~ '^\s*\d{1,4}\s*$' then (l.v ->> 'portes')::int end;
    if coalesce(btrim(l.v ->> 'nom'), '') = '' then
      v_erreurs := v_erreurs + 1; v_rapport := v_rapport || jsonb_build_object('ligne', l.i, 'etat', 'erreur', 'raison', 'Nom manquant'); continue;
    end if;
    if v_mail is not null and v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
      v_erreurs := v_erreurs + 1; v_rapport := v_rapport || jsonb_build_object('ligne', l.i, 'etat', 'erreur', 'raison', 'Courriel incomplet : « ' || v_mail || ' »'); continue;
    end if;
    select x.id into v_dbl from crm.contacts x where x.merged_into is null and x.anonymized_at is null
      and ((v_mail is not null and v_mail = any(x.emails)) or (v_tel is not null and v_tel = any(x.phones_e164))) limit 1;
    if v_dbl is not null and not (p -> 'creer_doublons') @> to_jsonb(l.i) then
      v_ignores := v_ignores + 1; v_rapport := v_rapport || jsonb_build_object('ligne', l.i, 'etat', 'ignoree', 'raison', 'Déjà connu', 'contact_id', v_dbl); continue;
    end if;
    if nullif(btrim(l.v ->> 'immeuble'), '') is not null or v_portes is not null then
      insert into public.prospects (full_name, email, phone, num_doors, notes, lead_source, stage)
      values (btrim(l.v ->> 'nom'), v_mail, l.v ->> 'telephone', v_portes, nullif(btrim(l.v ->> 'immeuble'), ''), btrim(p ->> 'source'), 'new') returning id into v_prospect;
      update crm.deals set source_id = v_source, subtitle = coalesce(nullif(btrim(l.v ->> 'immeuble'), ''), subtitle) where prospect_id = v_prospect;
      v_leads := v_leads + 1; v_rapport := v_rapport || jsonb_build_object('ligne', l.i, 'etat', 'lead', 'deal_id', (select id from crm.deals where prospect_id = v_prospect));
    else
      insert into crm.contacts (full_name, emails, phones_e164) values (btrim(l.v ->> 'nom'), array_remove(array[v_mail], null), array_remove(array[v_tel], null)) returning id into v_contact;
      insert into crm.activities (contact_id, type, title, body, author_user_id) values (v_contact, 'creation', 'Contact importé', btrim(p ->> 'source'), auth.uid());
      v_contacts := v_contacts + 1; v_rapport := v_rapport || jsonb_build_object('ligne', l.i, 'etat', 'contact', 'contact_id', v_contact);
    end if;
    if coalesce((p ->> 'consentement_confirme')::boolean, false) and coalesce((l.v ->> 'consentement')::boolean, false) and v_mail is not null then
      insert into comms.consents (channel, address, basis, source, proof)
      values ('email', v_mail, 'express', 'import:' || btrim(p ->> 'source'), jsonb_build_object('fichier', p ->> 'fichier', 'ligne', l.i + 1, 'confirme_par', auth.uid(), 'nom', crm.nom_membre(auth.uid()), 'le', now(), 'import', v_import));
      v_consent := v_consent + 1;
    end if;
  end loop;
  perform crm.journal('contacts.imported', 'crm.contacts', null, null, jsonb_build_object('fichier', p ->> 'fichier', 'source', p ->> 'source', 'leads', v_leads, 'contacts', v_contacts,
    'ignorees', v_ignores, 'erreurs', v_erreurs, 'consentements', v_consent, 'import', v_import), 'create-import');
  return jsonb_build_object('leads', v_leads, 'contacts', v_contacts, 'ignorees', v_ignores, 'erreurs', v_erreurs, 'consentements', v_consent, 'rapport', v_rapport);
end $$;

create or replace function public.lanceur_importer(p jsonb) returns jsonb language sql security definer set search_path = '' as $$ select crm.import_contacts(p) $$;
revoke all on function crm.import_contacts(jsonb), crm.contact_depuis_locataire(), crm.contact_depuis_proprietaire(), crm.contact_depuis_fournisseur() from public, anon, authenticated;
grant execute on function crm.import_contacts(jsonb) to service_role;
revoke all on function public.lanceur_contacts(text, text, int), public.lanceur_import_verifier(jsonb), public.lanceur_importer(jsonb) from public, anon;
grant execute on function public.lanceur_contacts(text, text, int), public.lanceur_import_verifier(jsonb), public.lanceur_importer(jsonb) to authenticated;

-- Conversion (e15) : le contact du deal devient celui du propriétaire (pas de second contact).
create or replace function crm.convert_deal(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare d crm.deals; pl crm.pipelines; s crm.stages; c crm.contacts; v_owner uuid; v_resp uuid; v_taches int := 0; v_prenom text;
begin
  perform crm.require_aal2();
  select * into d from crm.deals where id = (p ->> 'deal_id')::uuid for update;
  if not found then raise exception 'Deal introuvable.' using errcode = 'PT404'; end if;
  select * into pl from crm.pipelines where id = d.pipeline_id;
  if not crm.can(replace(pl.permission, '.lire', '.ecrire')) then raise exception 'Votre rôle ne permet pas de convertir ce deal.' using errcode = 'PT403'; end if;
  if pl.code <> 'mandats' then raise exception 'La conversion en client propriétaire vaut pour les mandats.' using errcode = 'PT422'; end if;
  if d.converted_at is not null then raise exception 'Ce deal est déjà converti.' using errcode = 'PT409'; end if;
  if d.merged_into is not null then raise exception 'Ce deal a été fusionné.' using errcode = 'PT409'; end if;
  select * into s from crm.stages where pipeline_id = d.pipeline_id and category = 'won' and active order by sort limit 1;
  select ct.* into c from crm.deal_contacts dc join crm.contacts ct on ct.id = dc.contact_id where dc.deal_id = d.id order by (dc.role ilike '%décideur%') desc limit 1;
  v_resp := coalesce(d.owner_user_id, auth.uid());

  perform set_config('crm.sans_contact', 'on', true);
  insert into public.owners (full_name, phone, company_name, management_rate)
  values (coalesce(c.full_name, d.title), c.phones_e164[1], case when d.subtitle is not null then d.title end, 6.00)
  returning id into v_owner;
  perform set_config('crm.sans_contact', '', true);
  if c.id is not null then update crm.contacts set owner_id = v_owner, updated_at = now() where id = c.id; end if;

  perform crm.changer_etape_deal(d.id, s.id, 'person');
  update crm.deals set converted_at = now(), converted_owner_id = v_owner, owner_user_id = v_resp, updated_at = now() where id = d.id;
  if d.prospect_id is not null then
    perform set_config('crm.via_deal', 'on', true);
    update public.prospects set stage = 'signed', converted_owner_id = v_owner where id = d.prospect_id;
    perform set_config('crm.via_deal', '', true);
  end if;
  insert into crm.activities (deal_id, type, title, body, author_user_id)
  values (d.id, 'conversion', 'Converti en client', 'Client propriétaire créé : ' || coalesce(c.full_name, d.title), auth.uid());

  v_prenom := split_part(coalesce(c.full_name, d.title), ' ', 1);
  if coalesce((p ->> 'processus')::boolean, true) then
    perform crm.creer_tache(jsonb_build_object('title', 'Lancer l’accueil de ' || d.title, 'context', 'Clients · processus d’accueil (à automatiser en T4)', 'due_at', now() + interval '2 days',
      'assignee_user_id', v_resp, 'entity_type', 'crm.deals', 'entity_id', d.id, 'canal', 'interface')); v_taches := v_taches + 1;
  end if;
  if coalesce((p ->> 'mandat')::boolean, true) then
    perform crm.creer_tache(jsonb_build_object('title', 'Envoyer le mandat de gestion à signer · ' || d.title, 'context', 'Ventes · mandat (eZsign en T6)', 'due_at', now() + interval '1 day',
      'assignee_user_id', v_resp, 'entity_type', 'crm.deals', 'entity_id', d.id, 'canal', 'interface')); v_taches := v_taches + 1;
  end if;
  if coalesce((p ->> 'portail')::boolean, true) then
    perform crm.creer_tache(jsonb_build_object('title', 'Inviter ' || v_prenom || ' au portail propriétaire', 'context', 'Clients · accès au portail', 'due_at', now() + interval '1 day',
      'assignee_user_id', v_resp, 'entity_type', 'crm.deals', 'entity_id', d.id, 'canal', 'interface')); v_taches := v_taches + 1;
  end if;
  update crm.tasks set deal_id = d.id where entity_type = 'crm.deals' and entity_id = d.id and deal_id is null;

  perform crm.journal('deal.converted', 'crm.deals', d.id, jsonb_build_object('stage_id', d.stage_id),
    jsonb_build_object('stage_id', s.id, 'owner_id', v_owner, 'taches', v_taches), 'convert-deal');
  return jsonb_build_object('owner_id', v_owner, 'taches', v_taches);
end $$;

