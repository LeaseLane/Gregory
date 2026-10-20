-- Correctifs de la revue du 2026-10-20 (fin de bail / bail à venir, migration 20261106090000).
--
-- 1. baux_transitions ne termine plus que les baux dont la fin a été INSCRITE (fin_motif). Sans avis, un bail
--    québécois se reconduit tout seul : il ne doit jamais être fermé par la seule date de fin.
-- 2. bail_terminer : refuse une fin qui chevauche le bail à venir; efface le lien de signature de renouvellement;
--    un loyer postérieur à la fin, déjà payé en partie, est ramené au montant reçu (plus de relances);
--    l'annulation d'un bail à venir recalcule le statut du logement; renvoie l'ancienne fin pour le journal.
-- 3. Heures de nuit : bascule à 5 h 05 UTC puis loyers à 5 h 15 UTC (toujours après minuit au Québec, été comme hiver).
-- 4. Emménagement aussi pour un bail à venir; logement retiré du site dès qu'un bail à venir existe;
--    l'effacement Loi 25 protège aussi les baux renouvelés et à venir; fin_motif visible dans le suivi des renouvellements.

create or replace function public.bail_terminer(p_lease uuid, p_fin date, p_motif text, p_note text default null, p_par uuid default null)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  b record;
  v_retires int := 0;
  v_ramenes int := 0;
  pay record;
  v_immediat boolean;
begin
  select * into b from leases where id = p_lease for update;
  if b is null then raise exception 'Bail introuvable'; end if;
  if b.status = 'ended' then raise exception 'Ce bail est déjà terminé'; end if;
  if p_fin is null then raise exception 'Date de fin requise'; end if;
  if p_motif is null or p_motif not in ('resiliation', 'depart', 'non_renouvellement', 'entente', 'autre') then raise exception 'Motif invalide'; end if;

  -- Bail à venir annulé avant son début : il se termine sans avoir commencé; le logement est recalculé.
  if b.status = 'a_venir' then
    update leases set status = 'ended', end_date = least(p_fin, b.start_date), fin_motif = p_motif, fin_note = p_note,
                      fin_inscrite_le = now(), fin_inscrite_par = p_par, renewal_signature_token = null where id = p_lease;
    update units set status = 'available'
     where id = b.unit_id and not exists (select 1 from leases where unit_id = b.unit_id and status in ('active', 'renewed', 'a_venir'));
    return jsonb_build_object('ok', true, 'immediat', true, 'loyers_retires', 0, 'ancienne_fin', b.end_date, 'ancien_motif', b.fin_motif);
  end if;

  if p_fin < b.start_date then raise exception 'La date de fin (%) précède le début du bail (%)', p_fin, b.start_date; end if;
  if exists (select 1 from leases where unit_id = b.unit_id and status = 'a_venir' and start_date <= p_fin) then
    raise exception 'Le nouveau locataire arrive avant cette date : annulez d''abord son arrivée, ou choisissez une fin plus tôt.';
  end if;
  v_immediat := p_fin < date_quebec();

  update leases set end_date = p_fin, fin_motif = p_motif, fin_note = p_note, fin_inscrite_le = now(), fin_inscrite_par = p_par,
                    renewal_signature_token = null,
                    status = case when v_immediat then 'ended' else status end
   where id = p_lease;

  -- Loyers d'un mois postérieur à la fin : sans rien de reçu → retirés; payés en partie → ramenés au montant reçu.
  for pay in select id, coalesce(amount_received, 0) as recu from payments
              where lease_id = p_lease and due_date > p_fin and status in ('pending', 'late') loop
    if pay.recu > 0 then
      update payments set amount = pay.recu, status = 'paid' where id = pay.id;
      v_ramenes := v_ramenes + 1;
    else
      begin
        delete from payments where id = pay.id;
        v_retires := v_retires + 1;
      exception when foreign_key_violation then null;
      end;
    end if;
  end loop;

  if not exists (select 1 from leases where unit_id = b.unit_id and status = 'a_venir') then
    update units set status = case when v_immediat then 'available' else 'soon_available' end where id = b.unit_id;
  end if;
  if v_immediat then perform baux_transitions(b.unit_id); end if;

  return jsonb_build_object('ok', true, 'immediat', v_immediat, 'loyers_retires', v_retires, 'loyers_ramenes', v_ramenes,
                            'ancienne_fin', b.end_date, 'ancien_motif', b.fin_motif);
end;
$$;

create or replace function public.baux_transitions(p_unit uuid default null)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_jour date := date_quebec();
  v_termines int := 0;
  v_actives int := 0;
  l record;
begin
  for l in select id, unit_id from leases
            where status in ('active', 'renewed') and end_date is not null and end_date < v_jour
              -- Seulement une fin INSCRITE (bail_terminer) : au Québec, un bail sans avis se reconduit tout seul.
              and fin_motif is not null
              and (p_unit is null or unit_id = p_unit) for update loop
    update leases set status = 'ended' where id = l.id;
    v_termines := v_termines + 1;
    if not exists (select 1 from leases where unit_id = l.unit_id and status in ('active', 'renewed', 'a_venir')) then
      update units set status = 'available' where id = l.unit_id;
    end if;
  end loop;

  for l in select id, unit_id from leases
            where status = 'a_venir' and start_date <= v_jour
              and (p_unit is null or unit_id = p_unit) for update loop
    -- Un bail actif non échu bloque l'activation (cas anormal : il reste à terminer à la main).
    continue when exists (select 1 from leases where unit_id = l.unit_id and status in ('active', 'renewed'));
    update leases set status = 'active' where id = l.id;
    update units set status = 'occupied' where id = l.unit_id;
    v_actives := v_actives + 1;
  end loop;

  return jsonb_build_object('termines', v_termines, 'actives', v_actives);
end;
$$;

revoke all on function public.bail_terminer(uuid, date, text, text, uuid), public.baux_transitions(uuid) from public, anon, authenticated;

do $$ begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    if exists (select 1 from cron.job where jobname = 'baux-transitions') then perform cron.unschedule('baux-transitions'); end if;
    perform cron.schedule('baux-transitions', '5 5 * * *', 'select public.baux_transitions()');
    if exists (select 1 from cron.job where jobname = 'daily-generate-monthly-payments') then
      perform cron.unschedule('daily-generate-monthly-payments');
      perform cron.schedule('daily-generate-monthly-payments', '15 5 * * *', 'select generate_monthly_payments()');
    end if;
  end if;
end $$;

-- Emménagement : aussi quand le bail est créé « à venir » (nouveau locataire signé d'avance).
create or replace function crm.bail_cree_emmenagement() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.start_date >= current_date and new.status in ('active', 'a_venir') then perform crm.demarrer_emmenagement(new.id, auth.uid()); end if;
  return new;
end $$;

create or replace view public.site_logements_publies with (security_barrier = true) as
  select u.id, coalesce(u.marketplace_title, u.unit_type) titre, u.listing_description texte, u.titre_en, u.texte_en, u.unit_type type,
    coalesce((select l.monthly_rent from public.leases l where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1), u.rent) loyer,
    u.chambres, u.salles_de_bain, u.area_sqft superficie, u.floor etage, b.zone quartier, b.address adresse, u.latitude, u.longitude, u.inclus, u.badges,
    (select jsonb_agg(jsonb_build_object('chemin', c, 'alt', u.photo_alts ->> c)) from jsonb_array_elements_text(u.photo_urls) c) photos,
    coalesce((select l.end_date + 1 from public.leases l where l.unit_id = u.id and l.status = 'active' order by l.start_date desc limit 1), current_date) disponible_le, u.site_publie_le publie_le
  from public.units u join public.buildings b on b.id = u.building_id
  where u.site_statut = 'publie'
    and (u.status in ('available', 'soon_available') or not exists (select 1 from public.leases l where l.unit_id = u.id and l.status = 'active')
         or exists (select 1 from public.leases l where l.unit_id = u.id and l.status = 'active' and l.renewal_response = 'refused'))
    -- Un nouveau locataire est déjà signé (bail à venir) : le logement n'est plus à louer.
    and not exists (select 1 from public.leases l where l.unit_id = u.id and l.status = 'a_venir')
    and jsonb_array_length(coalesce(u.photo_urls, '[]'::jsonb)) > 0
    and not exists (select 1 from jsonb_array_elements_text(coalesce(u.photo_urls, '[]'::jsonb)) c where char_length(btrim(coalesce(u.photo_alts ->> c, ''))) < 3);

create or replace function crm.anonymiser_sujet(p_genre text, p_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_mail text; v_tel text; n int := 0; k int;
begin
  if p_genre = 'tenant' then
    select email, phone into v_mail, v_tel from public.tenants where id = p_id;
    if exists (select 1 from public.leases where tenant_id = p_id and status in ('active', 'renewed', 'a_venir')) then raise exception 'Bail actif : les renseignements nécessaires au bail ne peuvent pas être effacés.' using errcode = 'PT409'; end if;
    update public.tenants set full_name = 'Locataire anonymisé', email = null, phone = null, anonymized_at = now() where id = p_id;
    update public.tenant_notes set body = '[note effacée — demande d''effacement]' where tenant_id = p_id;
    update public.service_request_messages m set body = '[message effacé — demande d''effacement]' from public.service_requests sr where sr.id = m.service_request_id and sr.tenant_id = p_id;
    update crm.screenings set subject_name = 'Personne anonymisée', subject_email = 'anonyme@leaselane.invalid', report = null, purged_at = coalesce(purged_at, now()) where tenant_id = p_id;
  elsif p_genre = 'owner' then
    select coalesce(o.email, u.email), o.phone into v_mail, v_tel from public.owners o left join auth.users u on u.id = o.user_id where o.id = p_id;
    if exists (select 1 from public.buildings where owner_id = p_id) then raise exception 'Mandat en cours : retirez d’abord les immeubles.' using errcode = 'PT409'; end if;
    update public.owners set full_name = 'Propriétaire anonymisé', phone = null, company_name = null, email = null, mailing_address = null where id = p_id;
  elsif p_genre = 'worker' then
    select email, phone into v_mail, v_tel from public.workers where id = p_id;
    update public.workers set name = 'Fournisseur anonymisé', phone = null, email = null, company_name = null, payout_email = null, active = false where id = p_id;
    update public.worker_messages set corps = '[message effacé]' where worker_id = p_id;
  elsif p_genre = 'prospect' then
    select email, phone into v_mail, v_tel from public.prospects where id = p_id;
    update public.prospects set full_name = 'Prospect anonymisé', email = null, phone = null, company_name = null, notes = null, call_history = '[]'::jsonb, anonymized_at = now() where id = p_id;
    update public.inquiries set full_name = 'Anonymisé', email = 'anonymise@portail.local', phone = null, message = null, anonymized_at = now() where lower(email) = lower(v_mail);
  else raise exception 'Genre de personne inconnu.' using errcode = 'PT422';
  end if;
  get diagnostics k = row_count; n := n + k;
  -- adresses dans les fiches de contact et dans la file des envois (le consentement et son retrait restent comme preuve)
  if v_mail is not null then
    update comms.outbox set recipient = 'anonyme@leaselane.invalid', vars = '{}'::jsonb where lower(recipient) = lower(v_mail) and status <> 'queued';
    delete from comms.outbox where lower(recipient) = lower(v_mail) and status = 'queued';
  end if;
  return jsonb_build_object('genre', p_genre, 'id', p_id);
end $$;

create or replace view public.lease_renewal_tracking with (security_invoker = true) as
 select id as lease_id, unit_id, tenant_id, start_date, end_date, monthly_rent, renewal_notice_sent_at, renewal_notice_type, renewal_response,
    renewal_signed, renewal_deadline_missed, relocation_prep_needed,
    case when (end_date - start_date) >= 365 then 'long'::text else 'court'::text end as term_type,
    (case when (end_date - start_date) >= 365 then (end_date - '6 mons'::interval) else (end_date - '2 mons'::interval) end)::date as notice_window_start,
    (case when (end_date - start_date) >= 365 then (end_date - '3 mons'::interval) else (end_date - '1 mon'::interval) end)::date as notice_window_end,
    (end_date - current_date) as days_until_end,
    fin_motif
   from public.leases l
  where status = 'active' and end_date is not null;
