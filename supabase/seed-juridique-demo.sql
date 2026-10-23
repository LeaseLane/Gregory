-- Juridique de démonstration (maquettes e46–e50), PRÉPRODUCTION SEULEMENT. Rejouable (chaque bloc vérifie s'il est déjà fait).
-- Trois dossiers au TAL (audience fixée, demande déposée, décision rendue) sur des locataires de l'univers fictif,
-- une mise en demeure rédigée et en attente d'approbation (Sophie Ménard, via la vraie fonction de rédaction),
-- et quatre modèles de plus. Révisions consignées « fictives » : en production, seul un admin consigne la vraie révision de l'avocate.
\set ON_ERROR_STOP on
begin;
do $$ begin
  if not exists (select 1 from public.owners where full_name = 'Marie-Josée Bérubé') then raise exception 'Pas la base de démonstration : refusé.'; end if;
end $$;

-- ── Modèles ──
update jur.templates set next_review_on = current_date + 140 where next_review_on is null;
insert into jur.templates (code, version, title, body, reviewed_by_lawyer, reviewed_on, next_review_on)
select v.code, v.version, v.titre, v.corps, 'Révision fictive (préproduction)', current_date - v.age, current_date + 150
from (values
  ('avis_modification_bail', 3, 'Avis de modification du bail',
   E'Québec, le {date_lettre}\n\n{nom}\n{adresse}\n\nObjet : avis de modification du bail\n\nMadame, Monsieur,\n\nAu renouvellement de votre bail, le loyer passera à {nouveau_loyer} par mois. Vous avez un mois à compter de la réception du présent avis pour nous faire part de votre refus; sans réponse, la modification est réputée acceptée (art. 1945 C.c.Q.).\n\n{signataire}, pour Lease Lane, mandataire du locateur', 280),
  ('refus_cession', 1, 'Refus de cession',
   E'Québec, le {date_lettre}\n\n{nom}\n{adresse}\n\nObjet : refus de la cession de bail\n\nMadame, Monsieur,\n\nLe locateur refuse la cession de votre bail à {cessionnaire} pour le motif sérieux suivant : {motif} (art. 1871 C.c.Q.).\n\n{signataire}, pour Lease Lane, mandataire du locateur', 51),
  ('avis_entree_24h', 2, 'Avis d’entrée de 24 h',
   E'Québec, le {date_lettre}\n\n{nom}\n{adresse}\n\nObjet : avis d’entrée dans le logement\n\nMadame, Monsieur,\n\n{fournisseur} passera dans votre logement {quand} pour la demande {demande}. Le présent avis vous est donné au moins 24 heures à l’avance (art. 1931 C.c.Q.).\n\n{signataire}, pour Lease Lane, mandataire du locateur', 164),
  ('demande_resiliation', 1, 'Demande de résiliation',
   E'Québec, le {date_lettre}\n\n{nom}\n{adresse}\n\nObjet : retard de plus de trois semaines dans le paiement du loyer\n\nMadame, Monsieur,\n\nLe loyer de {de_mois}, soit {montant}, est impayé depuis plus de trois semaines. Le locateur se réserve le droit de demander la résiliation du bail au Tribunal administratif du logement (art. 1971 C.c.Q.).\n\n{signataire}, pour Lease Lane, mandataire du locateur', 51)
) as v(code, version, titre, corps, age)
where not exists (select 1 from jur.templates t where t.code = v.code);

-- ── Dossiers au TAL ──
do $$
declare v_jn uuid := (select user_id from crm.team_members where display_name = 'Julie Normandeau');
  v_t uuid := (select id from jur.templates where code = 'mise_en_demeure_loyer' and reviewed_by_lawyer is not null order by version desc limit 1);
  r record; v_case uuid; v_lease uuid; v_tenant uuid; v_owner uuid;
begin
  if exists (select 1 from jur.cases where note like 'Démo TAL%') then raise notice 'Dossiers TAL déjà présents.'; return; end if;
  for r in select * from (values
    ('420, rue Saint-Joseph Est, Québec', '4', 1850.00, 'Non-paiement de loyer', 'tal', '812345', -70, -46, -21, 6, 'Visioconférence', 'Julie N. représente le locateur', null, null),
    ('1180, avenue Cartier, Québec', '1', 1380.00, 'Retards fréquents', 'tal', '815902', -60, -18, null, 12, 'TAL Québec · conciliation', 'Julie N. y assiste', null, null),
    ('640, 3e Avenue, Québec', '8', 2290.00, 'Non-paiement de loyer', 'regle', '806117', -150, -120, -80, -45, 'TAL Québec', 'Julie N. y assistait', -44, 'payé le ' || to_char(current_date - 44, 'DD/MM'))
  ) as x(adresse, numero, montant, motif, stage, tal, envoi, depot, avis, audience, mode, note, decision, decision_texte)
  loop
    select l.id, l.tenant_id, b.owner_id into v_lease, v_tenant, v_owner from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id
    where b.address = r.adresse and u.unit_number = r.numero and l.status = 'active';
    if v_lease is null then raise exception 'Bail introuvable : % — %', r.adresse, r.numero; end if;
    insert into jur.cases (lease_id, tenant_id, owner_id, amount, first_due, stage, opened_by, opened_at, note, motif, tal_number, tal_filed_at, hearing_at,
                           hearing_notice_on, hearing_mode, hearing_note, decision_on, decision_text, closed_at, close_reason)
    values (v_lease, v_tenant, v_owner, r.montant, current_date + r.envoi - 20, r.stage, v_jn, now() + make_interval(days => r.envoi - 5), 'Démo TAL · ' || r.motif, r.motif, r.tal,
            current_date + r.depot, ((current_date + r.audience)::timestamp + case when r.audience = 12 then interval '13 hours 30 minutes' else interval '9 hours 30 minutes' end) at time zone 'America/Toronto',
            case when r.avis is not null then current_date + r.avis end, r.mode, r.note, case when r.decision is not null then current_date + r.decision end, r.decision_texte,
            case when r.stage = 'regle' then now() + make_interval(days => r.decision) end, case when r.stage = 'regle' then 'paye' end)
    returning id into v_case;
    insert into jur.notices (case_id, template_id, template_version, body, amount, status, approved_by, approved_at, signer_name, signed_at, signature_simulated, sent_at, proof_mode, proof_detail, result, result_at, created_at)
    values (v_case, v_t, (select version from jur.templates where id = v_t), 'Mise en demeure · ' || r.motif, r.montant, 'sent', v_jn, now() + make_interval(days => r.envoi),
            'Julie Normandeau', now() + make_interval(days => r.envoi), true, now() + make_interval(days => r.envoi), 'huissier', 'Signifiée par huissier', 'tal', now() + make_interval(days => r.depot), now() + make_interval(days => r.envoi - 1));
  end loop;
  raise notice 'Trois dossiers au TAL créés.';
end $$;

-- ── Mise en demeure à approuver (e50) : Sophie Ménard, loyer d'octobre en retard ──
do $$
declare v_lease uuid; v_case uuid;
begin
  select l.id into v_lease from public.leases l join public.tenants t on t.id = l.tenant_id where t.full_name = 'Sophie Ménard' and l.status = 'active';
  if v_lease is null or exists (select 1 from jur.cases where lease_id = v_lease and stage in ('ouvert', 'mise_en_demeure', 'tal')) then raise notice 'Dossier Ménard déjà ouvert.'; return; end if;
  insert into jur.cases (lease_id, tenant_id, owner_id, amount, first_due, stage, opened_by, note)
  select v_lease, l.tenant_id, b.owner_id, 1100, date '2026-10-01', 'ouvert', (select user_id from crm.team_members where display_name = 'Julie Normandeau'), 'Deux rappels; paiement promis, toujours pas reçu.'
  from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where l.id = v_lease
  returning id into v_case;
  perform jur.rediger_mise_en_demeure(v_case);
  raise notice 'Mise en demeure de Sophie Ménard rédigée : à approuver.';
end $$;

select c.numero, c.stage, t.full_name, c.tal_number, c.hearing_at::date from jur.cases c join public.tenants t on t.id = c.tenant_id order by c.opened_at;
commit;
