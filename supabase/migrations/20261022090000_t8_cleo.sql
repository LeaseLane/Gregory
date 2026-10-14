-- T8c · Cléo dans le CRM (maquettes e02 palette ⌘K, e03 conversation). Spec : inventaire-ecrans.md (search-everything, ask-cleo).
--   • lanceur_recherche(q) : fiches, actions et dossiers que la personne a le droit de voir (permissions par espace), 5 par groupe.
--   • lanceur_cleo_contexte(q) : faits courts et datés que Cléo peut citer, chacun avec sa source (libellé + lien). Lu avec le jeton
--     de la personne : Cléo ne voit que ce que la personne voit.
--   • Cléo ne modifie rien. Sa seule « action proposée » est une proposition DÉJÀ en attente dans « À approuver » (une personne
--     l'approuve depuis le panneau) ou un lien vers l'écran où une personne agit.
--   • Chaque conversation est mesurée dans crm.agent_runs (agent « cleo », jetons, coût) : métadonnées seulement, aucun contenu.

create or replace function crm.motif(q text) returns text language sql immutable set search_path = '' as $$
  select '%' || replace(replace(replace(lower(btrim(coalesce(q, ''))), '\', '\\'), '%', '\%'), '_', '\_') || '%'
$$;

create or replace function public.lanceur_recherche(q text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare m text := crm.motif(q);
begin
  if not crm.is_team_member() then raise exception 'Réservé à l''équipe Lease Lane.' using errcode = 'PT403'; end if;
  if char_length(btrim(coalesce(q, ''))) < 2 then return jsonb_build_object('fiches', '[]'::jsonb, 'actions', '[]'::jsonb); end if;
  return jsonb_build_object(
    'actions', coalesce((select jsonb_agg(a) from (select jsonb_build_object('type', 'proposition', 'id', pr.id,
        'titre', case pr.operation when 'approve-formal-notice' then 'Approuver la mise en demeure de ' || coalesce(tn.full_name, '…') else 'Décider : ' || left(pr.reason, 80) end,
        'droite', initcap(pr.espace), 'lien', case pr.operation when 'approve-formal-notice' then '/juridique?d=' || n.case_id else '/operations/a-approuver' end) a
      from crm.proposals pr left join jur.notices n on pr.operation = 'approve-formal-notice' and n.id = pr.target_id left join jur.cases c on c.id = n.case_id left join public.tenants tn on tn.id = c.tenant_id
      where pr.status = 'pending' and (crm.can(pr.permission) or pr.assignee_user_id = auth.uid())
        and (lower(pr.reason) like m or lower(coalesce(tn.full_name, '')) like m or lower(coalesce(pr.source_ref, '')) like m) order by pr.created_at desc limit 3) x), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('type', 'appel', 'titre', 'Appeler ' || t.full_name, 'droite', t.phone, 'lien', 'tel:' || regexp_replace(t.phone, '[^0-9+]', '', 'g')))
        from (select full_name, phone from public.tenants where crm.can('clients.lire') and phone is not null and anonymized_at is null and lower(full_name) like m order by full_name limit 2) t), '[]'::jsonb),
    'fiches', coalesce((select jsonb_agg(f) from (
        (select jsonb_build_object('type', 'locataire', 'titre', t.full_name, 'droite', 'Locataire' || coalesce(' · ' || x.lieu, ''), 'ini', true,
            'lien', coalesce('/juridique?d=' || x.dossier, '/clients/processus')) f
           from public.tenants t left join lateral (select b.address || coalesce(' — ' || u.unit_number, '') as lieu,
              (select c.id::text from jur.cases c where c.lease_id = l.id and c.stage in ('ouvert', 'mise_en_demeure', 'tal')) as dossier
              from public.leases l join public.units u on u.id = l.unit_id join public.buildings b on b.id = u.building_id where l.tenant_id = t.id order by l.status = 'active' desc, l.start_date desc limit 1) x on true
           where crm.can('clients.lire') and t.anonymized_at is null and lower(t.full_name) like m order by t.full_name limit 4)
        union all
        (select jsonb_build_object('type', 'proprietaire', 'titre', o.full_name, 'droite', 'Propriétaire' || coalesce(' · ' || o.company_name, ''), 'ini', true, 'lien', '/clients/documents')
           from public.owners o where crm.can('clients.lire') and (lower(o.full_name) like m or lower(coalesce(o.company_name, '')) like m) order by o.full_name limit 3)
        union all
        (select jsonb_build_object('type', 'dossier', 'titre', 'Dossier ' || c.numero || ' · recouvrement', 'droite', coalesce(t.full_name, '') || ' · ' || comms.montant_court(c.amount), 'icone', 'scale', 'lien', '/juridique?d=' || c.id)
           from jur.cases c left join public.tenants t on t.id = c.tenant_id where crm.can('juridique.lire') and (lower(c.numero) like m or lower(coalesce(t.full_name, '')) like m) order by c.opened_at desc limit 3)
        union all
        (select jsonb_build_object('type', 'deal', 'titre', d.title, 'droite', 'Ventes · ' || d.number, 'icone', 'trend', 'lien', '/ventes/deals/' || d.id)
           from crm.deals d where crm.can('ventes.lire') and (lower(d.title) like m or lower(coalesce(d.subtitle, '')) like m or lower(d.number) like m) order by d.created_at desc limit 3)
        union all
        (select jsonb_build_object('type', 'bon', 'titre', wo.description, 'droite', 'Maintenance · ' || b.address || coalesce(' — ' || u.unit_number, ''), 'icone', 'wrench', 'lien', '/maintenance/soumissions?bt=' || wo.id)
           from public.work_orders wo left join public.units u on u.id = wo.unit_id left join public.buildings b on b.id = u.building_id
           where crm.can('maintenance.lire') and (lower(wo.description) like m or lower(coalesce(b.address, '')) like m) order by wo.created_at desc limit 3)
        union all
        (select jsonb_build_object('type', 'cession', 'titre', case a.kind when 'cession' then 'Cession · ' else 'Sous-location · ' end || a.person_name, 'droite', 'Demande ' || a.numero, 'icone', 'users', 'lien', '/clients/cessions')
           from crm.assignments a where crm.can('clients.lire') and lower(a.person_name) like m order by a.created_at desc limit 2)
      ) z), '[]'::jsonb));
end $$;

-- Faits que Cléo peut citer (courts, datés, avec leur source). Les montants sont ceux des registres.
create or replace function public.lanceur_cleo_contexte(q text default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v jsonb := '[]'::jsonb;
begin
  if not crm.is_team_member() then raise exception 'Réservé à l''équipe Lease Lane.' using errcode = 'PT403'; end if;
  if crm.can('juridique.lire') or crm.can('finances.lire') then
    v := v || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Loyer en retard', 'personne', x.locataire, 'logement', x.logement, 'montant', x.montant, 'jours_retard', x.jours,
        'etat', coalesce(x.etat, case when x.jours >= 12 then 'mise en demeure à préparer' when x.jours >= 7 then 'courriel de relance (J+7) envoyé ou prévu' else 'SMS de rappel (J+1) envoyé ou prévu' end),
        'source', jsonb_build_object('libelle', coalesce('Dossier ' || x.numero, 'Registre des paiements'), 'lien', coalesce('/juridique?d=' || x.dossier, '/juridique/rappels'))))
      from (select tn.full_name as locataire, b.address || coalesce(' — ' || u.unit_number, '') as logement, sum(p.amount - coalesce(p.amount_received, 0)) as montant, max(current_date - p.due_date) as jours,
                   c.numero, c.id::text as dossier,
                   case when n.status = 'draft' then 'mise en demeure à approuver' when n.status = 'approved' then 'mise en demeure approuvée, à signer' when n.status = 'sent' then 'mise en demeure envoyée'
                        when c.stage = 'tal' then 'dossier au TAL' when c.id is not null then 'dossier ouvert' end as etat
            from public.payments p join public.leases le on le.id = p.lease_id join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id
            left join public.tenants tn on tn.id = le.tenant_id
            left join jur.cases c on c.lease_id = le.id and c.stage in ('ouvert', 'mise_en_demeure', 'tal')
            left join lateral (select status from jur.notices where case_id = c.id and status <> 'cancelled' order by created_at desc limit 1) n on true
            where p.status <> 'paid' and p.due_date < current_date and le.status = 'active'
            group by tn.full_name, b.address, u.unit_number, c.numero, c.id, n.status, c.stage order by max(current_date - p.due_date) desc limit 12) x), '[]'::jsonb);
  end if;
  v := v || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Proposition en attente', 'proposition_id', pr.id, 'operation', pr.operation, 'agent', pr.agent, 'espace', pr.espace, 'resume', left(pr.reason, 200),
      'creee', to_char(pr.created_at at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI'), 'source', jsonb_build_object('libelle', 'À approuver', 'lien',
        case pr.operation when 'approve-formal-notice' then '/juridique?d=' || (select n.case_id from jur.notices n where n.id = pr.target_id) else '/operations/a-approuver' end)))
    from (select * from crm.proposals where status = 'pending' and (crm.can(permission) or assignee_user_id = auth.uid()) order by created_at desc limit 10) pr), '[]'::jsonb);
  v := v || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Tâche', 'titre', t.title, 'contexte', t.context, 'echeance', to_char(t.due_at at time zone 'America/Toronto', 'YYYY-MM-DD'),
      'en_retard', t.due_at < now(), 'source', jsonb_build_object('libelle', 'Mes tâches', 'lien', '/operations/taches')))
    from (select * from crm.tasks where status = 'open' and (assignee_user_id = auth.uid() or assignee_role = crm.role_actuel()) and due_at < now() + interval '2 days' order by due_at limit 10) t), '[]'::jsonb);
  if crm.can('maintenance.lire') then
    v := v || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Soumissions à décider', 'bon', wo.description, 'soumissions', (select count(*) from maint.quotes q where q.work_order_id = wo.id and q.status = 'received'),
        'source', jsonb_build_object('libelle', 'Soumissions', 'lien', '/maintenance/soumissions?bt=' || wo.id)))
      from public.work_orders wo where exists (select 1 from maint.quotes q where q.work_order_id = wo.id and q.status = 'received')
        and not exists (select 1 from maint.quotes q where q.work_order_id = wo.id and q.status = 'selected') limit 5), '[]'::jsonb);
  end if;
  if crm.can('clients.lire') then
    v := v || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Processus en cours', 'processus', t.name, 'etape', t.definition -> 'etapes' ->> p.step, 'logement', b.address || coalesce(' — ' || u.unit_number, ''),
        'echeance', to_char(p.due_at, 'YYYY-MM-DD'), 'source', jsonb_build_object('libelle', 'Processus', 'lien', '/clients/processus')))
      from (select * from crm.processes where status = 'active' order by due_at nulls last limit 8) p join crm.process_templates t on t.id = p.template_id
      left join public.leases l on l.id = p.lease_id left join public.units u on u.id = l.unit_id left join public.buildings b on b.id = u.building_id), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Demande de cession ou sous-location', 'personne', a.person_name, 'statut', a.status, 'reponse_due', to_char(a.deadline_at, 'YYYY-MM-DD'),
        'source', jsonb_build_object('libelle', 'Cessions et sous-locations', 'lien', '/clients/cessions')))
      from crm.assignments a where a.status in ('recue', 'solvabilite', 'accord_proprietaire')), '[]'::jsonb);
  end if;
  if char_length(btrim(coalesce(q, ''))) >= 2 then
    v := v || coalesce((select jsonb_agg(jsonb_build_object('fait', 'Fiche trouvée', 'type', f ->> 'type', 'titre', f ->> 'titre', 'detail', f ->> 'droite',
        'source', jsonb_build_object('libelle', f ->> 'titre', 'lien', f ->> 'lien')))
      from jsonb_array_elements(public.lanceur_recherche(q) -> 'fiches') f), '[]'::jsonb);
  end if;
  return jsonb_build_object('aujourdhui', to_char(now() at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI'), 'personne', crm.nom_membre(auth.uid()), 'role', crm.role_actuel(), 'faits', v);
end $$;

-- Mesure d'une conversation (fonction « cleo », clé de service) : métadonnées seulement.
create or replace function public.service_cleo_mesure(p jsonb) returns void language sql security definer set search_path = '' as $$
  insert into crm.agent_runs (agent, started_by, criteres, finished_at, tokens_in, tokens_out, cout_cents, erreur)
  values ('cleo', (p ->> 'par')::uuid, jsonb_build_object('faits', (p ->> 'faits')::int, 'modele', p ->> 'modele'), now(), (p ->> 'entree')::int, (p ->> 'sortie')::int, (p ->> 'cout')::int, p ->> 'erreur')
$$;

revoke all on function crm.motif(text) from public, anon;
revoke all on function public.lanceur_recherche(text), public.lanceur_cleo_contexte(text) from public, anon;
grant execute on function public.lanceur_recherche(text), public.lanceur_cleo_contexte(text) to authenticated;
revoke all on function public.service_cleo_mesure(jsonb) from public, anon, authenticated;
grant execute on function public.service_cleo_mesure(jsonb) to service_role;
