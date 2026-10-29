-- Préproduction : retire l'essai du 2026-10-29 (« Groupe Immobilier Laurent » inscrit sur deux immeubles qui ne sont pas à lui, pour tester
-- « Trouver les coordonnées »). La démo lit la préproduction : aucune fausse association ne doit y rester.
update crm.immeubles_role set proprietaire = null, groupe = null, neq = null, note = null, saisi_par = null, saisi_le = null where proprietaire = 'Groupe Immobilier Laurent';
delete from crm.role_coordonnees where cle = 'groupeimmobilierlaurent';
select count(*) restants from crm.immeubles_role where proprietaire is not null;
