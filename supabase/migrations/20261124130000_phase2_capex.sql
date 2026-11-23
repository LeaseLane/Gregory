-- Phase 2 · prévision CapEx (plan du 13 nov. 2026 : toiture, fenêtres, fondation sur 15 à 20 ans, inflation, alerte de manque de liquidités).
-- ATTENTION : durées de vie et coûts par défaut = estimations d'Octa (23 nov. 2026), NON VALIDÉES (valide = false). Frank ou Steven doivent les confirmer
-- avant tout affichage à un client. Chaque immeuble peut les remplacer. Un composant sans année d'installation n'est pas projeté (on ne devine pas).
-- Règles : remplacement l'année installation + durée de vie; en retard (échéance passée) = prévu cette année; répété par durée de vie dans l'horizon de 20 ans;
-- coût = coût par logement × logements × (1 + inflation)^(années depuis cette année); réserve fin d'année = départ + versement annuel × années − dépenses cumulées.
create table if not exists crm.capex_defauts (composant text primary key, libelle text not null, duree_vie int not null check (duree_vie > 0), cout_logement numeric(10,2) not null check (cout_logement >= 0), valide boolean not null default false);
create table if not exists crm.capex_composants (
  building_id uuid not null references public.buildings(id) on delete cascade, composant text not null references crm.capex_defauts(composant),
  annee_installation int not null check (annee_installation between 1850 and 2100), duree_vie int check (duree_vie > 0), cout_logement numeric(10,2) check (cout_logement >= 0), primary key (building_id, composant));
create table if not exists crm.capex_immeubles (building_id uuid primary key references public.buildings(id) on delete cascade,
  reserve_depart numeric(12,2) not null default 0, reserve_annuelle numeric(12,2) not null default 0 check (reserve_annuelle >= 0), inflation numeric(4,2) not null default 3.0 check (inflation between 0 and 15));
alter table crm.capex_defauts enable row level security; alter table crm.capex_composants enable row level security; alter table crm.capex_immeubles enable row level security;
revoke all on crm.capex_defauts, crm.capex_composants, crm.capex_immeubles from public, anon, authenticated;
insert into crm.capex_defauts (composant, libelle, duree_vie, cout_logement) values
  ('toiture', 'Toiture', 25, 3500), ('fenetres', 'Fenêtres', 30, 2500), ('chauffage', 'Système de chauffage', 25, 2000),
  ('revetement', 'Revêtement extérieur et briques', 40, 3000), ('fondation', 'Fondation et drainage', 50, 2500), ('asphalte', 'Stationnement (asphalte)', 20, 600)
on conflict (composant) do nothing;

create or replace function public.lanceur_capex(p_building uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare y0 int := extract(year from now() at time zone 'America/Toronto')::int; v_log int; v_infl numeric; v_dep numeric; v_ann numeric; res jsonb;
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  if not exists (select 1 from public.buildings where id = p_building) then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
  select count(*)::int into v_log from public.units where building_id = p_building;
  select coalesce(i.inflation, 3.0), coalesce(i.reserve_depart, 0), coalesce(i.reserve_annuelle, 0) into v_infl, v_dep, v_ann
    from (select 1) x left join crm.capex_immeubles i on i.building_id = p_building;
  with c as (
    select k.composant, d.libelle, k.annee_installation, coalesce(k.duree_vie, d.duree_vie) vie, coalesce(k.cout_logement, d.cout_logement) cout, d.valide, (k.duree_vie is not null or k.cout_logement is not null) perso
    from crm.capex_composants k join crm.capex_defauts d using (composant) where k.building_id = p_building),
  occ as (select c.composant, c.libelle, g annee, round(c.cout * v_log * power(1 + v_infl / 100, g - y0), 2) montant
          from c, generate_series(greatest(c.annee_installation + c.vie, y0), y0 + 19, c.vie) g),
  an as (select y annee, coalesce((select sum(montant) from occ where occ.annee = y), 0) depenses from generate_series(y0, y0 + 19) y),
  cum as (select annee, depenses, round(v_dep + v_ann * (annee - y0 + 1) - sum(depenses) over (order by annee), 2) reserve_fin from an)
  select jsonb_build_object('logements', v_log, 'inflation', v_infl, 'reserve_depart', v_dep, 'reserve_annuelle', v_ann, 'annee_courante', y0,
    'valide', coalesce((select bool_and(valide and not perso) from c), false) or false,
    'composants', coalesce((select jsonb_agg(jsonb_build_object('composant', composant, 'libelle', libelle, 'annee_installation', annee_installation, 'duree_vie', vie, 'cout_logement', cout, 'echeance', annee_installation + vie,
                    'en_retard', annee_installation + vie < y0, 'valide', valide and not perso) order by annee_installation + vie) from c), '[]'::jsonb),
    'annees', (select jsonb_agg(jsonb_build_object('annee', cum.annee, 'depenses', cum.depenses, 'reserve_fin', cum.reserve_fin,
                    'details', coalesce((select jsonb_agg(jsonb_build_object('composant', o.composant, 'libelle', o.libelle, 'montant', o.montant)) from occ o where o.annee = cum.annee), '[]'::jsonb)) order by cum.annee) from cum),
    'premiere_alerte', (select min(annee) from cum where reserve_fin < 0),
    'defauts', (select jsonb_agg(jsonb_build_object('composant', composant, 'libelle', libelle, 'duree_vie', duree_vie, 'cout_logement', cout_logement) order by libelle) from crm.capex_defauts)) into res;
  return res;
end $$;

create or replace function public.lanceur_capex_enregistrer(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v_b uuid := nullif(p ->> 'building_id', '')::uuid; x jsonb; v_an int;
begin
  perform crm.require_aal2();
  if not crm.can('immeubles.ecrire') then raise exception 'Votre rôle ne permet pas de modifier un immeuble.' using errcode = 'PT403'; end if;
  if not exists (select 1 from public.buildings where id = v_b) then raise exception 'Immeuble introuvable.' using errcode = 'PT404'; end if;
  insert into crm.capex_immeubles (building_id, reserve_depart, reserve_annuelle, inflation)
  values (v_b, coalesce((p ->> 'reserve_depart')::numeric, 0), coalesce((p ->> 'reserve_annuelle')::numeric, 0), coalesce((p ->> 'inflation')::numeric, 3.0))
  on conflict (building_id) do update set reserve_depart = coalesce((p ->> 'reserve_depart')::numeric, crm.capex_immeubles.reserve_depart),
    reserve_annuelle = coalesce((p ->> 'reserve_annuelle')::numeric, crm.capex_immeubles.reserve_annuelle), inflation = coalesce((p ->> 'inflation')::numeric, crm.capex_immeubles.inflation);
  for x in select e from jsonb_array_elements(coalesce(p -> 'composants', '[]'::jsonb)) e loop
    if not exists (select 1 from crm.capex_defauts where composant = x ->> 'composant') then raise exception 'Composant inconnu.' using errcode = 'PT422'; end if;
    v_an := nullif(x ->> 'annee_installation', '')::int;
    if v_an is null then delete from crm.capex_composants where building_id = v_b and composant = x ->> 'composant';
    else
      if v_an < 1850 or v_an > extract(year from now() at time zone 'America/Toronto')::int then raise exception 'Année d’installation invalide.' using errcode = 'PT422'; end if;
      insert into crm.capex_composants (building_id, composant, annee_installation, duree_vie, cout_logement)
      values (v_b, x ->> 'composant', v_an, nullif(x ->> 'duree_vie', '')::int, nullif(x ->> 'cout_logement', '')::numeric)
      on conflict (building_id, composant) do update set annee_installation = excluded.annee_installation, duree_vie = excluded.duree_vie, cout_logement = excluded.cout_logement;
    end if;
  end loop;
  perform crm.journal('capex.updated', 'crm.capex_immeubles', null, null, jsonb_build_object('building_id', v_b), 'set-capex');
end $$;
revoke all on function public.lanceur_capex(uuid), public.lanceur_capex_enregistrer(jsonb) from public, anon;
grant execute on function public.lanceur_capex(uuid), public.lanceur_capex_enregistrer(jsonb) to authenticated;
