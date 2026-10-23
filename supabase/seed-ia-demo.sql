-- IA de démonstration (maquettes e57 Décisions automatisées, l19 Routeur IA), PRÉPRODUCTION SEULEMENT. Rejouable.
-- Les appels d'IA ne tournent pas en préproduction : ce jeu inscrit des décisions et une consommation fictives,
-- marquées prompt_version = 'demo-ia' (journal) ou criteres ->> 'demo' (agents), pour que les écrans montrent un mois type.
\set ON_ERROR_STOP on
begin;
do $$ begin
  if not exists (select 1 from public.owners where full_name = 'Marie-Josée Bérubé') then raise exception 'Pas la base de démonstration : refusé.'; end if;
  if exists (select 1 from public.ai_run_log where prompt_version = 'demo-ia') then raise notice 'IA de démonstration déjà présente.'; end if;
end $$;

-- ── Décisions de Cléo (30 jours) : classement d'urgence, de documents, routage des courriels ──
insert into public.ai_run_log (function_name, trigger_source, entity_type, entity_id, prompt_version, model_version, input_summary, output_summary, confidence, duration_ms, input_tokens, output_tokens, created_at)
select f, 'demo', et, eid, 'demo-ia', 'claude-haiku-4-5', inp, outp, conf, 900 + (abs(hashtext(eid::text || k)) % 1400), 2800, 220,
       now() - make_interval(hours => (abs(hashtext(eid::text || k)) % (24 * 29)))
from (
  select 'handle-service-request' f, 'service_requests' et, sr.id eid, left(sr.description, 90) inp,
         '« ' || (array['normale', 'normale', 'normale', 'élevée', 'urgente'])[1 + abs(hashtext(sr.id::text)) % 5] || ' » · ' || coalesce(sr.ai_category, 'entretien') outp,
         70 + abs(hashtext(sr.id::text)) % 30 conf, g::text k
  from public.service_requests sr cross join generate_series(1, 6) g where sr.description not like 'TEST-%'
  union all
  select 'handle-document-upload', 'documents', d.id, d.title, '« ' || coalesce(d.category, 'autre') || ' »', 75 + abs(hashtext(d.id::text)) % 25, g::text
  from public.documents d cross join generate_series(1, 4) g where d.title not ilike 'test%'
  union all
  select 'handle-inquiry', 'inquiries', i.id, 'Courriel de ' || i.full_name, (array['Location', 'Mandats', 'Maintenance', 'Comptabilité'])[1 + abs(hashtext(i.id::text)) % 4], 72 + abs(hashtext(i.id::text)) % 28, '1'
  from (select * from public.inquiries order by created_at desc limit 520) i
) z
where not exists (select 1 from public.ai_run_log where prompt_version = 'demo-ia');

-- trois décisions sous 80 % en file de révision (rien n'est appliqué avant la décision d'une personne)
update public.ai_run_log l set confidence = v.c, output_summary = v.o, input_summary = v.i, created_at = now() - make_interval(mins => v.m), verified_at = null, verdict = null
from (values (1, 62, '« normale » · bruit dans le mur', 'Aucune photo reçue', 120), (2, 71, 'Comptabilité · 2880, ch. Sainte-Foy', 'Parle d’un relevé et d’une réparation à la fois', 95),
             (3, 58, 'Preuve d’assurance · Nadia Tremblay', 'Page floue : la date d’expiration est illisible', 60)) as v(n, c, o, i, m)
join (select id, row_number() over (order by function_name, id) n from (select distinct on (function_name) id, function_name from public.ai_run_log where prompt_version = 'demo-ia' order by function_name, id) q) x on x.n = v.n
where l.id = x.id;
update public.ai_run_log set confidence = greatest(confidence, 81) where prompt_version = 'demo-ia' and confidence < 80 and created_at < now() - interval '3 hours';

-- échantillon vérifié par l'équipe (une décision sur cinq au hasard, plus les anciennes sous 80 %) : 96 % confirmées
update public.ai_run_log l set verified_at = least(now() - interval '5 minutes', l.created_at + interval '2 hours'),
  verified_by = (select user_id from crm.team_members where display_name = (array['Julie Normandeau', 'Camille Desrosiers', 'Admin Démo'])[1 + abs(hashtext(l.id::text)) % 3]),
  verdict = case when abs(hashtext(l.id::text || 'v')) % 25 = 0 then 'corrigee' else 'confirmee' end,
  human_correction = case when abs(hashtext(l.id::text || 'v')) % 25 = 0 then 'Avenant' end
where l.prompt_version = 'demo-ia' and crm.a_verifier(l) and l.confidence >= 80 and l.verified_at is null;
-- cinq vérifiées aujourd'hui
update public.ai_run_log l set verified_at = now() - make_interval(mins => 20 * x.n), created_at = least(l.created_at, now() - make_interval(mins => 20 * x.n + 30))
from (select id, row_number() over (order by id) n from public.ai_run_log where prompt_version = 'demo-ia' and verdict is not null limit 5) x where l.id = x.id;

-- ── Consommation du mois (Routeur IA) ──
insert into public.ai_run_log (function_name, trigger_source, prompt_version, model_version, duration_ms, input_tokens, output_tokens, created_at)
select 'handle-mandat-inquiry', 'demo', 'demo-ia', 'claude-sonnet-5', 2100, 20000, 1500, date_trunc('month', now()) + make_interval(hours => (g * 7) % ((extract(day from now())::int - 1) * 24 + 1))
from generate_series(1, 400) g where not exists (select 1 from public.ai_run_log where prompt_version = 'demo-ia' and model_version = 'claude-sonnet-5');
insert into public.ai_run_log (function_name, trigger_source, prompt_version, model_version, duration_ms, input_tokens, output_tokens, created_at)
select 'reconcile-bank-transactions', 'demo', 'demo-ia', 'claude-haiku-4-5', 800, 3000, 300, date_trunc('month', now()) + make_interval(hours => (g * 5) % ((extract(day from now())::int - 1) * 24 + 1))
from generate_series(1, 300) g where not exists (select 1 from public.ai_run_log where prompt_version = 'demo-ia' and function_name = 'reconcile-bank-transactions');
insert into crm.agent_runs (agent, criteres, started_at, finished_at, tokens_in, tokens_out, cout_cents)
select a.agent, jsonb_build_object('modele', a.modele, 'demo', true), t, t + make_interval(secs => a.s), a.tin, a.tout, a.c
from (values ('cleo', 'claude-haiku-4-5', 1.1, 3000, 300, 23), ('prospection', 'claude-sonnet-5', 6.0, 9000, 3000, 140), ('recrutement', 'claude-sonnet-5', 5.4, 8000, 2600, 120)) as a(agent, modele, s, tin, tout, c)
cross join lateral generate_series(1, case a.agent when 'cleo' then 400 when 'prospection' then 20 else 12 end) g
cross join lateral (select date_trunc('month', now()) + make_interval(hours => (g * 3) % ((extract(day from now())::int - 1) * 24 + 1)) t) x
where not exists (select 1 from crm.agent_runs where criteres ? 'demo');

select function_name, count(*), count(*) filter (where verified_at is not null) verifiees, count(*) filter (where confidence < 80 and verified_at is null) a_reviser
from public.ai_run_log where prompt_version = 'demo-ia' group by 1;
commit;
