-- Portail propriétaire · compte de versement (19 nov. 2026, versements du 15).
-- Le propriétaire titulaire inscrit lui-même le compte où recevoir ses versements. Règles :
--  - double authentification exigée (crm.exiger_niveau_portail(true)), titulaire seulement (pas un copropriétaire ni la comptabilité);
--  - la saisie passe par fiducie_coordonnees_maj : vérification remise à zéro, aucun versement tant qu'un membre de l'équipe n'a pas
--    rappelé le propriétaire au numéro déjà au dossier (fiducie_coordonnees_verifier : une autre personne que l'auteur);
--  - un courriel part aussitôt à l'adresse du propriétaire (« si ce n'est pas vous… ») : un compte piraté ne détourne pas un versement en silence;
--  - le portail ne relit jamais le numéro complet : 3 derniers chiffres seulement. Le journal ne garde que ces 3 chiffres (Loi 25).

insert into comms.email_templates (code, audience, name, sms_text, contenu, subject, preheader, variables, trigger_event, send_mode, essential, lcap_category, unsubscribe_required, active)
select * from (values ('PRO-15', 'Propriétaires', 'Compte de versement modifié', null::text,
 '{"subject": "Votre compte de versement a été modifié", "pre": "Compte se terminant par {compte_fin}. Si ce n’est pas vous, écrivez-nous tout de suite.", "label": "Espace propriétaire", "icon": "lock", "eyebrow": "Sécurité", "title": "{prenom}, votre compte de versement a changé", "intro": "Le compte où nous versons vos revenus le 15 vient d’être modifié depuis votre espace propriétaire.", "blocks": [["kv", {"rows": [["Nouveau compte", "se terminant par {compte_fin}"], ["Modifié le", "{quand}"]]}], ["notice", {"k": "info", "ic": "lock", "title": "Aucun versement avant notre appel", "t": "Avant le prochain versement, un membre de l’équipe vous appellera au numéro déjà à votre dossier pour confirmer ce changement."}], ["notice", {"k": "warn", "ic": "alert", "title": "Ce n’est pas vous ?", "t": "Répondez à ce courriel tout de suite : aucun versement ne partira vers ce compte, et nous sécuriserons votre accès."}]], "sign": {"ini": "LL", "name": "L’équipe Lease Lane", "role": "Lease Lane"}, "foot": {"reason": "Vous recevez ce courriel parce que le compte de versement de votre espace propriétaire Lease Lane a été modifié."}, "spec": {"trigger": "Compte de versement modifié dans le portail", "send": "Automatique", "when": "Immédiat", "lcap": "Transactionnel"}}'::jsonb,
 'Votre compte de versement a été modifié', 'Compte se terminant par {compte_fin}. Si ce n’est pas vous, écrivez-nous tout de suite.',
 array['compte_fin', 'prenom', 'quand']::text[], 'Compte de versement modifié dans le portail', 'auto', true, 'transactional', false, true))
 v(code, audience, name, sms_text, contenu, subject, preheader, variables, trigger_event, send_mode, essential, lcap_category, unsubscribe_required, active)
where not exists (select 1 from comms.email_templates where code = 'PRO-15');

create or replace function public.portail_proprietaire_versement() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare o public.owners;
begin
  perform crm.exiger_niveau_portail(true);
  select * into o from public.owners where id = public.auth_owner_id();
  if o.id is null then raise exception 'Espace propriétaire introuvable.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    'nom_compte', o.versement_nom_compte, 'institution', o.versement_institution, 'transit', o.versement_transit,
    'compte_fin', right(o.versement_compte, 3),
    'statut', case when o.versement_compte is null then 'aucun'
                   when o.versement_verifie_le is not null and o.versement_verifie_le >= o.versement_modifie_le then 'verifie' else 'a_verifier' end,
    'modifie_le', o.versement_modifie_le,
    'titulaire', crm.acces_proprio() = 'proprietaire');
end $$;

create or replace function public.portail_proprietaire_versement_maj(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.owners; v_inst text := regexp_replace(coalesce(p ->> 'institution', ''), '\D', '', 'g');
  v_tr text := regexp_replace(coalesce(p ->> 'transit', ''), '\D', '', 'g'); v_co text := regexp_replace(coalesce(p ->> 'compte', ''), '\D', '', 'g');
  v_nom text := nullif(btrim(coalesce(p ->> 'nom_compte', '')), ''); v_mail text;
begin
  perform crm.exiger_niveau_portail(true); perform crm.proprio_peut_ecrire(true);
  select * into o from public.owners where id = public.auth_owner_id() for update;
  if o.id is null then raise exception 'Espace propriétaire introuvable.' using errcode = 'PT403'; end if;
  if v_nom is null or char_length(v_nom) < 2 then raise exception 'Indiquez le nom du titulaire du compte.' using errcode = 'PT422'; end if;
  if v_inst !~ '^\d{3}$' or v_tr !~ '^\d{5}$' or v_co !~ '^\d{5,12}$' then
    raise exception 'Coordonnées invalides : institution 3 chiffres, transit 5 chiffres, compte 5 à 12 chiffres (voir un spécimen de chèque).' using errcode = 'PT422'; end if;
  if (v_inst, v_tr, v_co, v_nom) is not distinct from (o.versement_institution, o.versement_transit, o.versement_compte, o.versement_nom_compte) then
    return public.portail_proprietaire_versement(); end if;   -- rien de changé : pas de remise à zéro ni de courriel
  perform public.fiducie_coordonnees_maj(o.id, left(v_nom, 120), v_inst, v_tr, v_co, auth.uid());
  perform crm.journal('owner.payout_account_updated', 'public.owners', o.id, jsonb_build_object('compte_fin', right(o.versement_compte, 3)),
    jsonb_build_object('compte_fin', right(v_co, 3), 'institution', v_inst), 'update-payout-account', 'portail');
  v_mail := coalesce(nullif(btrim(o.email), ''), (select u.email from auth.users u where u.id = o.user_id));
  if v_mail is not null then
    perform comms.enqueue(jsonb_build_object('template_code', 'PRO-15', 'channel', 'email', 'recipient', v_mail, 'entity_type', 'public.owners', 'entity_id', o.id,
      'idempotency_key', 'PRO-15:' || o.id || ':' || extract(epoch from clock_timestamp())::bigint,
      'vars', jsonb_build_object('prenom', split_part(o.full_name, ' ', 1), 'compte_fin', right(v_co, 3),
                                 'quand', to_char(now() at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI')),
      'canal_journal', 'portail'));
  end if;
  return public.portail_proprietaire_versement();
end $$;

revoke all on function public.portail_proprietaire_versement(), public.portail_proprietaire_versement_maj(jsonb) from public, anon;
grant execute on function public.portail_proprietaire_versement(), public.portail_proprietaire_versement_maj(jsonb) to authenticated;
