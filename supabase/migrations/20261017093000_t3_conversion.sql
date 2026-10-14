-- T3 · Convertir en client (maquette e15). Ce que la conversion fait AUJOURD'HUI :
--   1. crée le client propriétaire (public.owners, sans compte de connexion) et le relie au deal, au prospect et au contact;
--   2. passe le deal à « Converti » (historique, journal; le prospect suit : stage = signed, converted_owner_id);
--   3. pour chaque étape suivante laissée active (processus d'accueil — T4, mandat eZsign — T6, invitation au portail),
--      crée une tâche liée au deal pour le responsable, en attendant que ces étapes soient automatisées.
-- Invariant : déjà converti → 409.

alter table crm.deals add column if not exists converted_owner_id uuid references public.owners(id);
create index if not exists deals_converted_owner_idx on crm.deals (converted_owner_id);
alter table crm.contacts drop constraint if exists contacts_owner_fk;
alter table crm.contacts add constraint contacts_owner_fk foreign key (owner_id) references public.owners(id) on delete set null;
create index if not exists contacts_owner_idx on crm.contacts (owner_id);

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

  insert into public.owners (full_name, phone, company_name, management_rate)
  values (coalesce(c.full_name, d.title), c.phones_e164[1], case when d.subtitle is not null then d.title end, 6.00)
  returning id into v_owner;
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

create or replace function public.lanceur_convertir_deal(p jsonb) returns jsonb
language sql security definer set search_path = '' as $$ select crm.convert_deal(p) $$;
revoke all on function crm.convert_deal(jsonb) from public, anon, authenticated;
grant execute on function crm.convert_deal(jsonb) to service_role;
revoke all on function public.lanceur_convertir_deal(jsonb) from public, anon;
grant execute on function public.lanceur_convertir_deal(jsonb) to authenticated;
