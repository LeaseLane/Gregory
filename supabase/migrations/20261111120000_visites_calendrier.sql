-- Visites en calendrier (Grégory, 2026-11-04) : une visite = un créneau de 15 minutes; une « visite libre » (portes ouvertes) bloque
-- une plage plus longue (3 h par défaut, de 30 min à 12 h) pendant laquelle les visiteurs passent sans heure précise.
-- Règle en base (pas seulement à l'écran) : dans un même logement, aucune visite active (proposée ou confirmée) ne chevauche une autre
-- visite active, libre ou non. Une visite refusée, annulée, faite, sans présence ou « autre moment proposé » ne bloque plus rien.
-- Les visites existantes ne sont pas revérifiées : seules une nouvelle visite, une heure ou un statut modifiés le sont.

alter table public.visits add column if not exists kind text not null default 'visite';
do $$ begin alter table public.visits add constraint visits_kind_check check (kind in ('visite', 'visite_libre'));
exception when duplicate_object then null; end $$;
alter table public.visits add column if not exists ends_at timestamptz;
update public.visits set ends_at = proposed_at + interval '15 minutes' where ends_at is null;
-- Une visite libre n'a pas de visiteur nommé; une visite ordinaire garde nom et courriel obligatoires.
alter table public.visits alter column prospect_name drop not null, alter column prospect_email drop not null;
do $$ begin alter table public.visits add constraint visits_visiteur_requis check (kind = 'visite_libre' or (prospect_name is not null and prospect_email is not null));
exception when duplicate_object then null; end $$;
create index if not exists visits_unit_debut_idx on public.visits (unit_id, proposed_at);

create or replace function public.visits_plage() returns trigger language plpgsql set search_path = '' as $$
declare v public.visits;
begin
  if new.kind = 'visite' then
    new.ends_at := new.proposed_at + interval '15 minutes';
  else
    new.ends_at := coalesce(new.ends_at, new.proposed_at + interval '3 hours');
    if new.ends_at < new.proposed_at + interval '30 minutes' or new.ends_at > new.proposed_at + interval '12 hours' then
      raise exception 'Une visite libre dure de 30 minutes à 12 heures.' using errcode = 'PT422';
    end if;
  end if;
  if tg_op = 'UPDATE' and new.proposed_at is not distinct from old.proposed_at and new.ends_at is not distinct from old.ends_at
     and new.status is not distinct from old.status and new.unit_id is not distinct from old.unit_id then
    return new;   -- rien qui touche la plage (réponse, note, rappel)
  end if;
  if extract(minute from new.proposed_at)::int % 15 <> 0 or extract(second from new.proposed_at) <> 0
     or extract(minute from new.ends_at)::int % 15 <> 0 or extract(second from new.ends_at) <> 0 then
    raise exception 'Les visites se prennent par quart d’heure (:00, :15, :30, :45).' using errcode = 'PT422';
  end if;
  if new.status in ('proposed', 'confirmed') then
    perform pg_advisory_xact_lock(hashtext('visits:' || new.unit_id));   -- deux réservations simultanées du même logement : l'une attend l'autre
    select * into v from public.visits x
     where x.unit_id = new.unit_id and x.id <> new.id and x.status in ('proposed', 'confirmed')
       and tstzrange(x.proposed_at, coalesce(x.ends_at, x.proposed_at + interval '15 minutes')) && tstzrange(new.proposed_at, new.ends_at)
     order by x.proposed_at limit 1;
    if found then
      raise exception '%', case when v.kind = 'visite_libre' then 'Une visite libre occupe déjà ce moment dans ce logement.'
                                else 'Une autre visite est déjà prévue à ce moment dans ce logement.' end using errcode = 'PT409';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists visits_plage on public.visits;
create trigger visits_plage before insert or update on public.visits for each row execute function public.visits_plage();
