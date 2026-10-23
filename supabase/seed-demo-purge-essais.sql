-- ============================================================
-- Démo (PRÉPRODUCTION SEULEMENT) : retrait des restes d'essais — À JOUER SUR DÉCISION D'OCTA
-- ============================================================
-- Efface les lignes métier des essais manuels et automatisés (TEST-*, Préprod *, « (essai) », Test QA, inscriptions chedhly+…)
-- et tout ce qui les référence. Les comptes de connexion (auth.users) et les membres d'équipe ne sont pas touchés.
-- Le grand livre refuse les suppressions (prevent_gl_mutation) : la garde est levée DANS la transaction, pour les écritures des
-- propriétaires d'essai seulement, puis rétablie avant la fin. Annulé en entier à la moindre erreur.
-- Usage : gh workflow run preproduction-sql.yml -f fichier=supabase/seed-demo-purge-essais.sql
-- ============================================================
\set ON_ERROR_STOP on
begin;
do $$ begin
  if not exists (select 1 from public.owners where full_name = 'Marie-Josée Bérubé') then raise exception 'Pas la base de démonstration : refusé.'; end if;
  if (select count(*) from public.owners) > 40 then raise exception 'Trop de propriétaires pour une base de démonstration : refusé.'; end if;
end $$;

-- ── Purge : supprime les lignes visées et, d'abord, tout ce qui les référence (clés étrangères à une colonne) ──
create or replace function pg_temp.purger(p_tab regclass, p_where text, p_chemin text[] default '{}') returns void language plpgsql as $$
declare r record; v_sous text;
begin
  if array_length(p_chemin, 1) > 9 then raise exception 'Purge trop profonde : %', p_tab; end if;
  for r in select c.conrelid::regclass enfant, a.attname col_enfant, af.attname col_parent, a.attnotnull obligatoire
           from pg_constraint c
           join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
           join pg_attribute af on af.attrelid = c.confrelid and af.attnum = c.confkey[1]
           where c.contype = 'f' and c.confrelid = p_tab and array_length(c.conkey, 1) = 1
             and c.conrelid::regclass::text not in ('auth.users', 'public.users', 'crm.team_members')
  loop
    v_sous := format('%I in (select %I from %s where %s)', r.col_enfant, r.col_parent, p_tab, p_where);
    -- Cycle (table déjà sur le chemin, ou référence à elle-même) : on détache le lien au lieu de descendre
    if r.enfant = p_tab or r.enfant::text = any(p_chemin) then
      if not r.obligatoire then execute format('update %s set %I = null where %s', r.enfant, r.col_enfant, v_sous); end if;
    else
      perform pg_temp.purger(r.enfant, v_sous, p_chemin || p_tab::text);
    end if;
  end loop;
  execute format('delete from %s where %s', p_tab, p_where);
end $$;

-- Le grand livre refuse toute suppression (prevent_gl_mutation) : levé dans cette transaction seulement, pour les écritures
-- des propriétaires d'essai; rétabli plus bas, avant la fin de la transaction.
do $$ declare t record; begin
  for t in select tgrelid::regclass tab, tgname from pg_trigger tr join pg_proc p on p.oid = tr.tgfoid where p.proname = 'prevent_gl_mutation' and not tgisinternal loop
    execute format('alter table %s disable trigger %I', t.tab, t.tgname); end loop; end $$;

do $$
begin
  perform pg_temp.purger('public.owners', $w$full_name like 'Préprod%' or full_name like 'TEST-%'$w$);
  perform pg_temp.purger('public.buildings', $w$address like 'TEST-%' or address like '%Préprod%' or address like '%(essai%' or zone in ('Essai') or zone like 'TEST%'$w$);
  perform pg_temp.purger('public.tenants', $w$full_name like 'TEST-%' or full_name like 'Préprod%'$w$);
  perform pg_temp.purger('public.workers', $w$name in ('Préprod Travailleur', 'Test QA') or name like 'À compléter (chedhly%'$w$);
  perform pg_temp.purger('public.work_orders', $w$description like 'TEST-%'$w$);
  perform pg_temp.purger('public.service_requests', $w$description like 'TEST-%'$w$);
  perform pg_temp.purger('public.service_request_messages', $w$body like 'TEST-%'$w$);
  perform pg_temp.purger('public.prospects', $w$full_name like 'TEST-%'$w$);
  perform pg_temp.purger('crm.deals', $w$title like 'TEST-%'$w$);
  perform pg_temp.purger('crm.contacts', $w$full_name like 'TEST-%'$w$);
  perform pg_temp.purger('crm.tasks', $w$title like '%TEST-%' or context like '%TEST-%'$w$);
  perform pg_temp.purger('crm.sources', $w$code like 'csv:test-%'$w$);
  perform pg_temp.purger('public.service_catalog', $w$label like 'TEST-%'$w$);
  perform pg_temp.purger('site.articles', $w$titre like 'TEST-%'$w$);
  perform pg_temp.purger('public.building_submissions', $w$address like 'TEST-%' or address like '%(essai)%'$w$);
  perform pg_temp.purger('crm.tasks', $w$title like '%(essai)%'$w$);
  -- Tâches ouvertes en double (essais répétés du portail) : la plus ancienne reste
  perform pg_temp.purger('crm.tasks', $w$id in (select id from (select id, row_number() over (partition by title order by created_at) rn from crm.tasks where status = 'open') z where rn > 1)$w$);
  perform pg_temp.purger('public.tenant_proposals', $w$full_name like 'TEST-%' or full_name like '%(essai)%'$w$);
  perform pg_temp.purger('public.portal_invitations', $w$full_name like 'TEST-%' or email like 'test-%'$w$);
  perform pg_temp.purger('public.inscriptions_entreprises', $w$courriel like 'chedhly+%'$w$);
  perform pg_temp.purger('public.personal_data_requests', $w$row_to_json(personal_data_requests)::text like '%TEST-%'$w$);
  perform pg_temp.purger('crm.notifications', $w$row_to_json(notifications)::text like '%TEST-%'$w$);
  raise notice 'Restes d''essais purgés.';
end $$;

do $$ declare t record; begin
  for t in select tgrelid::regclass tab, tgname from pg_trigger tr join pg_proc p on p.oid = tr.tgfoid where p.proname = 'prevent_gl_mutation' and not tgisinternal loop
    execute format('alter table %s enable trigger %I', t.tab, t.tgname); end loop; end $$;

commit;
