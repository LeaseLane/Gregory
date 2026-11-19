-- Revue de code du 19 nov. 2026 (portail propriétaire a2f258c + « Prêt pour le 1er » e088ab5) : corrections.
--  C1/C2  company_settings : plus d'écriture directe par un compte connecté (seul le serveur écrit), lecture limitée aux colonnes
--         sans numéro de compte; garde en base : comptes, adresse Interac et interrupteur des prélèvements ne changent que par
--         fiducie_comptes_maj (qui alerte les administrateurs), quel que soit le chemin (ops-api, fonction, SQL).
--  I1/I2  les écrans et le journal ne gardent plus les numéros complets (entreprise et propriétaires).
--  I4     clé d'unicité des courriels de sécurité : aléatoire (deux changements dans la même seconde = deux courriels).
--  I5     l'adresse Interac passe par fiducie_comptes_maj : alerte EQP-15 comme les comptes.
--  I6     accueil locataire : un prélèvement suspendu n'est plus annoncé.
--  I7     PRO-15 part au propriétaire pour toute saisie (portail ou équipe), pas seulement depuis le portail.
--  M4/M5  prélèvements éteints tenus par des déclencheurs : aucune adhésion ni aucun lot, quel que soit le chemin.
--  M6     « Relevé importé » et « File d'examen » ne regardent que le compte en fidéicommis.

-- ── C1/C2 ──
revoke insert, update, delete, truncate on public.company_settings from anon, authenticated;
revoke select on public.company_settings from anon, authenticated;
grant select (id, legal_name, address, phone_main, phone_emergency, gst_number, qst_number, gst_rate, qst_rate, neq, fiducie_interac_courriel, updated_at)
  on public.company_settings to authenticated;

create or replace function public.company_settings_comptes_garde() returns trigger language plpgsql set search_path = '' as $$
begin
  if coalesce(current_setting('fiducie.comptes_maj', true), '') = '1' then return new; end if;
  if (new.fiducie_institution, new.fiducie_transit, new.fiducie_compte, new.exploitation_nom, new.exploitation_institution, new.exploitation_transit, new.exploitation_compte,
      new.bmo_originateur, new.bmo_centre, new.fiducie_interac_courriel, new.prelevements_actifs)
     is distinct from
     (old.fiducie_institution, old.fiducie_transit, old.fiducie_compte, old.exploitation_nom, old.exploitation_institution, old.exploitation_transit, old.exploitation_compte,
      old.bmo_originateur, old.bmo_centre, old.fiducie_interac_courriel, old.prelevements_actifs) then
    raise exception 'Comptes bancaires de LeaseLane : à modifier dans Finances, Fidéicommis, Prêt pour le 1er (alerte aux administrateurs).' using errcode = 'PT403';
  end if;
  return new;
end $$;
drop trigger if exists company_settings_comptes_garde on public.company_settings;
create trigger company_settings_comptes_garde before update on public.company_settings for each row execute function public.company_settings_comptes_garde();

-- fiducie_comptes_maj : groupe « interac » en plus, garde levée pendant la saisie, une alerte par changement (clé aléatoire).
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.fiducie_comptes_maj(jsonb,uuid)'::regprocedure);
  if position('fiducie.comptes_maj' in d) > 0 then return; end if;
  n := replace(d, '  select * into c from public.company_settings where id = true for update;',
    '  select * into c from public.company_settings where id = true for update;
  perform set_config(''fiducie.comptes_maj'', ''1'', true);   -- company_settings_comptes_garde : seule cette fonction change les comptes
  if p ? ''interac'' then
    v_nom := nullif(lower(btrim(coalesce(p ->> ''interac'', ''''))), '''');
    if v_nom is not null and v_nom !~ ''^[^\s@]+@[^\s@]+\.[^\s@]+$'' then raise exception ''Adresse Interac invalide.'' using errcode = ''PT422''; end if;
    if v_nom is distinct from c.fiducie_interac_courriel then
      update public.company_settings set fiducie_interac_courriel = v_nom, updated_at = now() where id = true;
      quoi := quoi || (''Adresse Interac des loyers : '' || coalesce(v_nom, ''retirée'')); end if;
  end if;');
  n := replace(n, '''EQP-15:'' || a.email || '':'' || extract(epoch from clock_timestamp())::bigint', '''EQP-15:'' || a.email || '':'' || gen_random_uuid()');
  n := replace(n, '  return public.fiducie_preparation();
end', '  perform set_config(''fiducie.comptes_maj'', '''', true);
  return public.fiducie_preparation() || jsonb_build_object(''change'', cardinality(quoi) > 0);
end');
  if position('gen_random_uuid' in n) = 0 or position('''interac''' in n) = 0 or position('''change''' in n) = 0 then raise exception 'fiducie_comptes_maj : ancre introuvable'; end if;
  execute n;
end $$;

-- ── I1/I2 : numéros complets hors des écrans et du journal ──
do $$
declare d text; n text;
  sans text := ' - array[''fiducie_institution'', ''fiducie_transit'', ''fiducie_compte'', ''exploitation_institution'', ''exploitation_transit'', ''exploitation_compte'', ''exploitation_nom'', ''bmo_originateur'', ''bmo_centre'']';
begin
  d := pg_get_functiondef('public.lanceur_entreprise()'::regprocedure);
  if position('fiducie_compte' in d) = 0 then
    n := replace(d, 'to_jsonb(cs) - ''id''', 'to_jsonb(cs) - ''id''' || sans);
    if n = d then raise exception 'lanceur_entreprise : ancre introuvable'; end if;
    execute n;
  end if;
  d := pg_get_functiondef('public.lanceur_entreprise_maj(jsonb)'::regprocedure);
  if position('fiducie_compte' in d) = 0 then
    n := replace(d, 'select to_jsonb(cs) into avant', 'select to_jsonb(cs)' || sans || ' into avant');
    if n = d then raise exception 'lanceur_entreprise_maj : ancre introuvable'; end if;
    execute n;
  end if;
  d := pg_get_functiondef('public.lanceur_proprietaire_maj(jsonb)'::regprocedure);
  if position('versement_compte' in d) = 0 then
    n := replace(d, 'to_jsonb(o) - ''user_id''', 'to_jsonb(o) - ''user_id'' - array[''versement_institution'', ''versement_transit'', ''versement_compte'', ''versement_nom_compte'']');
    if n = d then raise exception 'lanceur_proprietaire_maj : ancre introuvable'; end if;
    execute n;
  end if;
end $$;

-- ── I7 : PRO-15 depuis la fonction commune (portail et équipe); le portail ne l'envoie plus lui-même ──
create or replace function public.fiducie_coordonnees_maj(p_owner uuid, p_nom text, p_institution text, p_transit text, p_compte text, p_par uuid) returns void
language plpgsql security definer set search_path to 'public' as $$
declare o owners; v_mail text; n int;
begin
  if p_institution !~ '^\d{3}$' or p_transit !~ '^\d{5}$' or p_compte !~ '^\d{5,12}$' then raise exception 'Coordonnées invalides : institution 3 chiffres, transit 5 chiffres, compte 5 à 12 chiffres'; end if;
  select * into o from owners where id = p_owner for update;
  if o.id is null then raise exception 'Propriétaire introuvable'; end if;
  perform set_config('fiducie.coordonnees_maj', '1', true);   -- la garde owners_versement_garde laisse passer cette saisie (auteur connu)
  update owners set versement_nom_compte = nullif(btrim(p_nom), ''), versement_institution = p_institution, versement_transit = p_transit, versement_compte = p_compte,
         versement_modifie_le = now(), versement_modifie_par = p_par, versement_verifie_le = null, versement_verifie_par = null, versement_verification_note = null
   where id = p_owner;
  perform set_config('fiducie.coordonnees_maj', '', true);
  if (p_institution, p_transit, p_compte) is distinct from (o.versement_institution, o.versement_transit, o.versement_compte) then
    v_mail := coalesce(nullif(btrim(o.email), ''), (select u.email from auth.users u where u.id = o.user_id));
    if v_mail is not null then
      perform comms.enqueue(jsonb_build_object('template_code', 'PRO-15', 'channel', 'email', 'recipient', v_mail, 'entity_type', 'public.owners', 'entity_id', o.id,
        'idempotency_key', 'PRO-15:' || o.id || ':' || gen_random_uuid(), 'canal_journal', 'portail',
        'vars', jsonb_build_object('prenom', split_part(o.full_name, ' ', 1), 'compte_fin', right(p_compte, 3), 'quand', to_char(now() at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI'))));
    end if;
  end if;
end $$;
revoke all on function public.fiducie_coordonnees_maj(uuid, text, text, text, text, uuid) from public, anon, authenticated;

create or replace function public.portail_proprietaire_versement_maj(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.owners; v_inst text := regexp_replace(coalesce(p ->> 'institution', ''), '\D', '', 'g');
  v_tr text := regexp_replace(coalesce(p ->> 'transit', ''), '\D', '', 'g'); v_co text := regexp_replace(coalesce(p ->> 'compte', ''), '\D', '', 'g');
  v_nom text := nullif(btrim(coalesce(p ->> 'nom_compte', '')), '');
begin
  perform crm.exiger_niveau_portail(true); perform crm.proprio_peut_ecrire(true);
  select * into o from public.owners where id = public.auth_owner_id() for update;
  if o.id is null then raise exception 'Espace propriétaire introuvable.' using errcode = 'PT403'; end if;
  if v_nom is null or char_length(v_nom) < 2 then raise exception 'Indiquez le nom du titulaire du compte.' using errcode = 'PT422'; end if;
  if v_inst !~ '^\d{3}$' or v_tr !~ '^\d{5}$' or v_co !~ '^\d{5,12}$' then
    raise exception 'Coordonnées invalides : institution 3 chiffres, transit 5 chiffres, compte 5 à 12 chiffres (voir un spécimen de chèque).' using errcode = 'PT422'; end if;
  if (v_inst, v_tr, v_co, v_nom) is not distinct from (o.versement_institution, o.versement_transit, o.versement_compte, o.versement_nom_compte) then
    return public.portail_proprietaire_versement() || jsonb_build_object('change', false); end if;   -- rien de changé : pas de remise à zéro ni de courriel
  perform public.fiducie_coordonnees_maj(o.id, left(v_nom, 120), v_inst, v_tr, v_co, auth.uid());   -- envoie PRO-15 si le compte change
  perform crm.journal('owner.payout_account_updated', 'public.owners', o.id, jsonb_build_object('compte_fin', right(o.versement_compte, 3)),
    jsonb_build_object('compte_fin', right(v_co, 3), 'institution', v_inst), 'update-payout-account', 'portail');
  return public.portail_proprietaire_versement() || jsonb_build_object('change', true);
end $$;

-- ── I6 : accueil locataire, prélèvement suspendu ──
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.portail_locataire_accueil()'::regprocedure);
  if position('prelevements_offerts' in d) > 0 then return; end if;
  n := replace(d, '''prelevement'', exists (select 1 from public.tenant_pad_authorizations', '''prelevement'', crm.prelevements_offerts() and exists (select 1 from public.tenant_pad_authorizations');
  if n = d then raise exception 'portail_locataire_accueil : ancre introuvable'; end if;
  execute n;
end $$;

-- ── M4/M5 : prélèvements éteints, tenus par déclencheurs ──
create or replace function crm.prelevements_garde() returns trigger language plpgsql set search_path = '' as $$
begin
  if crm.prelevements_offerts() then return new; end if;
  if tg_table_name = 'prelevement_lots' then
    if tg_op = 'INSERT' or (new.statut is distinct from old.statut and new.statut not in ('annule')) then
      raise exception 'Prélèvements désactivés : BMO ne les a pas encore activés.' using errcode = 'PT409'; end if;
  elsif new.status = 'active' and new.revoked_at is null
        and (tg_op = 'INSERT' or old.status is distinct from 'active' or old.revoked_at is not null
             or (new.institution, new.transit, new.compte) is distinct from (old.institution, old.transit, old.compte)) then
    raise exception 'Le prélèvement automatique n’est pas encore offert : BMO ne l’a pas activé.' using errcode = 'PT409';
  end if;
  return new;
end $$;
drop trigger if exists prelevements_garde on public.tenant_pad_authorizations;
create trigger prelevements_garde before insert or update on public.tenant_pad_authorizations for each row execute function crm.prelevements_garde();
drop trigger if exists prelevements_garde on public.prelevement_lots;
create trigger prelevements_garde before insert or update on public.prelevement_lots for each row execute function crm.prelevements_garde();

-- ── M6 ──
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.fiducie_preparation()'::regprocedure);
  if position('where compte = ''fiducie''' in d) > 0 then return; end if;
  n := replace(d, 'select max(created_at) into dern from public.bank_transactions;', 'select max(created_at) into dern from public.bank_transactions where compte = ''fiducie'';');
  n := replace(n, 'from public.bank_transactions where amount > 0 and match_status in', 'from public.bank_transactions where compte = ''fiducie'' and amount > 0 and match_status in');
  if position('bank_transactions where compte = ''fiducie'';' in n) = 0 or position('compte = ''fiducie'' and amount > 0' in n) = 0 then raise exception 'fiducie_preparation : ancre introuvable'; end if;
  execute n;
end $$;
