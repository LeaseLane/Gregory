-- T7 · Journée de démonstration de l'agenda (maquette e05), préproduction seulement. Rejouable.
-- Visites (vraie table visits) + tâches à heure fixe. Pas de bons de travail : leur déclencheur appelle des fonctions.
delete from public.visits where prospect_email like '%@exemple-agenda.test';
delete from crm.tasks where entity_type = 'demo-e05';
do $$
declare d date := (now() at time zone 'America/Toronto')::date; f text := 'America/Toronto';
  u1 uuid := (select id from public.units order by unit_number limit 1 offset 0);
  u2 uuid := (select id from public.units order by unit_number limit 1 offset 3);
  j uuid := (select id from auth.users where email = 'equipe-gestionnaire@leaselane.test');
  c uuid := (select id from auth.users where email = 'equipe-location@leaselane.test');
begin
  insert into public.visits (unit_id, prospect_name, prospect_email, proposed_at, status) values
    (u1, 'Émilie Gagnon et 1 autre candidat', 'emilie@exemple-agenda.test', (d + time '09:00') at time zone f, 'completed'),
    (u2, 'Luc Morin', 'luc@exemple-agenda.test', (d + time '16:30') at time zone f, 'confirmed'),
    (u1, 'Nadia Tremblay', 'nadia@exemple-agenda.test', (d + 2 + time '10:00') at time zone f, 'proposed');
  insert into crm.tasks (title, context, due_at, due_all_day, assignee_user_id, source, entity_type) values
    ('Appel · Pierre Bouchard', 'cession du 2880, ch. Sainte-Foy — 1', (d + time '10:00') at time zone f, false, j, 'manual', 'demo-e05'),
    ('Inspection de toiture', 'Toitures Beauport · 1180, Cartier', (d + time '11:30') at time zone f, false, j, 'manual', 'demo-e05'),
    ('Signature de bail · 420, Saint-Joseph E. — 3', 'bail du 1er novembre', (d + 5 + time '16:00') at time zone f, false, c, 'manual', 'demo-e05'),
    ('Visite des immeubles Roy', '1260 et 1272, 3e Avenue · avant le 16 oct.', null, true, c, 'manual', 'demo-e05'),
    ('État des lieux · Luc Morin', '420, Saint-Joseph Est — 5 · 31 oct.', null, true, c, 'manual', 'demo-e05');
end $$;
select count(*) as visites from public.visits where prospect_email like '%@exemple-agenda.test';
