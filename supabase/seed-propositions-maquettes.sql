-- ============================================================
-- Propositions de l'univers des maquettes (spec T1 § 5 « Seed fictif ») — PRÉPRODUCTION / DÉMO SEULEMENT
-- ============================================================
-- 5 propositions : Investissements Roy → « Qualifié » (courriel de 9 h 12), suivi après l'appel de
-- Mathieu Roy, une déjà appliquée, une rejetée « trop_tot », une expirée « version ». Tout est fictif.
-- Prérequis : seed-univers-maquettes.sql (comptes de rôle). Rejouable : chaque passage remet la démo à zéro.
-- Usage : workflow « SQL en préproduction », fichier supabase/seed-propositions-maquettes.sql
-- ============================================================


do $$
declare
  v_lp uuid := (select id from auth.users where email = 'equipe-prospection@leaselane.test');
  v_roy uuid; v_mroy uuid; v_lach uuid; v_beau uuid; v_cap uuid; v_id uuid;
begin
  if exists (select 1 from public.owners where full_name not like 'Préprod%' and full_name <> 'Marie-Josée Bérubé') then
    raise exception 'Base avec de vrais propriétaires : refusé (préproduction ou démo seulement).';
  end if;
  if v_lp is null then raise exception 'Lancer d''abord seed-univers-maquettes.sql.'; end if;
  -- Rejouable : on remet la démonstration à son état de départ (propositions et prospects fictifs seulement;
  -- le journal, immuable, garde la trace des décisions précédentes).
  delete from crm.proposals where idempotency_key like 'maquette:%';
  delete from public.prospects where email in ('paul.roy@investissements-roy.test', 'mathieu.roy@courriel.test',
    'denise@immeubles-lachance.test', 'karim.beaulieu@courriel.test', 'helene@gestion-caouette.test');

  insert into public.prospects (full_name, company_name, email, phone, num_doors, avg_rent, stage, interest_level, lead_source, next_action)
  values ('Paul Roy', 'Investissements Roy', 'paul.roy@investissements-roy.test', '418 555-0710', 6, 1250, 'contacted', 'tiede', 'site_web', 'Envoyer l''offre de gestion')
  returning id into v_roy;
  insert into public.prospects (full_name, email, phone, num_doors, avg_rent, stage, interest_level, lead_source)
  values ('Mathieu Roy', 'mathieu.roy@courriel.test', '418 555-0720', 3, 1100, 'contacted', 'froid', 'prospection')
  returning id into v_mroy;
  insert into public.prospects (full_name, company_name, email, num_doors, avg_rent, stage, lead_source)
  values ('Denise Lachance', 'Immeubles Lachance', 'denise@immeubles-lachance.test', 12, 1180, 'interested', 'reference')
  returning id into v_lach;
  insert into public.prospects (full_name, email, num_doors, avg_rent, stage, lead_source)
  values ('Karim Beaulieu', 'karim.beaulieu@courriel.test', 4, 1050, 'new', 'site_web')
  returning id into v_beau;
  insert into public.prospects (full_name, company_name, email, num_doors, avg_rent, stage, lead_source)
  values ('Hélène Caouette', 'Gestion Caouette', 'helene@gestion-caouette.test', 8, 1300, 'contacted', 'site_web')
  returning id into v_cap;

  -- 1. En attente : Investissements Roy → « Qualifié » (Cléo, courriel de 9 h 12)
  perform crm.create_proposal(jsonb_build_object('agent', 'cleo', 'operation', 'move-prospect-stage', 'target_id', v_roy,
    'after', jsonb_build_object('stage', 'interested'), 'confidence', 87, 'source_type', 'courriel', 'source_ref', 'Courriel reçu à 9 h 12',
    'reason', 'Paul Roy confirme vouloir une offre pour ses 6 portes et propose un appel jeudi : intention claire.',
    'source_excerpt', 'Bonjour, suite à votre visite, on aimerait recevoir votre offre de gestion pour nos 6 logements. Seriez-vous disponible jeudi pour en discuter?',
    'idempotency_key', 'maquette:roy-qualifie'));

  -- 2. En attente : suivi après l'appel de Mathieu Roy (analyse d'appel)
  perform crm.create_proposal(jsonb_build_object('agent', 'analyse_appel', 'operation', 'update-prospect-followup', 'target_id', v_mroy,
    'after', jsonb_build_object('interest_level', 'chaud', 'next_followup_date', ((now() at time zone 'America/Toronto')::date + 6)::text,
                                'next_action', 'Envoyer l''estimation des frais pour 3 portes'),
    'confidence', 74, 'source_type', 'appel', 'source_ref', 'Appel de Laurence P.',
    'reason', 'Pendant l''appel, M. Roy demande une estimation et veut une réponse avant la fin du mois.',
    'source_excerpt', '« Si vous m''envoyez vos frais pour mes trois logements, je décide d''ici la fin du mois. »',
    'idempotency_key', 'maquette:mroy-suivi'));

  -- 3. En attente : Karim Beaulieu → « Contacté » (Cléo, conversation)
  perform crm.create_proposal(jsonb_build_object('agent', 'cleo', 'operation', 'move-prospect-stage', 'target_id', v_beau,
    'after', jsonb_build_object('stage', 'contacted'), 'confidence', 68, 'source_type', 'conversation', 'source_ref', 'Conversation avec Cléo sur le site',
    'reason', 'M. Beaulieu a laissé ses coordonnées et demandé à être rappelé au sujet de ses 4 logements.',
    'source_excerpt', 'Pouvez-vous me rappeler demain? J''ai un 4 logements à Charlesbourg.',
    'idempotency_key', 'maquette:beaulieu-contacte'));

  -- 4. Appliquée : Immeubles Lachance → « Offre envoyée »
  v_id := (crm.create_proposal(jsonb_build_object('agent', 'cleo', 'operation', 'move-prospect-stage', 'target_id', v_lach,
    'after', jsonb_build_object('stage', 'proposal_sent'), 'confidence', 92, 'source_type', 'courriel', 'source_ref', 'Courriel envoyé hier',
    'reason', 'L''offre de gestion a été envoyée à Mme Lachance hier, pièce jointe comprise.',
    'source_excerpt', 'Veuillez trouver ci-joint notre offre de gestion pour vos 12 logements.',
    'idempotency_key', 'maquette:lachance-offre'))).id;
  update public.prospects set stage = 'proposal_sent' where id = v_lach;
  update crm.proposals set status = 'applied', decided_by = v_lp, decided_at = now() - interval '1 day', applied_at = now() - interval '1 day' where id = v_id;

  -- 5. Rejetée « trop_tot » : Gestion Caouette → « Converti »
  v_id := (crm.create_proposal(jsonb_build_object('agent', 'cleo', 'operation', 'move-prospect-stage', 'target_id', v_cap,
    'after', jsonb_build_object('stage', 'signed'), 'confidence', 55, 'source_type', 'courriel', 'source_ref', 'Courriel reçu lundi',
    'reason', 'Mme Caouette écrit « on y va » : Cléo y lit une signature.',
    'source_excerpt', 'C''est bon pour nous, on y va dès que mon associé aura relu le contrat.',
    'idempotency_key', 'maquette:caouette-signe'))).id;
  update crm.proposals set status = 'rejected', decided_by = v_lp, decided_at = now() - interval '2 days', rejection_reason_code = 'trop_tot',
    decision_note = 'Le contrat n''est pas encore signé : on attend l''associé.' where id = v_id;

  -- 6. Expirée « version » : ancienne proposition sur Mathieu Roy, fiche changée depuis
  v_id := (crm.create_proposal(jsonb_build_object('agent', 'analyse_appel', 'operation', 'update-prospect-followup', 'target_id', v_mroy,
    'after', jsonb_build_object('next_action', 'Rappeler la semaine prochaine'), 'confidence', 60, 'source_type', 'appel', 'source_ref', 'Premier appel',
    'reason', 'Premier contact : M. Roy veut réfléchir avant de donner suite.',
    'source_excerpt', '« Rappelez-moi la semaine prochaine, je n''ai pas eu le temps d''y penser. »',
    'idempotency_key', 'maquette:mroy-ancien'))).id;
  update crm.proposals set status = 'expired', apply_error = 'version', created_at = now() - interval '5 days' where id = v_id;

  raise notice 'Propositions des maquettes créées : 3 en attente, 1 appliquée, 1 rejetée, 1 expirée.';
end $$;
