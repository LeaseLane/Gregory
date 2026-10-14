-- T3 · Leads entrants (l07), Nouveau lead (e16), Fusionner les fiches (e18), routage à tour de rôle.
-- Parcours de preuve : un formulaire du site crée un deal ASSIGNÉ en moins d'une minute (le déclencheur des prospects
-- route aussitôt); deux fiches de Marc Fortier sont fusionnées avec un survivant choisi.
-- Invariants : fusion idempotente, perdant marqué merged_into, aucune suppression; doublon signalé, jamais bloquant;
-- consentement LCAP seulement s'il est coché explicitement (preuve : qui, quand).

create table if not exists crm.routing_rules (
  id uuid primary key default gen_random_uuid(), pipeline_id uuid not null references crm.pipelines(id),
  kind text not null check (kind in ('tour', 'source', 'territoire')), source_id uuid references crm.sources(id), territoire text,
  user_id uuid references auth.users(id), active boolean not null default true, sort int not null default 0
);
create index if not exists routing_pipeline_idx on crm.routing_rules (pipeline_id);
create index if not exists routing_source_idx on crm.routing_rules (source_id);
create index if not exists routing_user_idx on crm.routing_rules (user_id);
alter table crm.routing_rules enable row level security;
create policy "equipe lit le routage" on crm.routing_rules for select to authenticated using (crm.is_team_member());
revoke all on crm.routing_rules from anon, authenticated; grant select on crm.routing_rules to authenticated; grant all on crm.routing_rules to service_role;
insert into crm.routing_rules (pipeline_id, kind, sort)
select id, 'tour', 9 from crm.pipelines where not exists (select 1 from crm.routing_rules r where r.pipeline_id = pipelines.id and r.kind = 'tour');

-- Prochain responsable : règle par source d'abord, sinon à tour de rôle parmi les membres qui écrivent dans ce pipeline
-- (sans les admins) : celui dont le dernier deal reçu est le plus ancien.
create or replace function crm.prochain_responsable(p_pipeline uuid, p_source uuid default null) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare v uuid; v_perm text;
begin
  select r.user_id into v from crm.routing_rules r join crm.team_members tm on tm.user_id = r.user_id and tm.active
   where r.pipeline_id = p_pipeline and r.active and r.kind = 'source' and r.source_id = p_source limit 1;
  if v is not null then return v; end if;
  if not exists (select 1 from crm.routing_rules where pipeline_id = p_pipeline and kind = 'tour' and active) then return null; end if;
  select replace(permission, '.lire', '.ecrire') into v_perm from crm.pipelines where id = p_pipeline;
  select tm.user_id into v from crm.team_members tm
   where tm.active and tm.role <> 'admin' and exists (select 1 from crm.role_permissions rp where rp.role = tm.role and rp.permission = v_perm)
   order by (select max(d.created_at) from crm.deals d where d.pipeline_id = p_pipeline and d.owner_user_id = tm.user_id) nulls first, tm.created_at
   limit 1;
  return v;
end $$;

-- Routage à la création de tout deal sans responsable (formulaire du site, courriel, Cléo, CSV, saisie).
create or replace function crm.router_deal() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.owner_user_id is null then new.owner_user_id := crm.prochain_responsable(new.pipeline_id, new.source_id); end if;
  return new;
end $$;
drop trigger if exists router_deal on crm.deals;
create trigger router_deal before insert on crm.deals for each row execute function crm.router_deal();

-- Notifier le responsable d'un nouveau lead (EQP-01 viendra par la file quand le gabarit sera converti).
create or replace function crm.notif_nouveau_deal() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.owner_user_id is not null and new.created_at > now() - interval '1 hour' then
    perform crm.notifier(array[new.owner_user_id], 'info', 'trend', 'Nouveau lead · ' || new.title,
      coalesce((select name from crm.sources where id = new.source_id), 'Source inconnue') || coalesce(' · ' || new.doors || ' portes', ''),
      'Assigné à vous · ' || (select name from crm.pipelines where id = new.pipeline_id), '/ventes/deals/' || new.id, 'crm.deals', new.id);
  end if;
  return new;
end $$;
drop trigger if exists notif_nouveau_deal on crm.deals;
create trigger notif_nouveau_deal after insert on crm.deals for each row execute function crm.notif_nouveau_deal();

-- ── Doublons ──
create or replace function crm.normaliser_tel(p text) returns text language sql immutable set search_path = '' as $$
  select case when length(regexp_replace(coalesce(p, ''), '\D', '', 'g')) >= 10 then '+1' || right(regexp_replace(p, '\D', '', 'g'), 10) end
$$;

-- Pendant la saisie (e16) : contacts connus par courriel ou téléphone.
create or replace function public.lanceur_doublons_saisie(p_email text, p_tel text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('ventes.lire') then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'nom', c.full_name, 'raison', case when lower(btrim(p_email)) = any(c.emails) then 'courriel' else 'téléphone' end,
      'client_depuis', (select extract(year from o.created_at)::int from public.owners o where o.id = c.owner_id),
      'locataire', c.tenant_id is not null,
      'deal_id', (select dc.deal_id from crm.deal_contacts dc join crm.deals d on d.id = dc.deal_id where dc.contact_id = c.id and d.merged_into is null order by d.created_at desc limit 1)))
    from crm.contacts c
    where c.merged_into is null and c.anonymized_at is null
      and ((coalesce(btrim(p_email), '') <> '' and lower(btrim(p_email)) = any(c.emails)) or (crm.normaliser_tel(p_tel) is not null and crm.normaliser_tel(p_tel) = any(c.phones_e164)))
    limit 3), '[]'::jsonb);
end $$;

-- Paires de doublons possibles (l07) : même courriel, même téléphone ou même nom.
create or replace function crm.paires_doublons() returns table (a uuid, b uuid, courriel boolean, telephone boolean, nom boolean, confiance int)
language sql stable security definer set search_path = '' as $$
  select x.id, y.id, x.emails && y.emails and cardinality(x.emails) > 0, x.phones_e164 && y.phones_e164 and cardinality(x.phones_e164) > 0,
         lower(x.full_name) = lower(y.full_name),
         least(99, (case when x.emails && y.emails and cardinality(x.emails) > 0 then 60 else 0 end) + (case when x.phones_e164 && y.phones_e164 and cardinality(x.phones_e164) > 0 then 32 else 0 end)
                   + (case when lower(x.full_name) = lower(y.full_name) then 20 else 0 end))
  from crm.contacts x join crm.contacts y on x.id < y.id
  where x.merged_into is null and y.merged_into is null and x.anonymized_at is null and y.anonymized_at is null
    and ((x.emails && y.emails and cardinality(x.emails) > 0) or (x.phones_e164 && y.phones_e164 and cardinality(x.phones_e164) > 0) or lower(x.full_name) = lower(y.full_name))
    and not exists (select 1 from crm.activities a where a.type = 'fusion' and a.contact_id in (x.id, y.id) and a.body = 'garder:' || least(x.id, y.id) || ':' || greatest(x.id, y.id))
$$;

-- Fusion (e18) : survivant choisi, perdant marqué, liens repointés, coordonnées réunies. Idempotente; rien n'est supprimé.
create or replace function crm.merge_contacts(p_survivant uuid, p_perdant uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s crm.contacts; l crm.contacts;
begin
  perform crm.require_aal2();
  if not crm.can('ventes.mandats.ecrire') and not crm.can('ventes.location.ecrire') then raise exception 'Votre rôle ne permet pas de fusionner.' using errcode = 'PT403'; end if;
  if p_survivant = p_perdant then raise exception 'Choisissez deux fiches différentes.' using errcode = 'PT422'; end if;
  select * into l from crm.contacts where id = p_perdant for update;
  if l.merged_into = p_survivant then return jsonb_build_object('survivant', p_survivant, 'deja', true); end if;  -- idempotent
  if l.merged_into is not null then raise exception 'Cette fiche est déjà fusionnée ailleurs.' using errcode = 'PT409'; end if;
  select * into s from crm.contacts where id = p_survivant for update;
  if s.merged_into is not null then raise exception 'La fiche principale a elle-même été fusionnée.' using errcode = 'PT409'; end if;
  update crm.contacts set
    emails = (select coalesce(array_agg(distinct e), '{}') from unnest(s.emails || l.emails) e),
    phones_e164 = (select coalesce(array_agg(distinct t), '{}') from unnest(s.phones_e164 || l.phones_e164) t),
    owner_id = coalesce(s.owner_id, l.owner_id), tenant_id = coalesce(s.tenant_id, l.tenant_id), company = coalesce(s.company, l.company), updated_at = now()
   where id = s.id;
  insert into crm.deal_contacts (deal_id, contact_id, role) select dc.deal_id, s.id, dc.role from crm.deal_contacts dc where dc.contact_id = l.id on conflict do nothing;
  delete from crm.deal_contacts where contact_id = l.id;   -- lien repointé (la fiche perdante reste, marquée)
  update crm.activities set contact_id = s.id where contact_id = l.id;
  update crm.contacts set merged_into = s.id, updated_at = now() where id = l.id;
  insert into crm.activities (contact_id, type, title, body, author_user_id) values (s.id, 'fusion', 'Fiches fusionnées', 'Fiche « ' || l.full_name || ' » fusionnée dans celle-ci.', auth.uid());
  perform crm.journal('contact.merged', 'crm.contacts', s.id, jsonb_build_object('perdant', l.id), jsonb_build_object('survivant', s.id), 'merge-contacts');
  return jsonb_build_object('survivant', s.id);
end $$;

-- « Garder les deux fiches » : la paire n'est plus proposée.
create or replace function crm.garder_les_deux(p_a uuid, p_b uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  insert into crm.activities (contact_id, type, title, body, author_user_id) values (least(p_a, p_b), 'fusion', 'Doublon écarté', 'garder:' || least(p_a, p_b) || ':' || greatest(p_a, p_b), auth.uid());
end $$;

-- ── Nouveau lead (e16) ──
-- Entrée : { pipeline: 'mandats'|'location', nom, courriel?, telephone?, source_id?, adresse?, portes?, consentement: bool }
create or replace function crm.create_lead(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare pl crm.pipelines; v_deal uuid; v_contact uuid; v_tel text := crm.normaliser_tel(p ->> 'telephone'); v_mail text := lower(nullif(btrim(p ->> 'courriel'), ''));
  v_stage uuid; v_source uuid := nullif(p ->> 'source_id', '')::uuid; v_prospect uuid;
begin
  perform crm.require_aal2();
  select * into pl from crm.pipelines where code = coalesce(p ->> 'pipeline', 'mandats') and active;
  if not found then raise exception 'Pipeline inconnu.' using errcode = 'PT422'; end if;
  if not crm.can(replace(pl.permission, '.lire', '.ecrire')) then raise exception 'Votre rôle ne permet pas de créer un lead ici.' using errcode = 'PT403'; end if;
  if coalesce(btrim(p ->> 'nom'), '') = '' then raise exception 'Le nom est obligatoire.' using errcode = 'PT422'; end if;
  if v_mail is not null and v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Courriel invalide.' using errcode = 'PT422'; end if;
  if pl.code = 'mandats' then
    -- Passe par prospects : le portail actuel le voit aussi; le déclencheur crée le deal, le contact et l'historique.
    insert into public.prospects (full_name, email, phone, num_doors, notes, lead_source, stage)
    values (btrim(p ->> 'nom'), v_mail, p ->> 'telephone', nullif(p ->> 'portes', '')::int, nullif(btrim(p ->> 'adresse'), ''),
            coalesce((select name from crm.sources where id = v_source), 'Saisie'), 'new')
    returning id into v_prospect;
    select d.id into v_deal from crm.deals d where d.prospect_id = v_prospect;
    update crm.deals set source_id = coalesce(v_source, source_id), subtitle = coalesce(nullif(btrim(p ->> 'adresse'), ''), subtitle) where id = v_deal;
    select dc.contact_id into v_contact from crm.deal_contacts dc where dc.deal_id = v_deal limit 1;
  else
    select id into v_stage from crm.stages where pipeline_id = pl.id and active order by sort limit 1;
    insert into crm.deals (pipeline_id, stage_id, title, subtitle, source_id, doors) values (pl.id, v_stage, btrim(p ->> 'nom'), nullif(btrim(p ->> 'adresse'), ''), v_source, nullif(p ->> 'portes', '')::int)
    returning id into v_deal;
    insert into crm.deal_stage_history (deal_id, stage_id, moved_by) values (v_deal, v_stage, auth.uid());
    insert into crm.contacts (full_name, emails, phones_e164) values (btrim(p ->> 'nom'), array_remove(array[v_mail], null), array_remove(array[v_tel], null)) returning id into v_contact;
    insert into crm.deal_contacts (deal_id, contact_id, role) values (v_deal, v_contact, 'Candidat');
    insert into crm.activities (deal_id, type, title, author_user_id) values (v_deal, 'creation', 'Lead créé' || coalesce(' · ' || (select name from crm.sources where id = v_source), ''), auth.uid());
  end if;
  if coalesce((p ->> 'consentement')::boolean, false) then
    insert into comms.consents (channel, address, basis, source, proof)
    select ch, ad, 'express', 'lanceur:nouveau-lead', jsonb_build_object('par', auth.uid(), 'nom', crm.nom_membre(auth.uid()), 'le', now(), 'deal', v_deal)
    from (values ('email', v_mail), ('sms', v_tel)) x(ch, ad) where ad is not null;
  end if;
  perform crm.journal('lead.created', 'crm.deals', v_deal, null, jsonb_build_object('pipeline', pl.code, 'consentement', coalesce((p ->> 'consentement')::boolean, false)), 'create-deal');
  return jsonb_build_object('deal_id', v_deal, 'owner', (select crm.nom_membre(owner_user_id) from crm.deals where id = v_deal));
end $$;

-- ── Portes de l'interface ──
create or replace function public.lanceur_leads() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('ventes.lire') then raise exception 'Votre rôle ne donne pas accès aux leads.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    -- ponytail: paires_doublons() recalculé par ligne; à matérialiser si la liste dépasse quelques centaines de contacts
    'leads', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'title', d.title, 'subtitle', coalesce(d.subtitle, case when d.doors is not null then d.doors || ' portes' end),
        'source', so.name, 'pipeline', pl.name, 'pipeline_code', pl.code, 'owner', case when d.owner_user_id is not null then crm.nom_membre(d.owner_user_id) end, 'created_at', d.created_at,
        'doublon', exists (select 1 from crm.deal_contacts dc, crm.paires_doublons() pd where dc.deal_id = d.id and dc.contact_id in (pd.a, pd.b)))
        order by d.created_at desc)
      from crm.deals d join crm.pipelines pl on pl.id = d.pipeline_id left join crm.sources so on so.id = d.source_id
      join crm.stages s on s.id = d.stage_id
      where d.merged_into is null and s.sort = 1 and d.created_at > now() - interval '14 days' and crm.can(pl.permission)), '[]'::jsonb),
    'regles', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'kind', r.kind, 'pipeline', pl.name, 'source', so.name, 'user', case when r.user_id is not null then crm.nom_membre(r.user_id) end,
        'active', r.active, 'membres', (select string_agg(split_part(crm.nom_membre(tm.user_id), ' ', 1), ', ' order by tm.created_at) from crm.team_members tm
          where tm.active and tm.role <> 'admin' and exists (select 1 from crm.role_permissions rp where rp.role = tm.role and rp.permission = replace(pl.permission, '.lire', '.ecrire')))) order by r.sort, pl.sort)
      from crm.routing_rules r join crm.pipelines pl on pl.id = r.pipeline_id left join crm.sources so on so.id = r.source_id), '[]'::jsonb),
    'doublon', (select jsonb_build_object('a', jsonb_build_object('id', x.id, 'nom', x.full_name, 'emails', x.emails, 'phones', x.phones_e164,
          'detail', case when x.owner_id is not null then 'client depuis ' || (select extract(year from o.created_at)::int from public.owners o where o.id = x.owner_id) when x.tenant_id is not null then 'locataire' else 'fiche du ' || to_char(x.created_at, 'DD/MM') end),
        'b', jsonb_build_object('id', y.id, 'nom', y.full_name, 'emails', y.emails, 'phones', y.phones_e164,
          'detail', case when y.owner_id is not null then 'client depuis ' || (select extract(year from o.created_at)::int from public.owners o where o.id = y.owner_id) when y.tenant_id is not null then 'locataire' else 'nouveau lead' end),
        'courriel', pd.courriel, 'telephone', pd.telephone, 'nom', pd.nom, 'confiance', pd.confiance)
      from crm.paires_doublons() pd join crm.contacts x on x.id = pd.a join crm.contacts y on y.id = pd.b order by pd.confiance desc limit 1),
    'sources', coalesce((select jsonb_agg(jsonb_build_object('nom', z.nom, 'n', z.n) order by z.n desc) from (
        select coalesce(so.name, 'Autre') as nom, count(*) as n from crm.deals d left join crm.sources so on so.id = d.source_id
        where d.created_at >= date_trunc('month', now()) and d.merged_into is null group by 1) z), '[]'::jsonb),
    'pipelines', (select jsonb_agg(jsonb_build_object('code', code, 'name', name) order by sort) from crm.pipelines where active and crm.can(replace(permission, '.lire', '.ecrire'))),
    'liste_sources', (select jsonb_agg(jsonb_build_object('id', id, 'name', name) order by name) from crm.sources where active),
    'prochains', (select jsonb_object_agg(pl.code, crm.nom_membre(crm.prochain_responsable(pl.id, null))) from crm.pipelines pl where pl.active));
end $$;

create or replace function public.lanceur_creer_lead(p jsonb) returns jsonb language sql security definer set search_path = '' as $$ select crm.create_lead(p) $$;
create or replace function public.lanceur_fusionner_contacts(p_survivant uuid, p_perdant uuid) returns jsonb language sql security definer set search_path = '' as $$ select crm.merge_contacts(p_survivant, p_perdant) $$;
create or replace function public.lanceur_garder_les_deux(p_a uuid, p_b uuid) returns void language sql security definer set search_path = '' as $$ select crm.garder_les_deux(p_a, p_b) $$;
create or replace function public.lanceur_regle_routage(p_id uuid, p_active boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('envois.suspendre') then raise exception 'Réservé aux gestionnaires.' using errcode = 'PT403'; end if;
  update crm.routing_rules set active = p_active where id = p_id;
  perform crm.journal('routing.updated', 'crm.routing_rules', p_id, null, jsonb_build_object('active', p_active), 'update-routing');
end $$;

revoke all on function crm.prochain_responsable(uuid, uuid), crm.merge_contacts(uuid, uuid), crm.garder_les_deux(uuid, uuid), crm.create_lead(jsonb), crm.paires_doublons() from public, anon, authenticated;
grant execute on function crm.prochain_responsable(uuid, uuid), crm.merge_contacts(uuid, uuid), crm.garder_les_deux(uuid, uuid), crm.create_lead(jsonb), crm.paires_doublons() to service_role;
revoke all on function public.lanceur_doublons_saisie(text, text), public.lanceur_leads(), public.lanceur_creer_lead(jsonb), public.lanceur_fusionner_contacts(uuid, uuid),
  public.lanceur_garder_les_deux(uuid, uuid), public.lanceur_regle_routage(uuid, boolean) from public, anon;
grant execute on function public.lanceur_doublons_saisie(text, text), public.lanceur_leads(), public.lanceur_creer_lead(jsonb), public.lanceur_fusionner_contacts(uuid, uuid),
  public.lanceur_garder_les_deux(uuid, uuid), public.lanceur_regle_routage(uuid, boolean) to authenticated;
