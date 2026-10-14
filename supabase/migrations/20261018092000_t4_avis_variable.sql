-- T4 · Avis LOC-10 : la variable « t » masquait l'alias de la table des locataires (record non assigné).
create or replace function crm.envoyer_avis_renouvellement(p_process uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare pr crm.processes; l public.leases; v_loc record; o comms.outbox; v_rep jsonb := config.parametre_legal('renewal_response'); f daterange; v_lien text;
  mois text[] := array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
begin
  perform crm.require_aal2();
  if not crm.can('clients.ecrire') then raise exception 'Votre rôle ne permet pas d’envoyer l’avis.' using errcode = 'PT403'; end if;
  select * into pr from crm.processes where id = p_process and status = 'active' for update;
  if not found then raise exception 'Processus introuvable ou fermé.' using errcode = 'PT404'; end if;
  if pr.team_approved_at is null or pr.owner_approved_at is null then raise exception 'L’avis exige l’approbation de l’équipe et du propriétaire.' using errcode = 'PT422'; end if;
  if pr.notice_sent_at is not null then raise exception 'L’avis est déjà parti.' using errcode = 'PT409'; end if;
  select * into l from public.leases where id = pr.lease_id;
  f := crm.fenetre_avis(l.start_date, l.end_date);
  if f is null or v_rep is null then raise exception 'Paramètres légaux non validés.' using errcode = 'PT422'; end if;
  if current_date > upper(f) - 1 then raise exception 'La fenêtre d’avis est dépassée (fin le %).', upper(f) - 1 using errcode = 'PT422'; end if;
  select tn.full_name, tn.email, b.address || coalesce(' — ' || u.unit_number, '') as adresse into v_loc
    from public.tenants tn, public.units u join public.buildings b on b.id = u.building_id where tn.id = l.tenant_id and u.id = l.unit_id;
  if coalesce(v_loc.email, '') = '' then raise exception 'Aucun courriel pour ce locataire : remettez l’avis en main propre ou par la poste.' using errcode = 'PT422'; end if;
  o := comms.enqueue(jsonb_build_object('template_code', 'LOC-10', 'channel', 'email', 'recipient', v_loc.email, 'entity_type', 'crm.processes', 'entity_id', pr.id, 'canal_journal', 'interface',
    'idempotency_key', 'loc10:' || pr.id,
    'vars', jsonb_build_object('formule', 'Bonjour ' || split_part(v_loc.full_name, ' ', 1), 'adresse_logement', v_loc.adresse,
      'date_fin_bail', extract(day from l.end_date)::int || case when extract(day from l.end_date) = 1 then 'er' else '' end || ' ' || mois[extract(month from l.end_date)::int] || ' ' || extract(year from l.end_date),
      'date_renouvellement', extract(day from l.end_date + 1)::int || case when extract(day from l.end_date + 1) = 1 then 'er' else '' end || ' ' || mois[extract(month from l.end_date + 1)::int] || ' ' || extract(year from l.end_date + 1),
      'duree', (pr.data ->> 'duree_mois') || ' mois',
      'loyer_ligne', comms.montant_court((pr.data ->> 'nouveau_loyer')::numeric) || case when pr.data ->> 'type' = 'augmentation' then ' (actuel : ' || comms.montant_court((pr.data ->> 'loyer_actuel')::numeric) || ')' else ' (inchangé)' end,
      'autres_conditions', pr.data ->> 'autres_conditions', 'delai_reponse', case when (v_rep ->> 'mois')::int = 1 then 'un mois' else (v_rep ->> 'mois') || ' mois' end,
      'lien_reponse', 'https://app.leaselane.ca/?p=locataire', 'gestionnaire', crm.nom_membre(auth.uid()),
      'initiales_gestionnaire', upper(left(split_part(crm.nom_membre(auth.uid()), ' ', 1), 1) || left(split_part(crm.nom_membre(auth.uid()), ' ', 2), 1)))));
  update crm.processes set step = 3, notice_outbox_id = o.id, notice_sent_at = now(), due_at = now() + make_interval(months => (v_rep ->> 'mois')::int) where id = pr.id;
  update public.leases set renewal_notice_sent_at = now(), renewal_notice_type = case when pr.data ->> 'type' = 'augmentation' then 'augmentation' else 'renouvellement_meme_conditions' end,
    renewal_notice_amount = (pr.data ->> 'nouveau_loyer')::numeric where id = l.id;
  insert into crm.process_events (process_id, step, action, by_user) values (pr.id, 3, 'avis LOC-10 mis en file', auth.uid());
  -- Relance avant l'échéance : tâche pour la personne qui a envoyé l'avis, 7 jours avant la fin du délai de réponse.
  perform crm.creer_tache(jsonb_build_object('title', 'Relancer ' || split_part(v_loc.full_name, ' ', 1) || ' : réponse à l’avis de renouvellement', 'context', 'Clients · renouvellement · ' || v_loc.adresse,
    'due_at', now() + make_interval(months => (v_rep ->> 'mois')::int) - interval '7 days', 'assignee_user_id', auth.uid(), 'canal', 'interface'));
  update crm.tasks set process_id = pr.id where id = (select id from crm.tasks where created_by = auth.uid() and process_id is null order by created_at desc limit 1);
  perform crm.journal('renewal.notice_sent', 'crm.processes', pr.id, null, jsonb_build_object('outbox', o.id, 'prevu', o.scheduled_for), 'send-renewal-notice');
  return jsonb_build_object('outbox_id', o.id, 'scheduled_for', o.scheduled_for);
end $$;
