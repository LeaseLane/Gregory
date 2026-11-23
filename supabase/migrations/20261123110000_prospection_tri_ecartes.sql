-- Prospection IA (retours de Greg, 23 nov. 2026) :
--  1. « pouvoir trier les résultats » : p.tri = logements | immeubles | nom | coordonnees | distance (défaut : comme avant —
--     distance si « près de », propriétaires connus d'abord, puis logements). Le tri se fait en base, sur tous les résultats, avant les 200 affichés.
--  2. « des immeubles écartés, pouvoir les revoir (dans 6 mois, un client de 1 000 portes n'est plus impossible) » :
--     p.ecartes = 'oui' montre seulement les écartés (même hors cible : office d'habitation, coopérative…), avec la date, l'auteur et la note;
--     décision « retablir » dans lanceur_recherche_decider les remet dans la recherche (journalisé). Le compte des écartés sort toujours (nb_ecartes).
-- Corps des deux fonctions modifiés en place (ancres vérifiées) : leur dernière version vit dans 20261113170000_prospecteurs_leurs_donnees.sql.

do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.lanceur_recherche_role(jsonb)'::regprocedure);
  if position('v_ecartes' in d) > 0 then return; end if;
  n := replace(d, '  v_km float8 := least(greatest(coalesce(nullif(p #>> ''{pres_de,km}'', '''')::float8, 2), 0.1), 100);',
    '  v_km float8 := least(greatest(coalesce(nullif(p #>> ''{pres_de,km}'', '''')::float8, 2), 0.1), 100);
  v_ecartes boolean := coalesce(p ->> ''ecartes'', '''') = ''oui''; v_tri text := nullif(p ->> ''tri'', '''');');
  n := replace(n, 'where not i.ecarte and i.logements between v_min and v_max', 'where i.ecarte = v_ecartes and i.logements between v_min and v_max');
  n := replace(n, 'imm as (select * from tout where hors is null)', 'imm as (select * from tout where hors is null or v_ecartes)');
  n := replace(n, '''cherche'', f.propose_le is not null)',
    '''cherche'', f.propose_le is not null, ''ecarte_le'', case when f.ecarte then f.saisi_le end, ''ecarte_note'', case when f.ecarte then f.note end,
          ''ecarte_par'', case when f.ecarte and f.saisi_par is not null then crm.nom_membre(f.saisi_par) end)');
  n := replace(n, 'row_number() over (order by case when v_lat is not null then r.km end nulls last, (r.nom is null), r.logements desc, r.cle)',
    'row_number() over (order by case v_tri when ''logements'' then -r.logements when ''immeubles'' then -r.immeubles end nulls last,
            case when v_tri = ''nom'' then lower(coalesce(r.nom, ''~'')) end nulls last, case when v_tri = ''coordonnees'' then (r.coordonnees is null)::int end nulls last,
            case when v_lat is not null and coalesce(v_tri, ''distance'') = ''distance'' then r.km end nulls last, (r.nom is null), r.logements desc, r.cle)');
  n := replace(n, '''total'', (select count(*) from r),',
    '''vue'', case when v_ecartes then ''ecartes'' else ''actifs'' end, ''tri'', coalesce(v_tri, ''defaut''), ''nb_ecartes'', (select count(*) from crm.immeubles_role where ecarte),
      ''total'', (select count(*) from r),');
  if (select count(*) from unnest(array['v_ecartes boolean', 'i.ecarte = v_ecartes', 'hors is null or v_ecartes', 'ecarte_le', 'v_tri when', 'nb_ecartes']) x where position(x in n) > 0) <> 6 then
    raise exception 'lanceur_recherche_role : ancre introuvable'; end if;
  execute n;

  d := pg_get_functiondef('public.lanceur_recherche_decider(jsonb)'::regprocedure);
  if position('retablir' in d) > 0 then return; end if;
  n := replace(d, '  if p ->> ''decision'' is distinct from ''ajouter'' then',
    '  if p ->> ''decision'' = ''retablir'' then
    update crm.immeubles_role i set ecarte = false, note = left(coalesce(i.note || '' · '', '''') || ''Rétabli le '' || to_char(now() at time zone ''America/Toronto'', ''YYYY-MM-DD''), 500),
           saisi_par = auth.uid(), saisi_le = now()
     where i.ecarte and case when v_cle like ''imm:%'' then i.id::text = substr(v_cle, 5) else crm.cle_proprietaire(i.groupe, i.proprietaire) = v_cle end;
    get diagnostics v_n = row_count;
    if v_n = 0 then raise exception ''Aucun immeuble écarté pour ce propriétaire.'' using errcode = ''PT404''; end if;
    perform crm.journal(''building_owner.restored'', ''crm.immeubles_role'', null, null, jsonb_build_object(''cle'', v_cle, ''immeubles'', v_n), ''restore-from-search'');
    return jsonb_build_object(''status'', ''retabli'', ''immeubles'', v_n);
  end if;
  if p ->> ''decision'' is distinct from ''ajouter'' then');
  if n = d then raise exception 'lanceur_recherche_decider : ancre introuvable'; end if;
  execute n;
end $$;

-- Écartés sans date (écartés en lot : 1 093 sur 1 530 en prod au 23 nov. 2026) : un drapeau « ecarte » sur chaque immeuble, la date reste facultative.
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.lanceur_recherche_role(jsonb)'::regprocedure);
  if position('''ecarte'', f.ecarte' in d) > 0 then return; end if;
  n := replace(d, '''ecarte_le'', case when f.ecarte then f.saisi_le end,', '''ecarte'', f.ecarte, ''ecarte_le'', case when f.ecarte then f.saisi_le end,');
  if n = d then raise exception 'lanceur_recherche_role : ancre « ecarte_le » introuvable'; end if;
  execute n;
end $$;
