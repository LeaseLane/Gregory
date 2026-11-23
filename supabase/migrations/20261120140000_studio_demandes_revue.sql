-- Studio › Site web › Demandes : revue twim-design du 20 nov. 2026 (constats 1, 2, 6).
--  1. Toutes les demandes « nouvelles » sont rendues, plus les 300 dernières des autres; les comptes se font sans limite.
--  2. Loi 25 : une demande anonymisée ne montre plus ni résumé de Cléo ni moment de rappel, et l'anonymisation les vide en base
--     (déclencheur : vaut pour toutes les fonctions qui anonymisent), y compris pour les demandes déjà anonymisées.
--  6. La pastille « Site web » compte aussi les nouvelles demandes (elle ne comptait que les articles à réviser).

create or replace function public.inquiries_anonymiser_ia() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.anonymized_at is not null and old.anonymized_at is null then
    new.ai_summary := null; new.ai_category := null; new.best_call_time := null; new.main_problem := null;
  end if;
  return new;
end $$;
drop trigger if exists inquiries_anonymiser_ia on public.inquiries;
create trigger inquiries_anonymiser_ia before update of anonymized_at on public.inquiries for each row execute function public.inquiries_anonymiser_ia();
update public.inquiries set ai_summary = null, ai_category = null, best_call_time = null, main_problem = null
 where anonymized_at is not null and (ai_summary is not null or ai_category is not null or best_call_time is not null or main_problem is not null);

create or replace function public.lanceur_demandes_site() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.studio(false);
  return jsonb_build_object(
    'demandes', coalesce((select jsonb_agg(jsonb_build_object(
        'id', i.id, 'recu_le', i.created_at, 'type', i.type, 'statut', i.status, 'anonymise', i.anonymized_at is not null,
        'nom', case when i.anonymized_at is null then i.full_name end, 'courriel', case when i.anonymized_at is null then i.email end,
        'telephone', case when i.anonymized_at is null then i.phone end, 'message', case when i.anonymized_at is null then i.message end,
        'resume', case when i.anonymized_at is null then i.ai_summary end, 'rappel', case when i.anonymized_at is null then i.best_call_time end,
        'portes', i.num_doors, 'secteur', i.sector,
        'logement', case when i.unit_id is not null then crm.libelle_logement(i.unit_id) end) order by i.created_at desc)
      from (select * from public.inquiries where status = 'new'
            union all (select * from public.inquiries where status <> 'new' order by created_at desc limit 300)) i), '[]'::jsonb),
    'comptes', (select jsonb_build_object('new', count(*) filter (where status = 'new'), 'contacted', count(*) filter (where status = 'contacted'),
                                          'closed', count(*) filter (where status = 'closed'), 'total', count(*)) from public.inquiries),
    'peut_ecrire', crm.can('studio.ecrire'));
end $$;

do $$
declare d text; n text;
begin
  d := pg_get_functiondef('public.lanceur_pastilles()'::regprocedure);
  if position('public.inquiries' in d) > 0 then return; end if;
  n := replace(d, '''Site web'', jsonb_build_object(''n'', (select count(*) from site.articles where statut = ''revision''))',
    '''Site web'', jsonb_build_object(''n'', (select count(*) from site.articles where statut = ''revision'') + (select count(*) from public.inquiries where status = ''new''))');
  if n = d then raise exception 'lanceur_pastilles : ancre introuvable'; end if;
  execute n;
end $$;
