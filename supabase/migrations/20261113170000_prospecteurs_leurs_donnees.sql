-- Prospecteurs : seulement leurs données (Octa, 2026-11-11 : « show them only theirs »).
-- Un membre au rôle « prospection » ne voit et ne touche que les deals à son nom; Leads entrants, Contacts, la file « À appeler »,
-- l'import CSV et l'assignation lui sont refusés; Prospecteurs ne montre que lui. Le rôle perd clients.lire (espace Clients).
-- Il garde Prospection IA (rôle d'évaluation, données publiques) et « Mes prospects ».

create or replace function crm.est_prospecteur() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from crm.team_members tm where tm.user_id = auth.uid() and tm.active and tm.removed_at is null and tm.role = 'prospection')
$$;
create or replace function crm.exiger_mon_deal(p_deal uuid) returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if crm.est_prospecteur() and not exists (select 1 from crm.deals where id = p_deal and owner_user_id = auth.uid()) then
    raise exception 'Ce prospect n’est pas à votre nom.' using errcode = 'PT403';
  end if;
end $$;
revoke all on function crm.est_prospecteur(), crm.exiger_mon_deal(uuid) from public, anon;
grant execute on function crm.est_prospecteur(), crm.exiger_mon_deal(uuid) to authenticated;

delete from crm.role_permissions where role = 'prospection' and permission = 'clients.lire';

create or replace function public.lanceur_deal(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare d crm.deals; pl crm.pipelines;
begin
  perform crm.exiger_mon_deal(p_id);
  select * into d from crm.deals where id = p_id;
  if not found then raise exception 'Deal introuvable.' using errcode = 'PT404'; end if;
  select * into pl from crm.pipelines where id = d.pipeline_id;
  if not crm.can(pl.permission) then raise exception 'Votre rôle ne donne pas accès à ce pipeline.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'deal', to_jsonb(d) || jsonb_build_object('source', (select name from crm.sources where id = d.source_id),
       'owner', case when d.owner_user_id is not null then crm.nom_membre(d.owner_user_id) end, 'loss_reason', (select label from crm.loss_reasons where code = d.loss_reason_code)),
    'pipeline', to_jsonb(pl), 'peut_ecrire', crm.can(replace(pl.permission, '.lire', '.ecrire')),
    'etapes', (select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'category', s.category, 'target_days', s.target_days,
        'jours', (select round(sum(extract(epoch from coalesce(h.left_at, now()) - h.entered_at)) / 86400.0, 1) from crm.deal_stage_history h where h.deal_id = d.id and h.stage_id = s.id),
        'depuis', (select h.entered_at from crm.deal_stage_history h where h.deal_id = d.id and h.stage_id = s.id and h.left_at is null)) order by s.sort)
      from crm.stages s where s.pipeline_id = pl.id and s.active),
    'contacts', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'nom', c.full_name, 'role', dc.role, 'emails', c.emails, 'phones', c.phones_e164))
      from crm.deal_contacts dc join crm.contacts c on c.id = dc.contact_id where dc.deal_id = d.id), '[]'::jsonb),
    'activites', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'type', a.type, 'title', a.title, 'body', a.body, 'occurred_at', a.occurred_at,
        'auteur', case when a.author_user_id is not null then crm.nom_membre(a.author_user_id) end, 'actor_kind', a.actor_kind) order by a.occurred_at desc)
      from crm.activities a where a.deal_id = d.id), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'type', 'appel', 'title', case c.direction when 'out' then 'Appel sortant' else 'Appel reçu' end
            || case when c.caller_user_id is not null then ' · ' || crm.nom_membre(c.caller_user_id) else '' end,
          'body', coalesce(c.analysis ->> 'summary', left(c.transcript, 240)), 'occurred_at', c.started_at, 'actor_kind', 'person'))
        from comms.calls c where d.prospect_id is not null and c.prospect_id = d.prospect_id), '[]'::jsonb),
    'taches', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'due_at', t.due_at, 'assignee', case when t.assignee_user_id is not null then crm.nom_membre(t.assignee_user_id) end) order by t.due_at nulls last)
      from crm.tasks t where t.deal_id = d.id and t.status = 'open'), '[]'::jsonb),
    'raisons', (select jsonb_agg(jsonb_build_object('code', code, 'label', label) order by sort) from crm.loss_reasons where active),
    'survivant', case when d.merged_into is not null then (select jsonb_build_object('id', x.id, 'title', x.title) from crm.deals x where x.id = d.merged_into) end);
end $$;

create or replace function public.lanceur_deal_historique(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare d crm.deals; pl crm.pipelines; pr public.prospects;
begin
  perform crm.exiger_mon_deal(p_id);
  select * into d from crm.deals where id = p_id;
  if not found then raise exception 'Deal introuvable.' using errcode = 'PT404'; end if;
  select * into pl from crm.pipelines where id = d.pipeline_id;
  if not crm.can(pl.permission) then raise exception 'Votre rôle ne donne pas accès à ce pipeline.' using errcode = 'PT403'; end if;
  select * into pr from public.prospects where id = d.prospect_id;
  if not found then return jsonb_build_object('notes', null, 'appels', '[]'::jsonb); end if;
  return jsonb_build_object(
    'prospect_id', pr.id, 'peut_appeler', coalesce(public.auth_cold_caller_id() in (pr.assigned_caller_id, pr.created_by_caller_id), false),
    'notes', nullif(btrim(pr.notes), ''),
    'interet', pr.interest_level, 'relance', pr.next_followup_date, 'prochaine_action', pr.next_action,
    'appels', coalesce((select jsonb_agg(jsonb_build_object('le', c ->> 'date', 'resume', coalesce(c ->> 'summary', c ->> 'transcript'), 'prochaine_etape', c ->> 'next_step',
        'objections', c ->> 'objections', 'engagement', c ->> 'commitment', 'interet', c ->> 'interest_level',
        'par', (select cc.full_name from public.cold_callers cc where cc.id::text = c ->> 'caller_id')) order by c ->> 'date' desc)
      from jsonb_array_elements(case when jsonb_typeof(pr.call_history) = 'array' then pr.call_history else '[]'::jsonb end) c), '[]'::jsonb));
end $$;

create or replace function public.lanceur_note_deal(p_deal uuid, p_texte text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_perm text; a crm.activities;
begin
  perform crm.exiger_mon_deal(p_deal);
  perform crm.require_aal2();
  select replace(pl.permission, '.lire', '.ecrire') into v_perm from crm.deals d join crm.pipelines pl on pl.id = d.pipeline_id where d.id = p_deal;
  if v_perm is null then raise exception 'Deal introuvable.' using errcode = 'PT404'; end if;
  if not crm.can(v_perm) then raise exception 'Votre rôle ne permet pas d’écrire sur ce deal.' using errcode = 'PT403'; end if;
  if coalesce(btrim(p_texte), '') = '' then raise exception 'La note est vide.' using errcode = 'PT422'; end if;
  insert into crm.activities (deal_id, type, title, body, author_user_id) values (p_deal, 'note', 'Note', left(btrim(p_texte), 5000), auth.uid()) returning * into a;
  return to_jsonb(a);
end $$;

create or replace function public.lanceur_deplacer_deal(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r jsonb; d crm.deals;
begin
  perform crm.exiger_mon_deal((p ->> 'deal_id')::uuid);
  r := crm.move_deal_stage(p);
  if coalesce((p ->> 'relance_6_mois')::boolean, false) and not coalesce((r ->> 'inchange')::boolean, false) then
    select * into d from crm.deals where id = (p ->> 'deal_id')::uuid;
    perform crm.creer_tache(jsonb_build_object('title', 'Relancer ' || d.title, 'context', 'Ventes · relance après perte', 'due_at', now() + interval '6 months',
      'assignee_user_id', coalesce(d.owner_user_id, auth.uid()), 'canal', 'interface') || jsonb_build_object('entity_type', 'crm.deals', 'entity_id', d.id));
    update crm.tasks set deal_id = d.id where entity_type = 'crm.deals' and entity_id = d.id and deal_id is null;
  end if;
  return r;
end $$;

create or replace function crm.convert_deal(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare d crm.deals; pl crm.pipelines; s crm.stages; c crm.contacts; v_owner uuid; v_resp uuid; v_taches int := 0; v_prenom text;
begin
  perform crm.exiger_mon_deal((p ->> 'deal_id')::uuid);
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

create or replace function public.lanceur_leads() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if crm.est_prospecteur() then raise exception 'Réservé à l’équipe : votre espace montre vos prospects (Mes prospects).' using errcode = 'PT403'; end if;
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

create or replace function public.lanceur_contacts(p_role text default null, p_q text default null, p_limite int default 50) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if crm.est_prospecteur() then raise exception 'Réservé à l’équipe : votre espace montre vos prospects (Mes prospects).' using errcode = 'PT403'; end if;
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

create or replace function public.lanceur_appels(p_jours int default 7) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if crm.est_prospecteur() then raise exception 'Réservé à l’équipe : votre espace montre vos prospects (Mes prospects).' using errcode = 'PT403'; end if;
  if not (crm.can('operations.lire') or crm.can('ventes.prospection.lire')) then raise exception 'Votre rôle ne donne pas accès aux appels.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'appels', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'direction', c.direction, 'from_e164', c.from_e164, 'to_e164', c.to_e164,
        'qui', coalesce(t.full_name, coalesce(p.company_name, p.full_name), case c.direction when 'in' then c.from_e164 else c.to_e164 end),
        'type', case when t.id is not null then 'Locataire' when p.id is not null then 'Prospect' end,
        'appelant', case when c.caller_user_id is not null then crm.nom_membre(c.caller_user_id) else cc.full_name end,
        'menu_choice', c.menu_choice, 'forwarded_to', c.forwarded_to, 'status', c.status, 'started_at', c.started_at, 'duration_s', c.duration_s,
        'consent_announced', c.consent_announced, 'enregistre', c.recording_ref is not null, 'transcript', c.transcript, 'voicemail', c.voicemail,
        'analysis', c.analysis, 'proposal_id', c.proposal_id, 'proposal_status', pr.status, 'conversation_id', c.conversation_id, 'simulated', c.simulated)
        order by c.started_at desc)
      from comms.calls c left join public.tenants t on t.id = c.tenant_id left join public.prospects p on p.id = c.prospect_id
      left join public.cold_callers cc on cc.id = c.cold_caller_id left join crm.proposals pr on pr.id = c.proposal_id
      where c.started_at > now() - make_interval(days => greatest(1, least(p_jours, 90)))), '[]'::jsonb),
    'reglages', (select valeur from config.parametres where cle = 'telephonie'),
    'mon_cellulaire', (select phone_e164 from crm.team_members where user_id = auth.uid()));
end $$;

create or replace function public.lanceur_appels_file(p jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_ville text := nullif(p ->> 'ville', '');
begin
  if crm.est_prospecteur() then raise exception 'Réservé à l’équipe : votre espace montre vos prospects (Mes prospects).' using errcode = 'PT403'; end if;
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.lire') then raise exception 'Votre rôle ne donne pas accès à la prospection.' using errcode = 'PT403'; end if;
  return (with grp as (
      select crm.cle_proprietaire(i.groupe, i.proprietaire) cle, min(coalesce(i.groupe, i.proprietaire)) nom, count(*) n, sum(i.logements) logements,
        string_agg(distinct i.municipalite, ', ') villes,
        jsonb_agg(jsonb_build_object('adresse', i.adresse, 'ville', i.municipalite, 'logements', i.logements, 'annee', i.annee) order by i.logements desc) immeubles
      from crm.immeubles_role i where i.proprietaire is not null and not i.ecarte group by 1),
    dernier as (select distinct on (a.cle) a.* from crm.role_appels a order by a.cle, a.le desc),
    file as (
      select g.*, c.telephone, c.courriel, c.site, c.decideur, c.gestionnaire, c.sources, d.issue derniere_issue, d.le dernier_appel, d.note derniere_note,
        -- externe : un gestionnaire dont le nom ne recoupe pas celui du propriétaire (« Cromwell Management » gère « Cromwell » : interne)
        c.gestionnaire is not null and strpos(crm.cle_proprietaire(null, c.gestionnaire), g.cle) = 0 and strpos(g.cle, crm.cle_proprietaire(null, c.gestionnaire)) = 0 externe,
        (select count(*) from crm.role_appels a where a.cle = g.cle) tentatives,
        (case when g.logements between 100 and 200 then 50 else 0 end) + (case when c.gestionnaire is not null and strpos(crm.cle_proprietaire(null, c.gestionnaire), g.cle) = 0 and strpos(g.cle, crm.cle_proprietaire(null, c.gestionnaire)) = 0 then 30 else 0 end)
          + (case when c.decideur is not null then 10 else 0 end) + (case when c.courriel is not null then 10 else 0 end) score,
        case when d.issue = 'rappeler' and d.rappel_le <= now() then 0 else 1 end priorite
      from grp g join crm.role_coordonnees c on c.cle = g.cle left join dernier d on d.cle = g.cle
      where c.telephone is not null and not c.refus and (v_ville is null or g.villes like '%' || v_ville || '%')
        and (d.issue is null or (d.issue = 'sans_reponse' and d.le < now() - interval '2 days') or (d.issue = 'rappeler' and d.rappel_le <= now())))
    select jsonb_build_object(
      'file', coalesce((select jsonb_agg(to_jsonb(f) || jsonb_build_object('pourquoi',
          f.nom || ' possède ' || f.n || ' immeuble' || case when f.n > 1 then 's' else '' end || ' (' || f.logements || ' logements) à ' || f.villes
          || case when f.externe then ', gérés par ' || f.gestionnaire || ' : on peut comparer leur service au nôtre.'
                  when f.gestionnaire is not null then ', gérés à l’interne : on peut leur enlever la gestion quotidienne.'
                  else ', gestion actuelle inconnue : à demander.' end)
        order by f.priorite, f.score desc, f.logements desc) from (select * from file order by priorite, score desc, logements desc limit 30) f), '[]'::jsonb),
      'du_jour', (select jsonb_build_object('appels', count(*), 'interesses', count(*) filter (where issue = 'interesse'), 'joints', count(*) filter (where issue <> 'sans_reponse'))
        from crm.role_appels where par = auth.uid() and le >= date_trunc('day', now() at time zone 'America/Toronto') at time zone 'America/Toronto'),
      'objectif', 40,
      'villes', (select jsonb_agg(distinct i.municipalite) from crm.immeubles_role i join crm.role_coordonnees c on c.cle = crm.cle_proprietaire(i.groupe, i.proprietaire)),
      'peut_ecrire', crm.can('ventes.prospection.ecrire')));
end $$;

create or replace function public.lanceur_appel_issue(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cle text := p ->> 'cle'; v_issue text := p ->> 'issue'; c crm.role_coordonnees; v_deal uuid; v_prospect uuid; v_n int; v_log int; v_villes text; v_id uuid;
begin
  if crm.est_prospecteur() then raise exception 'Réservé à l’équipe : votre espace montre vos prospects (Mes prospects).' using errcode = 'PT403'; end if;
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.ecrire') then raise exception 'Votre rôle ne permet pas d’inscrire un appel.' using errcode = 'PT403'; end if;
  select * into c from crm.role_coordonnees where cle = v_cle;
  if c.cle is null then raise exception 'Propriétaire introuvable.' using errcode = 'PT404'; end if;
  if v_issue = 'rappeler' and coalesce(nullif(p ->> 'rappel_le', '')::timestamptz, now()) <= now() then raise exception 'Choisissez quand rappeler.' using errcode = 'PT422'; end if;
  if v_issue = 'pas_interesse' and length(btrim(coalesce(p ->> 'motif', ''))) < 3 then raise exception 'Indiquez le motif.' using errcode = 'PT422'; end if;
  if v_issue = 'interesse' then
    select count(*), sum(logements), string_agg(distinct municipalite, ', ') into v_n, v_log, v_villes
      from crm.immeubles_role where proprietaire is not null and not ecarte and crm.cle_proprietaire(groupe, proprietaire) = v_cle;
    insert into public.prospects (full_name, company_name, email, phone, num_doors, notes, lead_source, stage)
    values (coalesce(c.decideur, c.nom), c.nom, c.courriel, c.telephone, coalesce(nullif(p #>> '{reponses,logements}', '')::int, v_log),
      'Appel du ' || to_char(now() at time zone 'America/Toronto', 'DD/MM/YYYY') || ' : ' || coalesce(nullif(btrim(p ->> 'note'), ''), 'intéressé') || ' · ' || v_n || ' immeuble(s), ' || v_villes,
      'Appels — rôle d’évaluation', 'interested')
    returning id into v_prospect;
    select id into v_deal from crm.deals where prospect_id = v_prospect;
    perform crm.creer_tache(jsonb_build_object('title', 'Rendez-vous avec ' || coalesce(c.decideur, c.nom), 'context', 'Intéressé au téléphone · ' || coalesce(c.telephone, ''),
      'due_at', coalesce(nullif(p ->> 'rappel_le', ''), (now() + interval '2 days')::text), 'assignee_user_id', auth.uid(), 'source', 'system', 'entity_type', 'crm.deals', 'entity_id', v_deal));
  end if;
  insert into crm.role_appels (cle, issue, rappel_le, motif, note, reponses, deal_id, par)
  values (v_cle, v_issue, case when v_issue = 'rappeler' then (p ->> 'rappel_le')::timestamptz end, nullif(btrim(p ->> 'motif'), ''), nullif(btrim(p ->> 'note'), ''),
    coalesce(p -> 'reponses', '{}'::jsonb), v_deal, auth.uid())
  returning id into v_id;
  perform crm.journal('call.logged', 'crm.role_appels', v_id, null, jsonb_build_object('cle', v_cle, 'issue', v_issue), 'log-call');
  return jsonb_build_object('deal_id', v_deal);
end $$;

create or replace function public.lanceur_import_verifier(p_lignes jsonb) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if crm.est_prospecteur() then raise exception 'Réservé à l’équipe : votre espace montre vos prospects (Mes prospects).' using errcode = 'PT403'; end if;
  if not crm.can('ventes.mandats.ecrire') then raise exception 'Votre rôle ne permet pas d’importer.' using errcode = 'PT403'; end if;
  if jsonb_array_length(p_lignes) > 2000 then raise exception 'Fichier trop gros (2 000 lignes au plus).' using errcode = 'PT422'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('ligne', (l.i - 1)::int, 'contact_id', c.id, 'nom', c.full_name))
    from jsonb_array_elements(p_lignes) with ordinality l(v, i)
    join lateral (select x.id, x.full_name from crm.contacts x where x.merged_into is null and x.anonymized_at is null
      and ((coalesce(l.v ->> 'courriel', '') <> '' and lower(btrim(l.v ->> 'courriel')) = any(x.emails)) or (crm.normaliser_tel(l.v ->> 'telephone') is not null and crm.normaliser_tel(l.v ->> 'telephone') = any(x.phones_e164)))
      limit 1) c on true), '[]'::jsonb);
end $$;

create or replace function public.lanceur_prospects_assigner(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_caller uuid := nullif(p ->> 'caller_id', '')::uuid; c public.cold_callers; v_ids uuid[]; n int; v_user uuid;
begin
  if crm.est_prospecteur() then raise exception 'Réservé à l’équipe : votre espace montre vos prospects (Mes prospects).' using errcode = 'PT403'; end if;
  perform crm.require_aal2();
  if not crm.can('ventes.mandats.ecrire') then raise exception 'Votre rôle ne permet pas d’assigner des prospects.' using errcode = 'PT403'; end if;
  v_ids := array(select (x)::uuid from jsonb_array_elements_text(coalesce(p -> 'ids', '[]'::jsonb)) x);
  if cardinality(v_ids) = 0 then raise exception 'Choisissez au moins un prospect.' using errcode = 'PT422'; end if;
  if cardinality(v_ids) > 500 then raise exception 'Au plus 500 prospects à la fois.' using errcode = 'PT422'; end if;
  if v_caller is not null then
    select * into c from public.cold_callers where id = v_caller;
    if not found then raise exception 'Prospecteur introuvable.' using errcode = 'PT404'; end if;
    if not coalesce(c.active, true) then raise exception 'Ce prospecteur est inactif.' using errcode = 'PT409'; end if;
  end if;
  update public.prospects set assigned_caller_id = v_caller where id = any (v_ids) and archived_at is null and anonymized_at is null;
  get diagnostics n = row_count;
  select tm.user_id into v_user from crm.team_members tm where tm.user_id = c.user_id and tm.active and tm.removed_at is null;
  update crm.deals d set owner_user_id = v_user, updated_at = now()
   where d.prospect_id = any (v_ids) and d.owner_user_id is distinct from v_user
     and (v_user is not null or exists (select 1 from crm.team_members tm where tm.user_id = d.owner_user_id and tm.role = 'prospection'));
  if v_caller is not null and c.user_id is not null and n > 0 then
    perform crm.notifier(array[c.user_id], 'info', 'trend', n || ' prospect' || case when n > 1 then 's' else '' end || ' à appeler',
      'Assigné' || case when n > 1 then 's' else '' end || ' par ' || coalesce(crm.nom_membre(auth.uid()), 'l’équipe'), null, '/ventes/mes-prospects', 'public.cold_callers', c.id);
  end if;
  perform crm.journal(case when v_caller is null then 'prospect.unassigned' else 'prospect.assigned' end, 'public.cold_callers', v_caller, null,
    jsonb_build_object('prospects', n, 'prospecteur', c.full_name), 'assign-prospects');
  return jsonb_build_object('n', n);
end $$;

create or replace function public.lanceur_pipeline(p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare pl crm.pipelines;
begin
  select * into pl from crm.pipelines where code = p_code and active;
  if not found then raise exception 'Pipeline inconnu.' using errcode = 'PT404'; end if;
  if not crm.can(pl.permission) then raise exception 'Votre rôle ne donne pas accès à ce pipeline.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'pipeline', to_jsonb(pl), 'peut_ecrire', crm.can(replace(pl.permission, '.lire', '.ecrire')),
    'etapes', (select jsonb_agg(to_jsonb(s) order by s.sort) from crm.stages s where s.pipeline_id = pl.id and s.active),
    'deals', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'number', d.number, 'title', d.title, 'subtitle', d.subtitle, 'stage_id', d.stage_id,
        'source', so.name, 'owner_user_id', d.owner_user_id, 'owner', case when d.owner_user_id is not null then crm.nom_membre(d.owner_user_id) end,
        'monthly_value_cents', d.monthly_value_cents, 'doors', d.doors, 'loss_reason', lr.label, 'loss_note', d.loss_note, 'converted_at', d.converted_at, 'close_date', d.close_date,
        'entered_at', h.entered_at,
        'prochaine', (select t.title || ' · ' || to_char(t.due_at at time zone 'America/Toronto', 'DD/MM') from crm.tasks t where t.deal_id = d.id and t.status = 'open' order by t.due_at nulls last limit 1))
        order by h.entered_at desc)
      from crm.deals d left join crm.sources so on so.id = d.source_id left join crm.loss_reasons lr on lr.code = d.loss_reason_code
      left join crm.deal_stage_history h on h.deal_id = d.id and h.left_at is null
      where d.pipeline_id = pl.id and d.merged_into is null and (not crm.est_prospecteur() or d.owner_user_id = auth.uid())
        and (d.close_date is null or d.close_date > current_date - 60)), '[]'::jsonb),
    'equipe', crm.equipe_active(),
    'sources', (select jsonb_agg(jsonb_build_object('id', id, 'name', name) order by name) from crm.sources where active));
end $$;

create or replace function public.lanceur_recherche(q text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare m text := crm.motif(q);
begin
  if not crm.is_team_member() then raise exception 'Réservé à l''équipe Lease Lane.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(q, ''))) < 2 then return jsonb_build_object('fiches', '[]'::jsonb, 'actions', '[]'::jsonb); end if;
  return jsonb_build_object(
    'actions', coalesce((select jsonb_agg(a) from (select jsonb_build_object('type', 'proposition', 'id', pr.id,
        'titre', case pr.operation when 'approve-formal-notice' then 'Approuver la mise en demeure de ' || coalesce(tn.full_name, '…') else 'Décider : ' || left(pr.reason, 80) end,
        'droite', initcap(pr.espace), 'lien', case pr.operation when 'approve-formal-notice' then '/juridique?d=' || n.case_id else '/operations/a-approuver' end) a
      from crm.proposals pr left join jur.notices n on pr.operation = 'approve-formal-notice' and n.id = pr.target_id left join jur.cases c on c.id = n.case_id left join public.tenants tn on tn.id = c.tenant_id
      where pr.status = 'pending' and (crm.can(pr.permission) or pr.assignee_user_id = auth.uid())
        and (lower(pr.reason) like m or lower(coalesce(tn.full_name, '')) like m or lower(coalesce(pr.source_ref, '')) like m) order by pr.created_at desc limit 3) x), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('type', 'appel', 'titre', 'Appeler ' || t.full_name, 'droite', t.phone, 'lien', 'tel:' || regexp_replace(t.phone, '[^0-9+]', '', 'g')))
        from (select full_name, phone from public.tenants where crm.can('clients.lire') and phone is not null and anonymized_at is null and lower(full_name) like m order by full_name limit 2) t), '[]'::jsonb),
    'fiches', coalesce((select jsonb_agg(f) from (
        (select jsonb_build_object('type', 'locataire', 'titre', t.full_name, 'droite', 'Locataire' || coalesce(' · ' || x.lieu, ''), 'ini', true,
            'lien', coalesce('/juridique?d=' || x.dossier, '/clients/processus')) f
           from public.tenants t left join lateral (select b.address || coalesce(' — ' || u.unit_number, '') as lieu,
              (select c.id::text from jur.cases c where c.lease_id = l.id and c.stage in ('ouvert', 'mise_en_demeure', 'tal')) as dossier
              from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where l.tenant_id = t.id order by l.status = 'active' desc, l.start_date desc limit 1) x on true
           where crm.can('clients.lire') and t.anonymized_at is null and lower(t.full_name) like m order by t.full_name limit 4)
        union all
        (select jsonb_build_object('type', 'proprietaire', 'titre', o.full_name, 'droite', 'Propriétaire' || coalesce(' · ' || o.company_name, ''), 'ini', true, 'lien', '/clients/documents')
           from public.owners o where crm.can('clients.lire') and (lower(o.full_name) like m or lower(coalesce(o.company_name, '')) like m) order by o.full_name limit 3)
        union all
        (select jsonb_build_object('type', 'dossier', 'titre', 'Dossier ' || c.numero || ' · recouvrement', 'droite', coalesce(t.full_name, '') || ' · ' || comms.montant_court(c.amount), 'icone', 'scale', 'lien', '/juridique?d=' || c.id)
           from jur.cases c left join public.tenants t on t.id = c.tenant_id where crm.can('juridique.lire') and (lower(c.numero) like m or lower(coalesce(t.full_name, '')) like m) order by c.opened_at desc limit 3)
        union all
        (select jsonb_build_object('type', 'deal', 'titre', d.title, 'droite', 'Ventes · ' || d.number, 'icone', 'trend', 'lien', '/ventes/deals/' || d.id)
           from crm.deals d where crm.can('ventes.lire') and (not crm.est_prospecteur() or d.owner_user_id = auth.uid()) and (lower(d.title) like m or lower(coalesce(d.subtitle, '')) like m or lower(d.number) like m) order by d.created_at desc limit 3)
        union all
        (select jsonb_build_object('type', 'bon', 'titre', wo.description, 'droite', 'Maintenance · ' || b.address || coalesce(' — ' || u.unit_number, ''), 'icone', 'wrench', 'lien', '/maintenance/soumissions?bt=' || wo.id)
           from public.work_orders wo left join public.units u on u.id = wo.unit_id left join public.buildings b on b.id = u.building_id
           where crm.can('maintenance.lire') and (lower(wo.description) like m or lower(coalesce(b.address, '')) like m) order by wo.created_at desc limit 3)
        union all
        (select jsonb_build_object('type', 'cession', 'titre', case a.kind when 'cession' then 'Cession · ' else 'Sous-location · ' end || a.person_name, 'droite', 'Demande ' || a.numero, 'icone', 'users', 'lien', '/clients/cessions')
           from crm.assignments a where crm.can('clients.lire') and lower(a.person_name) like m order by a.created_at desc limit 2)
      ) z), '[]'::jsonb));
end $$;

create or replace function public.lanceur_prospecteurs() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (crm.can('ventes.lire') or crm.can('operations.lire')) then raise exception 'Votre rôle ne donne pas accès aux prospecteurs.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(x order by (x ->> 'signes')::int desc, (x ->> 'appels')::int desc) from (
    select jsonb_build_object('id', cc.id, 'nom', cc.full_name, 'courriel', cc.email, 'tel', cc.phone, 'actif', coalesce(cc.active, true),
      'prospects', (select count(*) from public.prospects p where p.assigned_caller_id = cc.id and p.anonymized_at is null and p.stage not in ('signed', 'lost')),
      'appels', (select count(*) from comms.calls c where c.cold_caller_id = cc.id and c.started_at > now() - interval '30 days')
              + (select coalesce(sum((select count(*) from jsonb_array_elements(case when jsonb_typeof(p.call_history) = 'array' then p.call_history else '[]'::jsonb end) h
                   where (h ->> 'date')::timestamptz > now() - interval '30 days')), 0) from public.prospects p where p.assigned_caller_id = cc.id),
      'signes', (select count(*) from public.prospects p where p.assigned_caller_id = cc.id and p.stage = 'signed'),
      'relances', (select count(*) from public.prospects p where p.assigned_caller_id = cc.id and p.stage not in ('signed', 'lost') and p.next_followup_date <= current_date)) as x
    from public.cold_callers cc where not crm.est_prospecteur() or cc.user_id = auth.uid()) y), '[]'::jsonb);
end $$;

create or replace function public.lanceur_prospecteur(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare c public.cold_callers;
begin
  perform crm.require_aal2();
  if not crm.can('ventes.lire') then raise exception 'Votre rôle ne donne pas accès aux prospecteurs.' using errcode = 'PT403'; end if;
  select * into c from public.cold_callers where id = p_id and (not crm.est_prospecteur() or user_id = auth.uid());
  if not found then raise exception 'Prospecteur introuvable.' using errcode = 'PT404'; end if;
  return jsonb_build_object(
    'prospecteur', jsonb_build_object('id', c.id, 'nom', c.full_name, 'courriel', c.email, 'tel', c.phone, 'actif', coalesce(c.active, true), 'compte', c.user_id is not null,
      'equipe', exists (select 1 from crm.team_members tm where tm.user_id = c.user_id and tm.active and tm.removed_at is null),
      'role', (select tm.role from crm.team_members tm where tm.user_id = c.user_id and tm.active and tm.removed_at is null)),
    -- Ce qu'il voit : même règle que son portail et que la RLS (assigné ou créé par lui, non archivé)
    'prospects', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nom', p.full_name, 'entreprise', p.company_name, 'tel', p.phone, 'courriel', p.email,
        'portes', p.num_doors, 'etape', p.stage, 'relance', p.next_followup_date, 'cree_par_lui', p.created_by_caller_id = c.id and p.assigned_caller_id is distinct from c.id,
        'dernier_appel', (select max(h ->> 'date') from jsonb_array_elements(case when jsonb_typeof(p.call_history) = 'array' then p.call_history else '[]'::jsonb end) h),
        'deal_id', (select d.id from crm.deals d where d.prospect_id = p.id limit 1)) order by p.next_followup_date nulls last, p.created_at desc)
      from public.prospects p where c.id in (p.assigned_caller_id, p.created_by_caller_id) and p.archived_at is null and p.anonymized_at is null), '[]'::jsonb),
    -- À assigner : prospects actifs sans prospecteur
    'libres', coalesce((select jsonb_agg(x order by x ->> 'cree' desc) from (select jsonb_build_object('id', p.id, 'nom', p.full_name, 'entreprise', p.company_name,
        'portes', p.num_doors, 'etape', p.stage, 'source', p.lead_source, 'tel', p.phone is not null, 'cree', p.created_at) x
      from public.prospects p where p.assigned_caller_id is null and p.archived_at is null and p.anonymized_at is null
        and coalesce(p.stage, 'new') not in ('signed', 'lost') order by p.created_at desc limit 500) z), '[]'::jsonb),
    'peut_assigner', crm.can('ventes.mandats.ecrire') and not crm.est_prospecteur(),
    'peut_acces', crm.can('reglages.equipe'));
end $$;

-- « Ajouter au pipeline » depuis Prospection IA par un prospecteur : le prospect est à son nom (sinon il partait au tour de rôle de l'équipe).
create or replace function crm.decider_suggestion(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s crm.prospect_suggestions; v_prospect uuid; v_deal uuid; v_seq uuid; v_base boolean := false;
begin
  perform crm.require_aal2();
  if not crm.can('ventes.prospection.ecrire') then raise exception 'Votre rôle ne permet pas de réviser les suggestions.' using errcode = 'PT403'; end if;
  select * into s from crm.prospect_suggestions where id = (p ->> 'id')::uuid for update;
  if not found then raise exception 'Suggestion introuvable.' using errcode = 'PT404'; end if;
  if s.status <> 'pending' then raise exception 'Cette suggestion a déjà été révisée.' using errcode = 'PT409'; end if;

  if p ->> 'decision' = 'ecarter' then
    update crm.prospect_suggestions set status = 'rejected', decided_by = auth.uid(), decided_at = now(), decision_note = nullif(btrim(p ->> 'note'), '') where id = s.id;
    perform crm.journal('suggestion.rejected', 'crm.prospect_suggestions', s.id, null, jsonb_build_object('note', p ->> 'note'), 'reject-prospect-suggestion');
    return jsonb_build_object('status', 'rejected');
  end if;

  insert into public.prospects (full_name, company_name, email, phone, num_doors, notes, lead_source, stage, assigned_caller_id, created_by_caller_id)
  values (s.nom, s.entreprise, s.courriel, s.telephone, s.portes, concat_ws(' · ', s.ville, 'Source : ' || s.source_url), 'Prospection IA', 'new',
          public.auth_cold_caller_id(), public.auth_cold_caller_id())   -- ajouté par un prospecteur : à son nom (Mes prospects)
  returning id into v_prospect;
  select id into v_deal from crm.deals where prospect_id = v_prospect;
  update crm.deals set subtitle = coalesce(s.ville, subtitle) where id = v_deal;
  insert into crm.activities (deal_id, type, title, body, author_user_id)
  values (v_deal, 'creation', 'Trouvé par l’agent de prospection, approuvé par ' || crm.nom_membre(auth.uid()), concat_ws(' · ', s.raison, 'Source : ' || s.source_url), auth.uid());

  -- Base LCAP : publication bien en vue, confirmée par la personne qui révise.
  if coalesce((p ->> 'publication_confirmee')::boolean, false) and s.courriel is not null then
    insert into comms.consents (channel, address, basis, source, proof)
    values ('email', s.courriel, 'implied', 'publication_bien_en_vue',
            jsonb_build_object('source_url', s.source_url, 'extrait', s.extrait, 'confirme_par', auth.uid(), 'nom', crm.nom_membre(auth.uid()), 'le', now(), 'suggestion', s.id));
    v_base := true;
  end if;
  if coalesce((p ->> 'sequence')::boolean, false) then
    if not v_base and not exists (select 1 from comms.consents c where c.channel = 'email' and lower(c.address) = lower(s.courriel) and c.withdrawn_at is null and (c.expires_at is null or c.expires_at > now())) then
      raise exception 'Pas de base LCAP vérifiée pour ce courriel : impossible de l’ajouter à la séquence.' using errcode = 'PT422';
    end if;
    insert into comms.sequence_enrollments (sequence_code, channel, recipient, entity_type, entity_id, attempt, next_at)
    values ('prospection', 'email', s.courriel, 'crm.deals', v_deal, 0, now()) returning id into v_seq;
    perform crm.creer_tache(jsonb_build_object('title', 'Appeler ' || coalesce(s.entreprise, s.nom), 'context', 'Ventes · séquence de prospection, jour 3',
      'due_at', now() + interval '3 days', 'assignee_user_id', (select owner_user_id from crm.deals where id = v_deal), 'entity_type', 'crm.deals', 'entity_id', v_deal, 'canal', 'interface'));
    update crm.tasks set deal_id = v_deal where entity_type = 'crm.deals' and entity_id = v_deal and deal_id is null;
  end if;
  update crm.prospect_suggestions set status = 'approved', decided_by = auth.uid(), decided_at = now(), deal_id = v_deal where id = s.id;
  perform crm.journal('suggestion.approved', 'crm.prospect_suggestions', s.id, null, jsonb_build_object('deal', v_deal, 'base_lcap', v_base, 'sequence', v_seq is not null), 'approve-prospect-suggestion');
  return jsonb_build_object('status', 'approved', 'deal_id', v_deal, 'sequence', v_seq is not null);
end $$;
