-- Suite de 20261123150000 : la fonction dit aussi POURQUOI l'immeuble est écarté (catégorie hors cible), pour l'afficher à l'écran.
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.service_role_immeuble_confirmer(uuid)'::regprocedure);
  if position('''hors_cible''' in d) > 0 then return; end if;
  n := replace(d, '''chercher_coordonnees'', false);', '''chercher_coordonnees'', false,
      ''hors_cible'', coalesce(nullif(i.propose_categorie, ''prive''), crm.hors_cible(v_nom)));');
  if n = d then raise exception 'service_role_immeuble_confirmer : ancre introuvable'; end if;
  execute n;
end $$;
