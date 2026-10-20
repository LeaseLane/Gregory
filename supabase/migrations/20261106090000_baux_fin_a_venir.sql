-- Baux : fin de bail (résiliation, départ, non-renouvellement, entente) et bail « à venir ».
--
-- Demande de Greg (oct. 2026) : dans l'admin, l'équipe doit pouvoir inscrire une fin de bail, un
-- non-renouvellement et l'arrivée d'un nouveau locataire. Le propriétaire reste en lecture seule.
--
--   • Un nouveau locataire signé pendant que l'ancien bail court encore (ex. arrivée le 1er juillet)
--     reçoit un bail « a_venir » : un seul bail actif par logement reste la règle (index existant),
--     et on permet au plus un bail à venir par logement.
--   • public.bail_terminer(...) inscrit la fin : date, motif, note, qui. Si la date est passée, le bail
--     est terminé tout de suite; sinon il reste actif jusqu'à cette date et le logement passe « à louer
--     bientôt ». Les loyers déjà générés APRÈS la date de fin, sans rien de reçu, sont retirés.
--   • public.baux_transitions() (chaque nuit, avant la génération des loyers de 5 h UTC) termine les
--     baux échus et active les baux à venir dont la date est arrivée; le statut du logement suit.
-- generate_monthly_payments ne facture déjà que les baux actifs/renouvelés, jusqu'à end_date.

alter table public.leases drop constraint if exists leases_status_check;
alter table public.leases add constraint leases_status_check check (status in ('active', 'renewed', 'ended', 'a_venir'));

alter table public.leases
  add column if not exists fin_motif text,
  add column if not exists fin_note text,
  add column if not exists fin_inscrite_le timestamptz,
  add column if not exists fin_inscrite_par uuid references public.users(id);

do $$ begin
  alter table public.leases add constraint leases_fin_motif_check
    check (fin_motif is null or fin_motif in ('resiliation', 'depart', 'non_renouvellement', 'entente', 'autre'));
exception when duplicate_object then null; end $$;

create unique index if not exists leases_unite_bail_a_venir_unique on public.leases (unit_id) where status = 'a_venir';

-- Date du jour au Québec (les dates de bail sont des dates locales).
create or replace function public.date_quebec() returns date language sql stable as $$
  select (now() at time zone 'America/Toronto')::date $$;

create or replace function public.bail_terminer(p_lease uuid, p_fin date, p_motif text, p_note text default null, p_par uuid default null)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  b record;
  v_retires int := 0;
  pay record;
  v_immediat boolean;
begin
  select * into b from leases where id = p_lease for update;
  if b is null then raise exception 'Bail introuvable'; end if;
  if b.status = 'ended' then raise exception 'Ce bail est déjà terminé'; end if;
  if p_fin is null then raise exception 'Date de fin requise'; end if;
  if p_motif is null or p_motif not in ('resiliation', 'depart', 'non_renouvellement', 'entente', 'autre') then raise exception 'Motif invalide'; end if;

  -- Bail à venir annulé avant son début : il se termine sans avoir commencé.
  if b.status = 'a_venir' then
    update leases set status = 'ended', end_date = least(p_fin, b.start_date), fin_motif = p_motif, fin_note = p_note,
                      fin_inscrite_le = now(), fin_inscrite_par = p_par where id = p_lease;
    return jsonb_build_object('ok', true, 'immediat', true, 'loyers_retires', 0);
  end if;

  if p_fin < b.start_date then raise exception 'La date de fin (%) précède le début du bail (%)', p_fin, b.start_date; end if;
  v_immediat := p_fin < date_quebec();

  update leases set end_date = p_fin, fin_motif = p_motif, fin_note = p_note, fin_inscrite_le = now(), fin_inscrite_par = p_par,
                    status = case when v_immediat then 'ended' else status end
   where id = p_lease;

  -- Loyers générés d'avance pour un mois postérieur à la fin, sans montant reçu : retirés.
  -- Un loyer déjà lié ailleurs (dépôt bancaire, anomalie…) est laissé tel quel.
  for pay in select id from payments where lease_id = p_lease and due_date > p_fin and status in ('pending', 'late') and coalesce(amount_received, 0) = 0 loop
    begin
      delete from payments where id = pay.id;
      v_retires := v_retires + 1;
    exception when foreign_key_violation then null;
    end;
  end loop;

  -- Logement : libre si la fin est passée, « à louer bientôt » sinon (sauf si un nouveau bail est déjà prévu).
  if not exists (select 1 from leases where unit_id = b.unit_id and status = 'a_venir') then
    update units set status = case when v_immediat then 'available' else 'soon_available' end where id = b.unit_id;
  end if;
  if v_immediat then perform baux_transitions(b.unit_id); end if;

  return jsonb_build_object('ok', true, 'immediat', v_immediat, 'loyers_retires', v_retires);
end;
$$;

-- Transitions de la nuit (ou d'un seul logement) : baux échus → terminés, baux à venir arrivés → actifs.
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

revoke all on function public.bail_terminer(uuid, date, text, text, uuid), public.baux_transitions(uuid), public.date_quebec() from public, anon, authenticated;

do $$ begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    if exists (select 1 from cron.job where jobname = 'baux-transitions') then perform cron.unschedule('baux-transitions'); end if;
    perform cron.schedule('baux-transitions', '50 4 * * *', 'select public.baux_transitions()');
  end if;
end $$;
