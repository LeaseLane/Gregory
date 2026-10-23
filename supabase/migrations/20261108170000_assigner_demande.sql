-- Opérations · Assigner la demande (maquette e07) : depuis « À traiter », choisir le fournisseur (le mieux placé en tête),
-- la plage d'intervention et l'avis de 24 h au locataire. Crée le bon de travail assigné et planifié en une fois
-- (lanceur_bon_creer puis lanceur_bon_planifier : mêmes vérifications, même journal).

-- Premier créneau de 2 h qui laisse 24 h d'avis (sauf urgence) : jour ouvrable, entre 8 h et 17 h, heure de Québec.
create or replace function crm.premier_creneau(p_urgent boolean) returns timestamptz language plpgsql stable set search_path = '' as $$
declare d timestamp := date_trunc('hour', (now() at time zone 'America/Toronto')) + interval '1 hour';
begin
  if not p_urgent then d := d + interval '24 hours'; end if;
  loop
    if extract(isodow from d) <= 5 and extract(hour from d) between 8 and 15 then return d at time zone 'America/Toronto'; end if;
    d := case when extract(hour from d) >= 15 then date_trunc('day', d) + interval '1 day 8 hours' else d + interval '1 hour' end;
  end loop;
end $$;

create or replace function public.lanceur_assigner_contexte(p_demande uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare sr public.service_requests; v_urg boolean; v_ville text; v_metier text;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.lire') then raise exception 'Votre rôle ne donne pas accès à la maintenance.' using errcode = 'PT403'; end if;
  select * into sr from public.service_requests where id = p_demande;
  if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
  v_urg := coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique') or coalesce(sr.safety_override, false) or coalesce(sr.tenant_urgency, '') = 'urgence';
  select coalesce(b.city, 'Québec') into v_ville from public.units u join public.buildings b on b.id = u.building_id where u.id = sr.unit_id;
  v_metier := lower(coalesce(sr.ai_recommended_trade, sr.ai_category, sr.ai_subcategory, ''));
  return jsonb_build_object(
    'numero', crm.numero_demande(sr.id, sr.created_at), 'titre', crm.titre_demande(sr), 'urgent', v_urg,
    'urgence', case when v_urg then 'urgente' else coalesce(nullif(sr.ai_urgency, ''), 'normale') end,
    'logement', (select b.address || ' — ' || u.unit_number from public.units u join public.buildings b on b.id = u.building_id where u.id = sr.unit_id),
    'locataire', (select jsonb_build_object('nom', t.full_name, 'telephone', t.phone is not null) from public.tenants t where t.id = sr.tenant_id),
    'budget', round(coalesce(sr.ai_cost_max, sr.ai_estimated_cost, 250)),
    'creneau', crm.premier_creneau(v_urg),
    'fournisseurs', coalesce((select jsonb_agg(jsonb_build_object('id', z.id, 'nom', z.nom, 'note', z.note, 'avis', z.avis, 'disponibilite', z.dispo, 'specialites', z.sp) order by z.score desc, z.nom)
      from (select w.id, coalesce(w.company_name, w.name) nom, n.note, n.avis, w.availability_status dispo, coalesce(nullif(w.specialties, '{}'), array[w.specialty]) sp,
              (case when v_metier <> '' and exists (select 1 from unnest(coalesce(nullif(w.specialties, '{}'), array[w.specialty])) s where s is not null
                      and (v_metier ilike '%' || left(lower(s), 5) || '%' or lower(s) ilike '%' || left(v_metier, 5) || '%')) then 100 else 0 end)
              + (case when v_ville = any (coalesce(w.zones, '{}')) then 20 else 0 end) + (case when v_urg and coalesce(w.handles_urgent, false) then 30 else 0 end)
              + coalesce(n.note, 3) * 4 + (case w.availability_status when 'maintenant' then 8 when 'aujourdhui' then 6 when 'semaine' then 3 else -50 end) score
            from public.workers w
            cross join lateral (select round(avg(r.stars), 1) note, count(*) avis from public.worker_ratings r where r.worker_id = w.id) n
            where coalesce(w.active, true) and crm.blocage_fournisseur(w.id, current_date) is null
            order by score desc, nom limit 4) z), '[]'::jsonb),
    'peut_ecrire', crm.can('maintenance.ecrire'));
end $$;

create or replace function public.lanceur_assigner_demande(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare sr public.service_requests; v_bon jsonb; v_rdv timestamptz := (p ->> 'debut')::timestamptz; v_fin timestamptz := (p ->> 'fin')::timestamptz;
  v_tel text; v_nom text; v_four text;
begin
  perform crm.require_aal2();
  if not crm.can('maintenance.ecrire') then raise exception 'Votre rôle ne permet pas d’assigner une demande.' using errcode = 'PT403'; end if;
  select * into sr from public.service_requests where id = (p ->> 'demande')::uuid for update;
  if not found then raise exception 'Demande introuvable.' using errcode = 'PT404'; end if;
  if exists (select 1 from public.work_orders w where w.service_request_id = sr.id and w.status <> 'cancelled') then
    raise exception 'Cette demande a déjà un bon de travail.' using errcode = 'PT409'; end if;
  if v_rdv is null or v_fin is null or v_fin <= v_rdv then raise exception 'Choisissez une plage d’intervention.' using errcode = 'PT422'; end if;
  v_bon := public.lanceur_bon_creer(jsonb_build_object('service_request_id', sr.id, 'travaux', crm.titre_demande(sr), 'mode', 'assigner', 'worker_id', p ->> 'worker_id',
    'budget', coalesce(nullif(p ->> 'budget', ''), round(coalesce(sr.ai_cost_max, sr.ai_estimated_cost, 250))::text), 'rendez_vous', v_rdv,
    'urgent', coalesce(sr.ai_urgency, '') in ('urgent', 'urgence', 'critique') or coalesce(sr.safety_override, false)));
  perform public.lanceur_bon_planifier(jsonb_build_object('id', v_bon ->> 'id', 'rendez_vous', v_rdv,
    'acces', 'Plage ' || to_char(v_rdv at time zone 'America/Toronto', 'FMHH24 "h"') || ' à ' || to_char(v_fin at time zone 'America/Toronto', 'FMHH24 "h"')));
  -- Avis au locataire : notification de portail (déclencheur notif_locataire), et SMS LOC-03 seulement si le gabarit est actif.
  if coalesce((p ->> 'aviser')::boolean, true) then
    select t.phone, t.full_name into v_tel, v_nom from public.tenants t where t.id = sr.tenant_id;
    select coalesce(company_name, name) into v_four from public.workers where id = (p ->> 'worker_id')::uuid;
    if v_tel is not null and exists (select 1 from comms.email_templates where code = 'LOC-03' and active) then
      perform comms.enqueue(jsonb_build_object('template_code', 'LOC-03', 'channel', 'sms', 'recipient', crm.normaliser_tel(v_tel), 'idempotency_key', 'avis-entree:' || (v_bon ->> 'id'),
        'vars', jsonb_build_object('fournisseur', v_four, 'demande', crm.numero_demande(sr.id, sr.created_at),
          'quand', to_char(v_rdv at time zone 'America/Toronto', 'DD/MM') || ' entre ' || to_char(v_rdv at time zone 'America/Toronto', 'FMHH24 "h"') || ' et ' || to_char(v_fin at time zone 'America/Toronto', 'FMHH24 "h"')),
        'entity_type', 'public.work_orders', 'entity_id', v_bon ->> 'id', 'canal_journal', 'interface'));
    end if;
  end if;
  return v_bon;
end $$;

revoke all on function crm.premier_creneau(boolean) from public, anon, authenticated;
revoke all on function public.lanceur_assigner_contexte(uuid), public.lanceur_assigner_demande(jsonb) from public, anon;
grant execute on function public.lanceur_assigner_contexte(uuid), public.lanceur_assigner_demande(jsonb) to authenticated;
