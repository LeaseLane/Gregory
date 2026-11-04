-- Visites (Grégory, 2026-11-04) : une même personne fait toutes les visites, donc aucune visite active (proposée ou confirmée) ne
-- chevauche une autre visite active, quel que soit le logement (avant : par logement seulement). Remplace visits_plage (20261111120000).
-- ponytail: règle globale, car la visite ne dit pas qui la fait; plusieurs personnes un jour → colonne visits.agent_id et règle par personne.
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
    perform pg_advisory_xact_lock(hashtext('visits'));   -- deux réservations simultanées : l'une attend l'autre
    select * into v from public.visits x
     where x.id <> new.id and x.status in ('proposed', 'confirmed')
       and tstzrange(x.proposed_at, coalesce(x.ends_at, x.proposed_at + interval '15 minutes')) && tstzrange(new.proposed_at, new.ends_at)
     order by x.proposed_at limit 1;
    if found then
      raise exception '%', case when v.kind = 'visite_libre' then 'Une visite libre est déjà prévue à ce moment.'
                                else 'Une autre visite est déjà prévue à ce moment.' end using errcode = 'PT409';
    end if;
  end if;
  return new;
end $$;
