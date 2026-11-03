-- Préférences d'avis des portails appliquées aux envois (2026-11-03).
-- Les choix du Profil (portal_preferences.notifications : { catégorie : { courriel, sms } }) étaient enregistrés sans être lus.
-- comms.enqueue les applique maintenant : un envoi d'une catégorie coupée pour ce canal est inscrit « cancelled »
-- (raison : préférence du destinataire) au lieu de partir; l'information reste dans le portail.
-- « essential » règle la fenêtre d'envoi, pas le choix de la personne : seule la catégorie compte. Toujours envoyés : les urgences
-- (PRO-09) et tout ce qui n'a pas de catégorie ci-dessous (invitations, avis d'entrée, renouvellement, documents à signer, cessions, Loi 25, rappels de loyer
-- en retard, recouvrement). Seuls les choix enregistrés comptent : sans choix, l'envoi part comme avant.

-- Catégorie du Profil pour chaque gabarit (par code : une nouvelle version d'un gabarit garde sa catégorie).
create or replace function comms.categorie_avis(p_code text) returns text language sql immutable set search_path = '' as $$
  select case p_code
    -- locataire : paiements, demandes, messages, avis
    when 'LOC-02' then 'demandes' when 'LOC-04' then 'demandes'
    when 'LOC-09' then 'paiements' when 'LOC-21' then 'paiements'
    when 'LOC-20' then 'avis'
    when 'MSG-01' then 'messages'
    -- propriétaire : accords, finances, travaux, locataires, mandat
    when 'PRO-03' then 'accords' when 'PRO-04' then 'accords' when 'PRO-12' then 'accords'
    when 'PRO-05' then 'finances' when 'PRO-06' then 'finances'
    when 'PRO-07' then 'locataires' when 'PRO-08' then 'locataires'
    when 'PRO-13' then 'mandat'
  end
$$;

-- Vrai si une personne inscrite à un portail, jointe à cette coordonnée, a coupé cette catégorie pour ce canal.
-- Courriel : compte dont c'est l'adresse. SMS : propriétaire ou locataire dont c'est le numéro (10 derniers chiffres).
create or replace function comms.avis_refuse(p_dest text, p_canal text, p_cat text) returns boolean
language sql stable security definer set search_path = '' as $$
  with num as (select right(regexp_replace(p_dest, '\D', '', 'g'), 10) as n),
  qui as (
    select u.id as user_id from auth.users u where p_canal = 'email' and lower(u.email) = lower(btrim(p_dest))
    union select o.user_id from public.owners o, num where p_canal = 'sms' and o.user_id is not null and length(num.n) = 10
      and right(regexp_replace(coalesce(o.phone, ''), '\D', '', 'g'), 10) = num.n
    union select t.user_id from public.tenants t, num where p_canal = 'sms' and t.user_id is not null and length(num.n) = 10
      and right(regexp_replace(coalesce(t.phone, ''), '\D', '', 'g'), 10) = num.n
  )
  select coalesce(bool_or((pp.notifications -> p_cat ->> case p_canal when 'sms' then 'sms' else 'courriel' end) = 'false'), false)
    from qui join public.portal_preferences pp on pp.user_id = qui.user_id
$$;
revoke all on function comms.avis_refuse(text, text, text) from public;

create or replace function comms.enqueue(p jsonb) returns comms.outbox
language plpgsql security definer set search_path = '' as $$
declare t comms.email_templates; o comms.outbox; v_canal text; v_cat text; v_coupe boolean := false;
begin
  select * into o from comms.outbox where idempotency_key = p ->> 'idempotency_key';
  if found then return o; end if;
  if coalesce(p ->> 'idempotency_key', '') = '' then raise exception 'idempotency_key requise.' using errcode = 'PT422'; end if;
  select * into t from comms.email_templates
   where code = p ->> 'template_code' and active and locale = coalesce(p ->> 'locale', 'fr')
   order by version desc limit 1;
  if not found then raise exception 'Gabarit inconnu ou inactif : %.', p ->> 'template_code' using errcode = 'PT422'; end if;
  v_canal := coalesce(p ->> 'channel', case when t.channel = 'sms' then 'sms' else 'email' end);
  if v_canal = 'sms' and t.sms_text is null then raise exception 'Le gabarit % n''a pas de version SMS.', t.code using errcode = 'PT422'; end if;
  if coalesce(btrim(p ->> 'recipient'), '') = '' then raise exception 'Destinataire requis.' using errcode = 'PT422'; end if;
  -- Préférences d'avis du Profil (portails) : catégorie coupée pour ce canal → inscrit, jamais envoyé.
  v_cat := comms.categorie_avis(t.code);
  v_coupe := v_cat is not null and comms.avis_refuse(btrim(p ->> 'recipient'), v_canal, v_cat);
  insert into comms.outbox (idempotency_key, template_code, channel, recipient, vars, scheduled_for, entity_type, entity_id, sequence_enrollment_id, status, last_error)
  values (p ->> 'idempotency_key', t.code, v_canal, btrim(p ->> 'recipient'), coalesce(p -> 'vars', '{}'::jsonb),
          comms.prochaine_fenetre(coalesce((p ->> 'at')::timestamptz, now()), t.window_start, t.window_end, t.business_days_only, t.essential),
          p ->> 'entity_type', nullif(p ->> 'entity_id', '')::uuid, nullif(p ->> 'sequence_enrollment_id', '')::uuid,
          case when v_coupe then 'cancelled' else 'queued' end, case when v_coupe then 'préférence du destinataire (' || v_cat || ')' end)
  returning * into o;
  perform crm.journal(case when v_coupe then 'comms.skipped_preference' else 'comms.queued' end, 'comms.outbox', o.id, null,
    jsonb_build_object('gabarit', o.template_code, 'canal', o.channel, 'prevu', o.scheduled_for) || case when v_coupe then jsonb_build_object('categorie', v_cat) else '{}'::jsonb end,
    'enqueue', coalesce(p ->> 'canal_journal', 'cron'), null, 'system');
  return o;
end $$;
