-- Les 7 documents d'Eliot Marcoux téléversés le 2026-09-29 (BAIL / AUGMENTATION
-- 1735-x) n'avaient pas d'immeuble : le choix n'existait pas encore. On les
-- rattache à son immeuble du 1735 — seulement s'il en a exactement un.
update public.documents d
   set building_id = b.id
  from (
    select min(id::text)::uuid as id
      from public.buildings
     where owner_id = '89a2b3ef-f883-4d06-ac36-09989547fb10' and address like '%1735%'
    having count(*) = 1
  ) b
 where d.owner_id = '89a2b3ef-f883-4d06-ac36-09989547fb10'
   and d.building_id is null
   and d.title like '%1735%';
