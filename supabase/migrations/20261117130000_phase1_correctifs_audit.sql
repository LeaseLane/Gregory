-- Correctifs de l'audit logique de la phase 1 (17 nov. 2026) :
-- 1. Paiements partiels : un loyer partiellement payé compte pour ce qui a été reçu (avant : 0 $ tant que le loyer n'était pas soldé),
--    dans la vue d'ensemble (perçus, net, alerte de perception, flux sur 6 mois) et dans la ventilation du propriétaire.
-- 2. Alertes de dépense : chaque dépense inhabituelle a sa propre clé; en marquer une comme vue ne cache plus les suivantes du même mois.
-- 3. Autres revenus : la suppression respecte le verrouillage du mois, comme l'ajout.
-- 4. Import du parc : l'immeuble se reconnaît par une adresse normalisée (ponctuation, accents, espaces) et un client du même nom
--    avec un autre courriel est signalé au lieu d'être créé en double.
-- 5. Dépenses : seuls les travaux facturés comptent (une estimation n'est pas une dépense).

-- Montant reçu d'une échéance de loyer : soldée = montant reçu (ou le loyer), sinon ce qui a été reçu jusqu'ici.
create or replace function crm.loyer_recu(p_statut text, p_montant numeric, p_recu numeric) returns numeric language sql immutable set search_path = '' as $$
  select case when p_statut = 'paid' then coalesce(p_recu, p_montant) else coalesce(p_recu, 0) end;
$$;
-- Adresse comparable : minuscules, sans accents ni ponctuation, espaces réduits (« 501, rue Saint-Jean » = « 501 rue saint jean »).
create or replace function crm.adresse_cle(p text) returns text language sql immutable set search_path = '' as $$
  select btrim(regexp_replace(translate(lower(coalesce(p, '')), 'àâäáãéèêëíìîïóòôöõúùûüçñÿ', 'aaaaaeeeeiiiiooooouuuucny'), '[^a-z0-9]+', ' ', 'g'));
$$;

-- 2. une alerte vue se reconnaît aussi à sa clé (vide pour la trésorerie et la perception, une par dépense)
alter table fin.alertes_vues add column if not exists cle text not null default '';
alter table fin.alertes_vues drop constraint if exists alertes_vues_pkey;
alter table fin.alertes_vues add primary key (building_id, type, mois, cle);


create or replace function crm.depenses_immeubles(p_debut date, p_fin date) returns table (building_id uuid, le date, montant numeric, libelle text, sorte text)
language sql stable security definer set search_path = '' as $$
  select u.building_id, coalesce(w.worker_reported_done_at::date, w.created_at::date), w.invoice_total_cents / 100.0,
         coalesce(wk.company_name, wk.name, 'Fournisseur') || ' — ' || left(coalesce(w.description, 'travaux'), 60), 'travaux'
    from portee.work_orders w join portee.units u on u.id = w.unit_id left join public.workers wk on wk.id = w.worker_id
    where w.status = 'completed' and coalesce(w.worker_reported_done_at::date, w.created_at::date) >= p_debut and coalesce(w.worker_reported_done_at::date, w.created_at::date) < p_fin
      and w.invoice_total_cents is not null
  union all select d.building_id, d.created_at::date, d.amount, 'Débours — ' || left(d.description, 60), 'debours'
    from portee.external_disbursements d where d.building_id is not null and d.created_at::date >= p_debut and d.created_at::date < p_fin
  union all select pb.building_id, coalesce(pb.due_date, pb.created_at::date), pb.amount, coalesce(pb.vendor_name, 'Fournisseur') || ' — ' || left(coalesce(pb.description, 'facture'), 60), 'facture'
    from portee.payables pb where pb.building_id is not null and pb.work_order_id is null and pb.status in ('approved', 'paid')
      and coalesce(pb.due_date, pb.created_at::date) >= p_debut and coalesce(pb.due_date, pb.created_at::date) < p_fin;
$$;

create or replace function public.lanceur_finance_vue(p jsonb default '{}'::jsonb) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_m date := coalesce(date_trunc('month', nullif(p ->> 'mois', '')::date)::date, date_trunc('month', current_date)::date); v_f date := (v_m + interval '1 month')::date;
  s jsonb := crm.seuils_finance(); v_courant boolean := v_m = date_trunc('month', current_date)::date;
  v_pct numeric := (s ->> 'perception_min_pct')::numeric; v_jour int := (s ->> 'perception_jour')::int; v_fact numeric := (s ->> 'depense_facteur')::numeric;
  v_min numeric := (s ->> 'depense_min')::numeric; v_abs numeric := (s ->> 'depense_sans_historique')::numeric;
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne donne pas accès aux finances.' using errcode = 'PT403'; end if;
  return (
    with loy as (select u.building_id, sum(pa.amount) attendu, coalesce(sum(crm.loyer_recu(pa.status, pa.amount, pa.amount_received)), 0) paye,
                   count(*) filter (where pa.status <> 'paid' and pa.due_date < current_date) retards
                 from portee.payments pa join portee.leases l on l.id = pa.lease_id join portee.units u on u.id = l.unit_id where pa.due_date >= v_m and pa.due_date < v_f group by 1),
    aut as (select a.building_id, coalesce(sum(a.montant) filter (where a.type = 'stationnement'), 0) stationnement, coalesce(sum(a.montant) filter (where a.type = 'buanderie'), 0) buanderie,
                   coalesce(sum(a.montant) filter (where a.type = 'autre'), 0) autre
            from fin.autres_revenus a where a.le >= v_m and a.le < v_f and a.building_id in (select id from portee.buildings) group by 1),
    dep as (select * from crm.depenses_immeubles(v_m, v_f)),
    hist as (select h.building_id, count(*) n, (percentile_cont(0.5) within group (order by h.montant))::numeric mediane from crm.depenses_immeubles((v_m - interval '12 months')::date, v_m) h group by 1),
    inhab as (select d.building_id, d.le, d.montant, d.libelle, d.sorte, h.mediane
              from dep d left join hist h on h.building_id = d.building_id
              where d.montant >= v_min and case when coalesce(h.n, 0) >= 3 then d.montant >= v_fact * h.mediane else d.montant >= v_abs end),
    imm as (select b.id, b.owner_id, b.address, (select count(*) from portee.units u where u.building_id = b.id) logements,
              (select count(*) from portee.units u where u.building_id = b.id and exists (select 1 from portee.leases l where l.unit_id = u.id and l.status = 'active')) occupes,
              coalesce(l.attendu, 0) attendu, coalesce(l.paye, 0) paye, coalesce(l.retards, 0) retards,
              coalesce(a.stationnement, 0) stationnement, coalesce(a.buanderie, 0) buanderie, coalesce(a.autre, 0) autre,
              coalesce((select sum(d.montant) from dep d where d.building_id = b.id), 0) depenses
            from portee.buildings b left join loy l on l.building_id = b.id left join aut a on a.building_id = b.id),
    net as (select i.*, i.paye + i.stationnement + i.buanderie + i.autre - i.depenses net,
              (i.attendu > 0 and (not v_courant or extract(day from current_date) >= v_jour) and 100.0 * i.paye / i.attendu < v_pct) perception_faible from imm i),
    alertes as (
      select n.id building_id, n.owner_id, n.address, 'tresorerie' type, ''::text cle, 0 ordre, n.net montant, null::text sorte,
             'Flux de trésorerie négatif : ' || crm.argent_fr(n.depenses) || ' $ de dépenses pour ' || crm.argent_fr(n.paye + n.stationnement + n.buanderie + n.autre) || ' $ de revenus perçus.' texte
        from net n where n.net < 0 and n.depenses > 0
      union all select n.id, n.owner_id, n.address, 'perception', '', 1, n.attendu - n.paye, null,
             'Loyers perçus à ' || floor(100.0 * n.paye / n.attendu) || ' % (' || crm.argent_fr(n.attendu - n.paye) || ' $ à percevoir, ' || n.retards || ' en retard) : sous le seuil de ' || v_pct || ' %.'
        from net n where n.perception_faible
      union all select i.building_id, b.owner_id, b.address, 'depense', md5(i.sorte || i.le || i.montant || i.libelle), 2, i.montant, i.sorte,
             'Dépense inhabituelle : ' || i.libelle || ', ' || crm.argent_fr(i.montant) || ' $' ||
             case when i.mediane is not null then ' (médiane des 12 derniers mois : ' || crm.argent_fr(i.mediane) || ' $).' else ' (aucun historique pour comparer).' end
        from inhab i join portee.buildings b on b.id = i.building_id)
    select jsonb_build_object('mois', v_m, 'courant', v_courant, 'seuils', s,
      'total', (select jsonb_build_object('attendu', coalesce(sum(attendu), 0), 'paye', coalesce(sum(paye), 0), 'autres', coalesce(sum(stationnement + buanderie + autre), 0),
                  'depenses', coalesce(sum(depenses), 0), 'net', coalesce(sum(net), 0), 'immeubles', count(*), 'logements', coalesce(sum(logements), 0), 'occupes', coalesce(sum(occupes), 0)) from net),
      'clients', coalesce((select jsonb_agg(c order by c ->> 'nom') from (
          select jsonb_build_object('id', o.id, 'nom', o.full_name, 'attendu', sum(n.attendu), 'paye', sum(n.paye), 'autres', sum(n.stationnement + n.buanderie + n.autre), 'depenses', sum(n.depenses), 'net', sum(n.net),
            'alertes', (select count(*) from alertes a where a.owner_id = o.id and not exists (select 1 from fin.alertes_vues v where v.building_id = a.building_id and v.type = a.type and v.mois = v_m and v.cle = a.cle)),
            'immeubles', jsonb_agg(jsonb_build_object('id', n.id, 'adresse', n.address, 'logements', n.logements, 'occupes', n.occupes, 'attendu', n.attendu, 'paye', n.paye,
              'stationnement', n.stationnement, 'buanderie', n.buanderie, 'autre', n.autre, 'depenses', n.depenses, 'net', n.net,
              'alertes', (select count(*) from alertes a where a.building_id = n.id and not exists (select 1 from fin.alertes_vues v where v.building_id = a.building_id and v.type = a.type and v.mois = v_m and v.cle = a.cle))) order by n.address)) c
          from net n join portee.owners o on o.id = n.owner_id group by o.id, o.full_name) z), '[]'::jsonb),
      'alertes', coalesce((select jsonb_agg(jsonb_build_object('immeuble_id', a.building_id, 'immeuble', a.address, 'client', o.full_name, 'client_id', a.owner_id, 'type', a.type, 'cle', a.cle, 'texte', a.texte, 'montant', a.montant, 'sorte', a.sorte,
                      'vue', (select jsonb_build_object('par', crm.nom_membre(v.vu_par), 'le', v.vu_le, 'note', v.note) from fin.alertes_vues v where v.building_id = a.building_id and v.type = a.type and v.mois = v_m and v.cle = a.cle))
                    order by a.ordre, abs(a.montant) desc) from alertes a join portee.owners o on o.id = a.owner_id), '[]'::jsonb),
      -- flux de trésorerie des 6 derniers mois, sur la portée choisie
      'serie', (select jsonb_agg(jsonb_build_object('mois', m::date,
          'revenus', (select coalesce(sum(crm.loyer_recu(pa.status, pa.amount, pa.amount_received)), 0) from portee.payments pa where pa.due_date >= m and pa.due_date < m + interval '1 month')
                   + (select coalesce(sum(a.montant), 0) from fin.autres_revenus a where a.le >= m and a.le < m + interval '1 month' and a.building_id in (select id from portee.buildings)),
          'depenses', (select coalesce(sum(d.montant), 0) from crm.depenses_immeubles(m::date, (m + interval '1 month')::date) d)) order by m)
        from generate_series(v_m - interval '5 months', v_m, interval '1 month') m),
      'autres_revenus', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'immeuble', b.address, 'type', a.type, 'montant', a.montant, 'le', a.le, 'note', a.note) order by a.le desc, a.created_at desc)
                          from fin.autres_revenus a join portee.buildings b on b.id = a.building_id where a.le >= v_m and a.le < v_f), '[]'::jsonb),
      'immeubles', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'adresse', b.address) order by b.address) from portee.buildings b), '[]'::jsonb),
      'peut_ecrire', crm.can('finances.paiements.ecrire')));
end $$;

create or replace function public.lanceur_autre_revenu(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v uuid; v_m numeric := coalesce(nullif(p ->> 'montant', '')::numeric, 0); v_le date := coalesce(nullif(p ->> 'le', '')::date, current_date);
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas d’inscrire un revenu.' using errcode = 'PT403'; end if;
  if p ? 'supprimer' then
    if exists (select 1 from fin.autres_revenus r join fin.closings c on c.mois = date_trunc('month', r.le) where r.id = nullif(p ->> 'supprimer', '')::uuid) then
      raise exception 'Ce mois est verrouillé : le revenu ne peut plus être retiré.' using errcode = 'PT409'; end if;
    delete from fin.autres_revenus where id = (p ->> 'supprimer')::uuid returning id into v;
    if v is null then raise exception 'Revenu introuvable.' using errcode = 'PT404'; end if;
    perform crm.journal('other_income.deleted', 'fin.autres_revenus', v, null, null, 'record-other-income');
    return jsonb_build_object('id', v);
  end if;
  if not exists (select 1 from public.buildings where id = nullif(p ->> 'immeuble', '')::uuid) then raise exception 'Immeuble requis.' using errcode = 'PT422'; end if;
  if coalesce(p ->> 'type', '') not in ('stationnement', 'buanderie', 'autre') then raise exception 'Type de revenu requis : stationnement, buanderie ou autre.' using errcode = 'PT422'; end if;
  if v_m <= 0 then raise exception 'Montant requis.' using errcode = 'PT422'; end if;
  if v_le > current_date then raise exception 'La date ne peut pas être future.' using errcode = 'PT422'; end if;
  if exists (select 1 from fin.closings where mois = date_trunc('month', v_le)) then raise exception 'Ce mois est verrouillé.' using errcode = 'PT409'; end if;
  insert into fin.autres_revenus (building_id, type, montant, le, note, created_by) values ((p ->> 'immeuble')::uuid, p ->> 'type', v_m, v_le, nullif(btrim(p ->> 'note'), ''), auth.uid()) returning id into v;
  perform crm.journal('other_income.recorded', 'fin.autres_revenus', v, null, p, 'record-other-income');
  return jsonb_build_object('id', v);
end $$;

create or replace function public.lanceur_alerte_vue(p jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare v_b uuid := nullif(p ->> 'immeuble', '')::uuid; v_cle text := coalesce(p ->> 'cle', ''); v_m date := date_trunc('month', nullif(p ->> 'mois', '')::date)::date;
begin
  perform crm.require_aal2();
  if not crm.can('finances.paiements.ecrire') then raise exception 'Votre rôle ne permet pas de traiter une alerte.' using errcode = 'PT403'; end if;
  if v_m is null or coalesce(p ->> 'type', '') not in ('tresorerie', 'perception', 'depense') or not exists (select 1 from public.buildings where id = v_b) then raise exception 'Alerte inconnue.' using errcode = 'PT422'; end if;
  if coalesce((p ->> 'rouvrir')::boolean, false) then delete from fin.alertes_vues where building_id = v_b and type = p ->> 'type' and mois = v_m and cle = v_cle;
  else insert into fin.alertes_vues (building_id, type, mois, cle, note, vu_par) values (v_b, p ->> 'type', v_m, v_cle, nullif(btrim(p ->> 'note'), ''), auth.uid())
       on conflict (building_id, type, mois, cle) do update set note = excluded.note, vu_par = excluded.vu_par, vu_le = now();
  end if;
  perform crm.journal(case when coalesce((p ->> 'rouvrir')::boolean, false) then 'finance_alert.reopened' else 'finance_alert.seen' end, 'public.buildings', v_b, null, p, 'review-finance-alert');
end $$;

create or replace function crm.ventilation_proprio(p_owner uuid, p_mois date) returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('immeuble', b.address,
      'loyers', coalesce((select sum(crm.loyer_recu(pa.status, pa.amount, pa.amount_received)) from public.payments pa join public.leases l on l.id = pa.lease_id join public.units u on u.id = l.unit_id
                  where u.building_id = b.id and pa.due_date >= date_trunc('month', p_mois) and pa.due_date < date_trunc('month', p_mois) + interval '1 month'), 0),
      'stationnement', coalesce((select sum(a.montant) from fin.autres_revenus a where a.building_id = b.id and a.type = 'stationnement' and a.le >= date_trunc('month', p_mois) and a.le < date_trunc('month', p_mois) + interval '1 month'), 0),
      'buanderie', coalesce((select sum(a.montant) from fin.autres_revenus a where a.building_id = b.id and a.type = 'buanderie' and a.le >= date_trunc('month', p_mois) and a.le < date_trunc('month', p_mois) + interval '1 month'), 0),
      'autre', coalesce((select sum(a.montant) from fin.autres_revenus a where a.building_id = b.id and a.type = 'autre' and a.le >= date_trunc('month', p_mois) and a.le < date_trunc('month', p_mois) + interval '1 month'), 0),
      'locataires', coalesce((select jsonb_agg(jsonb_build_object('locataire', t.full_name, 'logement', u.unit_number, 'attendu', pa.amount, 'paye', crm.loyer_recu(pa.status, pa.amount, pa.amount_received),
                      'statut', case when pa.status = 'paid' then 'paye' when coalesce(pa.amount_received, 0) > 0 then 'partiel' when pa.due_date < current_date then 'retard' else 'a_venir' end) order by u.unit_number, t.full_name)
                    from public.payments pa join public.leases l on l.id = pa.lease_id join public.units u on u.id = l.unit_id join public.tenants t on t.id = l.tenant_id
                    where u.building_id = b.id and pa.due_date >= date_trunc('month', p_mois) and pa.due_date < date_trunc('month', p_mois) + interval '1 month'), '[]'::jsonb)) order by b.address), '[]'::jsonb)
  from public.buildings b where b.owner_id = p_owner;
$$;

create or replace function public.lanceur_import_parc(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_importer boolean := coalesce((p ->> 'importer')::boolean, false); v_lignes jsonb := coalesce(p -> 'lignes', '[]'::jsonb); n int := jsonb_array_length(coalesce(p -> 'lignes', '[]'::jsonb));
  x jsonb; k int := 0; v_rapport jsonb := '[]'::jsonb; v_seg jsonb; c_clients int := 0; c_imm int := 0; c_log int := 0; c_baux int := 0; c_err int := 0; c_exist int := 0;
  v_o uuid; v_b uuid; v_u uuid; v_t uuid; v_bo uuid; v_nom text; v_mail text; v_adr text; v_num text; v_loyer numeric; v_loc text; v_lmail text; v_debut date; v_fin date;
  v_faits text[]; v_msg text; v_touches uuid[] := '{}';
begin
  perform crm.require_aal2();
  if not (crm.can('clients.ecrire') and crm.can('immeubles.ecrire')) then raise exception 'Votre rôle ne permet pas d’importer un parc (clients et immeubles en écriture requis).' using errcode = 'PT403'; end if;
  if n = 0 then raise exception 'Le fichier ne contient aucune ligne.' using errcode = 'PT422'; end if;
  if n > 2000 then raise exception 'Le fichier dépasse 2 000 lignes : séparez-le par client.' using errcode = 'PT422'; end if;
  begin
    for x in select * from jsonb_array_elements(v_lignes) loop
      k := k + 1; v_faits := '{}';
      begin
        v_nom := nullif(btrim(x ->> 'proprietaire'), ''); v_mail := nullif(lower(btrim(x ->> 'courriel_proprietaire')), ''); v_adr := nullif(btrim(x ->> 'immeuble'), '');
        v_num := nullif(btrim(x ->> 'logement'), ''); v_loc := nullif(btrim(x ->> 'locataire'), ''); v_lmail := nullif(lower(btrim(x ->> 'courriel_locataire')), '');
        v_loyer := nullif(replace(regexp_replace(coalesce(x ->> 'loyer', ''), '[^0-9.,]', '', 'g'), ',', '.'), '')::numeric;
        -- Segmentation : chaque ligne doit nommer son client, son immeuble et son logement.
        if v_nom is null and v_mail is null then raise exception 'Client manquant : la ligne ne dit pas à quel propriétaire elle appartient.'; end if;
        if v_adr is null or char_length(v_adr) < 5 then raise exception 'Immeuble manquant : adresse requise.'; end if;
        if v_num is null then raise exception 'Logement manquant : numéro de logement requis.'; end if;
        begin v_debut := nullif(btrim(x ->> 'debut'), '')::date; v_fin := nullif(btrim(x ->> 'fin'), '')::date;
        exception when others then raise exception 'Date de bail illisible (format attendu : AAAA-MM-JJ).'; end;

        -- 1. le client : par son courriel, sinon par son nom exact
        select o.id into v_o from public.owners o left join auth.users u on u.id = o.user_id
          where (v_mail is not null and lower(coalesce(o.email, u.email)) = v_mail) or (v_mail is null and lower(btrim(o.full_name)) = lower(v_nom)) order by o.created_at limit 1;
        -- même nom, autre courriel : on ne crée pas un deuxième client sans qu'une personne tranche
        if v_o is null and v_nom is not null and v_mail is not null then
          select o.id, lower(coalesce(o.email, u.email)) into v_bo, v_msg from public.owners o left join auth.users u on u.id = o.user_id
            where lower(btrim(o.full_name)) = lower(v_nom) order by o.created_at limit 1;
          if v_bo is not null and v_msg is null then v_o := v_bo;
          elsif v_bo is not null then raise exception 'Client « % » déjà au dossier avec un autre courriel (%) : corrigez le courriel du fichier ou de la fiche.', v_nom, v_msg; end if;
          v_bo := null; v_msg := null;
        end if;
        if v_o is null then
          if v_nom is null then raise exception 'Client inconnu (%) : son nom est requis pour le créer.', v_mail; end if;
          if v_mail is null then raise exception 'Client inconnu (%) : son courriel est requis pour le créer.', v_nom; end if;
          v_o := (public.lanceur_creer_client(jsonb_build_object('type', 'proprietaire', 'nom', v_nom, 'courriel', v_mail)) ->> 'id')::uuid;
          c_clients := c_clients + 1; v_faits := v_faits || 'client créé'::text;
        end if;

        -- 2. l'immeuble : par son adresse; une adresse déjà rattachée à un AUTRE client est refusée
        select b.id, b.owner_id into v_b, v_bo from public.buildings b where crm.adresse_cle(b.address) = crm.adresse_cle(v_adr) order by b.created_at limit 1;
        if v_b is not null and v_bo is distinct from v_o then
          raise exception 'Segmentation : cette adresse appartient déjà à un autre client (%).', coalesce((select full_name from public.owners where id = v_bo), 'sans propriétaire');
        end if;
        if v_b is null then
          v_b := (public.lanceur_creer_immeuble(jsonb_build_object('owner_id', v_o, 'adresse', v_adr, 'creer_logements', false,
                   'logements', (select count(*) from jsonb_array_elements(v_lignes) y where crm.adresse_cle(y ->> 'immeuble') = crm.adresse_cle(v_adr)))) ->> 'id')::uuid;
          c_imm := c_imm + 1; v_faits := v_faits || 'immeuble créé'::text;
        end if;

        -- 3. le logement
        select u.id into v_u from public.units u where u.building_id = v_b and lower(btrim(u.unit_number)) = lower(v_num) limit 1;
        if v_u is null then
          insert into public.units (building_id, unit_number, status, rent) values (v_b, v_num, 'available', v_loyer) returning id into v_u;
          c_log := c_log + 1; v_faits := v_faits || 'logement créé'::text;
        end if;

        -- 4. le locataire et son bail (facultatifs : un logement vacant n'en a pas)
        if v_loc is not null then
          if exists (select 1 from public.leases l where l.unit_id = v_u and l.status in ('active', 'renewed', 'a_venir')) then
            if cardinality(v_faits) = 0 then c_exist := c_exist + 1; v_rapport := v_rapport || jsonb_build_object('ligne', k, 'etat', 'existant', 'message', 'Déjà au dossier : ce logement a un bail en cours.'); v_touches := v_touches || v_b; continue; end if;
            raise exception 'Ce logement a déjà un bail en cours.';
          end if;
          if v_loyer is null or v_loyer <= 0 then raise exception 'Loyer requis pour créer le bail de %.', v_loc; end if;
          if v_debut is null then raise exception 'Date de début du bail requise pour %.', v_loc; end if;
          select t.id into v_t from public.tenants t where v_lmail is not null and lower(t.email) = v_lmail and t.anonymized_at is null limit 1;
          perform public.lanceur_bail_creer(jsonb_strip_nulls(jsonb_build_object('unit_id', v_u, 'tenant_id', v_t, 'nom', v_loc, 'courriel', v_lmail, 'telephone', nullif(btrim(x ->> 'telephone_locataire'), ''),
            'loyer', v_loyer::text, 'debut', v_debut::text, 'fin', v_fin::text)));
          c_baux := c_baux + 1; v_faits := v_faits || 'bail créé'::text;
        end if;
        v_touches := v_touches || v_b;
        if cardinality(v_faits) = 0 then c_exist := c_exist + 1; v_rapport := v_rapport || jsonb_build_object('ligne', k, 'etat', 'existant', 'message', 'Déjà au dossier : rien à créer.');
        else v_rapport := v_rapport || jsonb_build_object('ligne', k, 'etat', 'ok', 'message', array_to_string(v_faits, ', ')); end if;
      exception when others then
        -- la ligne fautive est annulée seule (sous-transaction); son message va au rapport
        c_err := c_err + 1; v_rapport := v_rapport || jsonb_build_object('ligne', k, 'etat', 'erreur', 'message', sqlerrm);
        -- un client ou un immeuble créé par cette ligne puis annulé : les compteurs reculent
        if 'client créé' = any(v_faits) then c_clients := c_clients - 1; end if; if 'immeuble créé' = any(v_faits) then c_imm := c_imm - 1; end if;
        if 'logement créé' = any(v_faits) then c_log := c_log - 1; end if; if 'bail créé' = any(v_faits) then c_baux := c_baux - 1; end if;
      end;
    end loop;
    -- Segmentation obtenue : chaque client du fichier, ses immeubles, leurs logements et leurs baux (après import).
    select coalesce(jsonb_agg(c order by c ->> 'client'), '[]'::jsonb) into v_seg from (
      select jsonb_build_object('client', o.full_name, 'immeubles', jsonb_agg(jsonb_build_object('adresse', b.address,
               'logements', (select count(*) from public.units u where u.building_id = b.id),
               'baux', (select count(*) from public.leases l join public.units u on u.id = l.unit_id where u.building_id = b.id and l.status in ('active', 'renewed', 'a_venir'))) order by b.address)) c
      from public.buildings b join public.owners o on o.id = b.owner_id where b.id = any(v_touches) group by o.id, o.full_name) z;
    if not v_importer then raise exception using errcode = 'LLDRY', message = 'essai à blanc'; end if;
  exception when sqlstate 'LLDRY' then null;   -- essai à blanc : tout ce qui précède est annulé, le rapport reste
  end;
  if v_importer then perform crm.journal('portfolio.imported', 'public.buildings', null, null,
    jsonb_build_object('lignes', n, 'clients', c_clients, 'immeubles', c_imm, 'logements', c_log, 'baux', c_baux, 'erreurs', c_err, 'fichier', left(p ->> 'fichier', 120)), 'import-portfolio'); end if;
  return jsonb_build_object('importe', v_importer, 'lignes', n, 'erreurs', c_err, 'existantes', c_exist, 'crees', jsonb_build_object('clients', c_clients, 'immeubles', c_imm, 'logements', c_log, 'baux', c_baux),
    'segmentation', v_seg, 'rapport', v_rapport);
end $$;
