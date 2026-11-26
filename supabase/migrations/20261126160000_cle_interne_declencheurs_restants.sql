-- Audit sécurité 2026-11 : handle-document-upload, run-automation-email et les
-- rappels (send_reminder) de handle-visit-response / handle-tenant-confirmation
-- exigent maintenant la clé d'appel interne. Les quatre fonctions SQL qui les
-- appellent envoyaient encore la clé publique seule : on remplace leur bloc
-- headers par internal_call_headers() (même correctif que T0, 20261013230000).
-- Réécrit la définition en place (pas de copie du corps) ; sans effet si déjà fait.
do $$
declare
  f record;
  def text;
  neuf text;
begin
  for f in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('notify_new_document', 'flag_stuck_repair_cases', 'send_visit_reminders', 'execute_automation_rules')
  loop
    def := pg_get_functiondef(f.oid);
    neuf := regexp_replace(def, 'headers\s*:=\s*jsonb_build_object\(\s*''Content-Type''[^)]*\)', 'headers := internal_call_headers()', 'g');
    if neuf <> def then
      execute neuf;
    end if;
  end loop;
end;
$$;
