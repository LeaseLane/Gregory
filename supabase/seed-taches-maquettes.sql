-- T7 · Tâches de démonstration (maquette l03), préproduction seulement. Rejouable : efface les tâches source « system »
-- marquées demo puis recrée. « SP » de la maquette = Julie (gestionnaire), « CD » = Camille (location).
delete from crm.tasks where entity_type = 'demo-l03';
do $$
declare j uuid := (select id from auth.users where email = 'equipe-gestionnaire@leaselane.test');
  c uuid := (select id from auth.users where email = 'equipe-location@leaselane.test');
  l uuid := (select id from auth.users where email = 'equipe-prospection@leaselane.test');
  d date := (now() at time zone 'America/Toronto')::date;
  f text := 'America/Toronto';
begin
  insert into crm.tasks (title, context, due_at, due_all_day, assignee_user_id, assignee_role, recurrence, series_id, source, entity_type) values
    ('Relancer Investissements Roy', 'Ventes · Mandats propriétaires', (d - 2 + time '17:00') at time zone f, true, j, null, 'none', null, 'manual', 'demo-l03'),
    ('Signer le relevé de Caron', 'Finances · relevé de septembre', (d - 1 + time '17:00') at time zone f, true, j, null, 'none', null, 'manual', 'demo-l03'),
    ('Appeler Sophie Ménard', 'Juridique · rappel J+12', (d + time '14:00') at time zone f, false, j, null, 'none', null, 'manual', 'demo-l03'),
    ('Préparer la visite du 640, 3e Av. — 4', 'Ventes · Location · Émilie Gagnon', (d + time '16:00') at time zone f, false, c, null, 'none', null, 'cleo', 'demo-l03'),
    ('Valider la mise en demeure Paquet', 'Juridique · brouillon de Cléo', (d + time '17:00') at time zone f, true, j, null, 'none', null, 'cleo', 'demo-l03'),
    ('Répondre à 2 messages du site', 'Opérations · Inbox', (d + time '17:00') at time zone f, true, null, 'gestionnaire', 'none', null, 'system', 'demo-l03'),
    ('18 avis de renouvellement à préparer', 'Clients · renouvellement', (d + 1 + time '17:00') at time zone f, true, c, null, 'yearly', gen_random_uuid(), 'manual', 'demo-l03'),
    ('Bilan annuel · Marie-Josée Bérubé', 'Clients · Propriétaires', (d + 3 + time '17:00') at time zone f, true, j, null, 'none', null, 'manual', 'demo-l03'),
    ('Tester les détecteurs · 38 immeubles', 'Maintenance · semestrielle', (d + 17 + time '17:00') at time zone f, true, null, 'gestionnaire', 'semiannual', gen_random_uuid(), 'manual', 'demo-l03'),
    ('Rappeler le Groupe Fortin', 'Ventes · Prospection', (d - 3 + time '17:00') at time zone f, true, c, null, 'none', null, 'manual', 'demo-l03'),
    ('Mettre à jour la fiche du 1180, Cartier', 'Immeubles · Logements', (d - 1 + time '17:00') at time zone f, true, c, null, 'none', null, 'manual', 'demo-l03'),
    ('Envoyer le mandat signé', 'Ventes · Mandats propriétaires', (d - 2 + time '17:00') at time zone f, true, l, null, 'none', null, 'manual', 'demo-l03');
end $$;
select title, assignee_role, recurrence from crm.tasks where entity_type = 'demo-l03' order by due_at;
