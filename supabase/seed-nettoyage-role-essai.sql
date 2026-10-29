-- Préproduction : remet « à chercher » les immeubles marqués cherchés alors que l'IA n'avait rien répondu (essai du 2026-10-29),
-- et retire l'ancien essai « Groupe Immobilier Laurent ». La démo lit la préproduction.
update crm.immeubles_role set propose_le = null, propose_note = null, propose_sources = null
 where propose_nom is null and propose_note like '%Aucun résultat soumis%' and coalesce(jsonb_array_length(propose_sources), 0) = 0;
update crm.immeubles_role set proprietaire = null, groupe = null, neq = null, note = null, saisi_par = null, saisi_le = null where proprietaire = 'Groupe Immobilier Laurent';
delete from crm.role_coordonnees where cle = 'groupeimmobilierlaurent';
select count(*) filter (where propose_le is not null) cherches, count(*) filter (where proprietaire is not null) proprietaires from crm.immeubles_role;
