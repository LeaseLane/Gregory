-- Prêt pour le 1er décembre (19 nov. 2026, point 6 du plan des paiements).
--  1. Prélèvements automatiques : BMO les a reportés le 17 nov. Interrupteur company_settings.prelevements_actifs, faux par défaut :
--     le portail locataire n'offre plus l'option, la base refuse toute nouvelle adhésion et tout lot de prélèvements.
--     Un accord déjà signé reste lisible et annulable. ponytail: on rallume par SQL quand BMO confirme (pas d'écran pour un geste unique).
--  2. Comptes de LeaseLane (fidéicommis, exploitation, ID d'émetteur BMO) : saisis dans l'admin par ops-api seulement (service_role).
--     Chaque modification écrit au journal (3 derniers chiffres) et envoie EQP-15 à tous les administrateurs actifs :
--     un compte d'exploitation détourné ne passe pas en silence avant les honoraires du 15.
--  3. fiducie_preparation() : la liste verte/rouge « Prêt pour le 1er » (bloquant, attention, info), lue par ops-api.

alter table public.company_settings add column if not exists prelevements_actifs boolean not null default false;

create or replace function crm.prelevements_offerts() returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select prelevements_actifs from public.company_settings where id = true), false);
$$;

-- Garde dans les fonctions existantes, insérée sans recopier leur corps; échoue si l'ancre a changé.
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.portail_locataire_dpa_signer(jsonb)'::regprocedure);
  n := replace(d, 'if coalesce((p ->> ''accepte'')::boolean, false) is not true then',
    'if not crm.prelevements_offerts() then raise exception ''Le prélèvement automatique n’est pas encore offert. Payez par virement Interac.'' using errcode = ''PT409''; end if;
  if coalesce((p ->> ''accepte'')::boolean, false) is not true then');
  if n = d and position('prelevements_offerts' in d) = 0 then raise exception 'portail_locataire_dpa_signer : ancre introuvable'; end if;
  execute n;

  d := pg_get_functiondef('public.lanceur_prelevement_creer(date)'::regprocedure);
  n := replace(d, 'using errcode = ''PT403''; end if;',
    'using errcode = ''PT403''; end if;
  if not crm.prelevements_offerts() then raise exception ''Prélèvements désactivés : BMO ne les a pas encore activés.'' using errcode = ''PT409''; end if;');
  if n = d and position('prelevements_offerts' in d) = 0 then raise exception 'lanceur_prelevement_creer : ancre introuvable'; end if;
  execute n;

  d := pg_get_functiondef('public.portail_locataire_paiements()'::regprocedure);
  n := replace(d, '''interac'', (select c.courriel_interac', '''prelevement_offert'', crm.prelevements_offerts(), ''interac'', (select c.courriel_interac');
  if n = d and position('prelevements_offerts' in d) = 0 then raise exception 'portail_locataire_paiements : ancre introuvable'; end if;
  execute n;
end $$;

-- ── Courriel aux administrateurs ──
insert into comms.email_templates (code, audience, name, sms_text, contenu, subject, preheader, variables, trigger_event, send_mode, essential, lcap_category, unsubscribe_required, active)
select * from (values ('EQP-15', 'Équipe', 'Comptes bancaires de LeaseLane modifiés', null::text,
 '{"subject": "Comptes bancaires de LeaseLane modifiés", "pre": "{quoi}", "label": "Fidéicommis", "icon": "lock", "eyebrow": "Sécurité", "title": "Un compte bancaire de LeaseLane a changé", "intro": "{qui} a modifié les comptes bancaires dans l’admin, le {quand}.", "blocks": [["kv", {"rows": [["Modification", "{quoi}"]]}], ["notice", {"k": "warn", "ic": "alert", "title": "Ce n’est pas prévu ?", "t": "Avant le prochain versement du 15, vérifiez le compte dans Finances, Fidéicommis, et retirez l’accès de la personne au besoin."}]], "sign": {"ini": "LL", "name": "Lease Lane", "role": "Alerte automatique"}, "foot": {"reason": "Vous recevez ce courriel parce que vous êtes administrateur de Lease Lane."}, "spec": {"trigger": "Comptes de LeaseLane modifiés (fidéicommis, exploitation, émetteur BMO)", "send": "Automatique", "when": "Immédiat", "lcap": "Transactionnel"}}'::jsonb,
 'Comptes bancaires de LeaseLane modifiés', '{quoi}', array['qui', 'quoi', 'quand']::text[], 'Comptes de LeaseLane modifiés dans l’admin', 'auto', true, 'transactional', false, true))
 v(code, audience, name, sms_text, contenu, subject, preheader, variables, trigger_event, send_mode, essential, lcap_category, unsubscribe_required, active)
where not exists (select 1 from comms.email_templates where code = 'EQP-15');

-- ── Saisie des comptes de LeaseLane ──
-- p : {"fiducie": {institution, transit, compte}, "exploitation": {nom, institution, transit, compte}, "bmo": {originateur, centre}}; chaque groupe est facultatif.
create or replace function public.fiducie_comptes_maj(p jsonb, p_par uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.company_settings; g jsonb; v_i text; v_t text; v_c text; v_nom text; v_o text; v_ce text; quoi text[] := '{}'; qui text; a record;
begin
  if p_par is null then raise exception 'Auteur requis.' using errcode = 'PT422'; end if;
  select * into c from public.company_settings where id = true for update;
  if c.id is null then raise exception 'Réglages de l’entreprise introuvables.' using errcode = 'PT404'; end if;

  begin   -- company_settings_exploitation_ok : exploitation ≠ fidéicommis
  foreach v_nom in array array['fiducie', 'exploitation'] loop
    g := p -> v_nom; continue when g is null;
    v_i := regexp_replace(coalesce(g ->> 'institution', ''), '\D', '', 'g'); v_t := regexp_replace(coalesce(g ->> 'transit', ''), '\D', '', 'g');
    v_c := regexp_replace(coalesce(g ->> 'compte', ''), '\D', '', 'g');
    if v_i !~ '^\d{3}$' or v_t !~ '^\d{5}$' or v_c !~ '^\d{5,12}$' then
      raise exception 'Compte % : institution 3 chiffres, transit 5 chiffres, compte 5 à 12 chiffres.', case v_nom when 'fiducie' then 'en fidéicommis' else 'd’exploitation' end using errcode = 'PT422'; end if;
    if v_nom = 'fiducie' then
      if (v_i, v_t, v_c) is distinct from (c.fiducie_institution, c.fiducie_transit, c.fiducie_compte) then
        update public.company_settings set fiducie_institution = v_i, fiducie_transit = v_t, fiducie_compte = v_c, updated_at = now() where id = true;
        quoi := quoi || ('Compte en fidéicommis : se terminant par ' || right(v_c, 3)); end if;
    else
      if (v_i, v_t, v_c, nullif(btrim(g ->> 'nom'), '')) is distinct from (c.exploitation_institution, c.exploitation_transit, c.exploitation_compte, c.exploitation_nom) then
        update public.company_settings set exploitation_institution = v_i, exploitation_transit = v_t, exploitation_compte = v_c,
          exploitation_nom = left(nullif(btrim(g ->> 'nom'), ''), 30), updated_at = now() where id = true;   -- la contrainte refuse le même compte que le fidéicommis
        quoi := quoi || ('Compte d’exploitation : se terminant par ' || right(v_c, 3)); end if;
    end if;
  end loop;
  exception when check_violation then
    raise exception 'Le compte d’exploitation doit être différent du compte en fidéicommis.' using errcode = 'PT422';
  end;

  g := p -> 'bmo';
  if g is not null then
    v_o := upper(btrim(coalesce(g ->> 'originateur', ''))); v_ce := regexp_replace(coalesce(g ->> 'centre', ''), '\D', '', 'g');
    if v_o !~ '^[A-Z0-9]{1,10}$' or v_ce !~ '^\d{5}$' then
      raise exception 'BMO : ID d’émetteur de 1 à 10 lettres ou chiffres, centre de traitement de 5 chiffres.' using errcode = 'PT422'; end if;
    if (v_o, v_ce) is distinct from (c.bmo_originateur, c.bmo_centre) then
      update public.company_settings set bmo_originateur = v_o, bmo_centre = v_ce, updated_at = now() where id = true;
      quoi := quoi || ('Émetteur BMO : ' || v_o || ', centre ' || v_ce); end if;
  end if;

  if cardinality(quoi) > 0 then
    perform crm.journal('company.bank_accounts_updated', 'public.company_settings', null, null, jsonb_build_object('par', p_par, 'changements', to_jsonb(quoi)), 'update-bank-accounts', 'interface');
    qui := coalesce((select display_name from crm.team_members where user_id = p_par), (select email from auth.users where id = p_par), 'Un administrateur');
    for a in select distinct u.email from crm.team_members m join auth.users u on u.id = m.user_id
              where m.role = 'admin' and m.active and m.removed_at is null and u.email is not null loop
      perform comms.enqueue(jsonb_build_object('template_code', 'EQP-15', 'channel', 'email', 'recipient', a.email, 'entity_type', 'public.company_settings',
        'idempotency_key', 'EQP-15:' || a.email || ':' || extract(epoch from clock_timestamp())::bigint, 'canal_journal', 'interface',
        'vars', jsonb_build_object('qui', qui, 'quoi', array_to_string(quoi, ' · '), 'quand', to_char(now() at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI'))));
    end loop;
  end if;
  return public.fiducie_preparation();
end $$;

-- ── Liste « Prêt pour le 1er » ──
create or replace function public.fiducie_preparation() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare c public.company_settings; n int; noms text; dern timestamptz; l jsonb := '[]';
begin
  select * into c from public.company_settings where id = true;
  l := l || jsonb_build_object('code', 'fiducie', 'titre', 'Compte en fidéicommis', 'etat', case when c.fiducie_compte is not null and c.fiducie_transit is not null and c.fiducie_institution is not null then 'ok' else 'bloquant' end,
    'detail', case when c.fiducie_compte is not null then 'Se terminant par ' || right(c.fiducie_compte, 3) else 'Inscrire les numéros (spécimen de chèque du compte en fidéicommis).' end);
  l := l || jsonb_build_object('code', 'interac', 'titre', 'Adresse Interac des loyers', 'etat', case when c.fiducie_interac_courriel is not null then 'ok' else 'bloquant' end,
    'detail', coalesce(c.fiducie_interac_courriel, 'Vide : le portail dit aux locataires de payer leur propriétaire.'));
  l := l || jsonb_build_object('code', 'exploitation', 'titre', 'Compte d’exploitation (honoraires)', 'etat', case when c.exploitation_compte is not null then 'ok' else 'bloquant' end,
    'detail', case when c.exploitation_compte is not null then 'Se terminant par ' || right(c.exploitation_compte, 3) else 'Sans lui, les honoraires du 15 ne peuvent pas être virés.' end);
  l := l || jsonb_build_object('code', 'sva', 'titre', 'Fichier de versements BMO (SVA)', 'etat', case when c.bmo_originateur is not null and c.bmo_centre is not null then 'ok' else 'attention' end,
    'detail', case when c.bmo_originateur is not null and c.bmo_centre is not null then 'Émetteur ' || c.bmo_originateur || ', centre ' || c.bmo_centre || '. Fichier d’essai 0000 à faire accepter par BMO.'
                   else 'ID d’émetteur et centre manquants : les versements du 15 se feront à la main dans BMO.' end);

  select count(*) into n from public.leases l join public.units u on u.id = l.unit_id where l.status = 'active' and u.reference_paiement is null;
  l := l || jsonb_build_object('code', 'references', 'titre', 'Références de paiement des logements', 'etat', case when n = 0 then 'ok' else 'bloquant' end,
    'detail', case when n = 0 then 'Chaque bail actif a sa référence.' else n || ' bail(s) actif(s) sans référence : leurs virements ne s’imputeront pas.' end);

  select count(*), string_agg(full_name, ', ' order by full_name) filter (where rang <= 5) || case when count(*) > 5 then ' et ' || (count(*) - 5) || ' autre(s)' else '' end into n, noms from (
    select x0.*, row_number() over (order by full_name) rang from (
    select distinct o.id, o.full_name from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id join public.owners o on o.id = b.owner_id
     where l.status = 'active' and not (o.versement_compte is not null and o.versement_verifie_le is not null and o.versement_verifie_le >= o.versement_modifie_le)) x0) x;
  l := l || jsonb_build_object('code', 'proprietaires', 'titre', 'Comptes de versement des propriétaires', 'etat', case when n = 0 then 'ok' else 'attention' end,
    'detail', case when n = 0 then 'Tous vérifiés par rappel.' else n || ' à inscrire ou à vérifier : ' || noms || '. Ils seront sautés au lot du 15.' end);

  select max(created_at) into dern from public.bank_transactions;
  l := l || jsonb_build_object('code', 'releve', 'titre', 'Relevé BMO importé', 'etat', case when dern > now() - interval '7 days' then 'ok' else 'attention' end,
    'detail', case when dern is null then 'Aucun relevé importé : les virements ne sont pas encore imputés.' else 'Dernier import le ' || to_char(dern at time zone 'America/Toronto', 'YYYY-MM-DD') end);

  select (select count(*) from public.bank_transactions where amount > 0 and match_status in ('unmatched', 'suggested'))
       + (select count(*) from public.fiducie_attentes where statut in ('en_attente', 'a_rembourser')) into n;
  l := l || jsonb_build_object('code', 'examen', 'titre', 'File d’examen', 'etat', case when n = 0 then 'ok' else 'attention' end,
    'detail', case when n = 0 then 'Rien à décider.' else n || ' dépôt(s) ou excédent(s) à décider.' end);

  l := l || jsonb_build_object('code', 'prelevements', 'titre', 'Prélèvements automatiques', 'etat', case when c.prelevements_actifs then 'ok' else 'info' end,
    'detail', case when c.prelevements_actifs then 'Offerts aux locataires.' else 'Reportés par BMO : l’option est masquée aux locataires.' end);
  l := l || jsonb_build_object('code', 'carte', 'titre', 'Paiement par carte (Moneris)', 'etat', 'info', 'detail', 'Pas encore branché : en attente de la confirmation écrite de Moneris.');

  return jsonb_build_object('liste', l, 'pret', not exists (select 1 from jsonb_array_elements(l) e where e ->> 'etat' = 'bloquant'),
    'comptes', jsonb_build_object(
      'fiducie', jsonb_build_object('institution', c.fiducie_institution, 'transit', c.fiducie_transit, 'fin', right(c.fiducie_compte, 3)),
      'exploitation', jsonb_build_object('nom', c.exploitation_nom, 'institution', c.exploitation_institution, 'transit', c.exploitation_transit, 'fin', right(c.exploitation_compte, 3)),
      'bmo', jsonb_build_object('originateur', c.bmo_originateur, 'centre', c.bmo_centre)));
end $$;

-- ops-api (service_role) seulement; les nouvelles fonctions héritent d'un grant à authenticated : le retirer.
revoke all on function public.fiducie_comptes_maj(jsonb, uuid), public.fiducie_preparation() from public, anon, authenticated;
grant execute on function public.fiducie_comptes_maj(jsonb, uuid), public.fiducie_preparation() to service_role;
revoke all on function crm.prelevements_offerts() from public, anon;
grant execute on function crm.prelevements_offerts() to authenticated, service_role;
