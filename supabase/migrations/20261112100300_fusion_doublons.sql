-- Recherche IA : un même propriétaire trouvé sous plusieurs noms (« Logisco » et « Logisco Gestion Immobilière inc. », « Beaudet & Saucier »
-- et « Beaudet et Saucier ») se fusionne dès que ses coordonnées publiées tombent sur le même téléphone ou le même site web : ses immeubles
-- passent sous le nom du premier trouvé (champ « groupe »), les coordonnées se complètent, et il n'y a plus qu'une ligne, un appel, un deal.
-- ponytail: même téléphone = même décideur; un gestionnaire qui publie son numéro pour plusieurs propriétaires les réunirait (Écarter /
-- Immeubles du rôle pour défaire). Les annuaires (Facebook, ZoomInfo…) ne comptent pas comme site.
create or replace function crm.tel_cle(t text) returns text language sql immutable set search_path = '' as $$
  select nullif(right(regexp_replace(coalesce(t, ''), '\D', '', 'g'), 10), '');
$$;
create or replace function crm.site_cle(t text) returns text language sql immutable set search_path = '' as $$
  select case when h !~ '(facebook|linkedin|zoominfo|google|canada411|pagesjaunes|yellowpages|centris|kijiji|registreentreprises|instagram|indeed|opencorporates)' then nullif(h, '') end
  from (select regexp_replace(lower(btrim(coalesce(t, ''))), '^(https?://)?(www\.)?([^/?#]+).*$', '\3') h) x;
$$;

create or replace function crm.fusionner_doublon() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_garde text; v_nom text;
begin
  if pg_trigger_depth() > 1 then return null; end if;
  select c.cle into v_garde from crm.role_coordonnees c
  where c.cle <> new.cle
    and ((crm.tel_cle(new.telephone) is not null and crm.tel_cle(c.telephone) = crm.tel_cle(new.telephone)) or (crm.site_cle(new.site) is not null and crm.site_cle(c.site) = crm.site_cle(new.site)))
    and exists (select 1 from crm.immeubles_role i where crm.cle_proprietaire(i.groupe, i.proprietaire) = c.cle)
  order by c.trouve_le limit 1;
  if v_garde is null then return null; end if;
  select min(coalesce(i.groupe, i.proprietaire)) into v_nom from crm.immeubles_role i where crm.cle_proprietaire(i.groupe, i.proprietaire) = v_garde;
  update crm.immeubles_role i set groupe = v_nom where crm.cle_proprietaire(i.groupe, i.proprietaire) = new.cle;
  delete from crm.role_coordonnees where cle = new.cle;
  update crm.role_coordonnees c set telephone = coalesce(c.telephone, new.telephone), courriel = coalesce(c.courriel, new.courriel), site = coalesce(c.site, new.site),
    decideur = coalesce(c.decideur, new.decideur), gestionnaire = coalesce(c.gestionnaire, new.gestionnaire), refus = c.refus or new.refus,
    a_propos = coalesce(c.a_propos, new.a_propos), categorie = coalesce(c.categorie, new.categorie), sources = c.sources || new.sources
  where c.cle = v_garde;
  perform crm.journal('building_owner.merged', 'crm.role_coordonnees', null, null, jsonb_build_object('fusionne', new.cle, 'dans', v_garde, 'nom', v_nom), 'merge-duplicate-owner', 'interface', null, 'system', 'fusion-doublons');
  return null;
end $$;
drop trigger if exists fusionner_doublon on crm.role_coordonnees;
create trigger fusionner_doublon after insert or update on crm.role_coordonnees for each row execute function crm.fusionner_doublon();

-- Rattrapage : les plus récents se fusionnent dans le premier trouvé.
do $$ declare r record; begin
  for r in select cle from crm.role_coordonnees order by trouve_le desc loop
    update crm.role_coordonnees set trouve_le = trouve_le where cle = r.cle;
  end loop;
end $$;
