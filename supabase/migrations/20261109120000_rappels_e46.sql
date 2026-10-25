-- Juridique · Rappels (e46) : séquences de la semaine (en cours ET arrêtées : payé, entente, nouvel essai de prélèvement),
-- étape à laquelle les loyers en retard ont été payés sur 12 mois, résumé des arrêts de la semaine.
-- Lecture seulement, à partir de public.payments, jur.cases et jur.notices (rien n'est inventé : sans retard, la page est vide).

create or replace function public.lanceur_rappels() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_lundi date := date_trunc('week', now() at time zone 'America/Toronto')::date;
begin
  perform crm.require_aal2();
  if not crm.can('juridique.lire') then raise exception 'Votre rôle ne donne pas accès au Juridique.' using errcode = 'PT403'; end if;
  return jsonb_build_object(
    -- une ligne par bail : loyers impayés en cours, ou séquence arrêtée cette semaine
    'lignes', coalesce((select jsonb_agg(x order by x ->> 'ordre', (x ->> 'jours')::int desc) from (
      select jsonb_build_object('lease_id', le.id, 'locataire', tn.full_name, 'logement', b.address || coalesce(' — ' || u.unit_number, ''),
        'montant', sum(case when p.status <> 'paid' then p.amount - coalesce(p.amount_received, 0) else p.amount end),
        'jours', max(current_date - p.due_date) filter (where p.status <> 'paid'),
        'pause', bool_or(p.reminder_paused) filter (where p.status <> 'paid'),
        'essai', max(p.due_date) filter (where p.status <> 'paid' and p.collection_status = 'scheduled' and p.collection_error is not null),
        'paye_le', max(p.paid_date) filter (where p.status = 'paid' and p.paid_date >= v_lundi and p.paid_date > p.due_date),
        'paye_jours', max(p.paid_date - p.due_date) filter (where p.status = 'paid' and p.paid_date >= v_lundi and p.paid_date > p.due_date),
        'dossier', (select c.numero from jur.cases c where c.lease_id = le.id and c.stage in ('ouvert', 'mise_en_demeure', 'tal') limit 1),
        'dossier_etape', (select c.stage from jur.cases c where c.lease_id = le.id and c.stage in ('ouvert', 'mise_en_demeure', 'tal') limit 1),
        'med', (select n.status from jur.notices n join jur.cases c on c.id = n.case_id where c.lease_id = le.id and c.stage in ('ouvert', 'mise_en_demeure', 'tal') order by n.created_at desc limit 1),
        'ordre', case when bool_or(p.status <> 'paid') and not coalesce(bool_or(p.reminder_paused) filter (where p.status <> 'paid'), false) then '1' else '2' end) x
      from public.payments p join public.leases le on le.id = p.lease_id join public.units u on u.id = le.unit_id join public.buildings b on b.id = u.building_id
      left join public.tenants tn on tn.id = le.tenant_id
      where (p.status <> 'paid' and p.due_date < current_date) or (p.status = 'paid' and p.paid_date >= v_lundi and p.paid_date > p.due_date)
      group by le.id, tn.full_name, b.address, u.unit_number) z), '[]'),
    -- 12 mois : à quelle étape le loyer en retard a été payé (délai de paiement, et TAL si un dossier y est allé)
    'etapes', (select jsonb_build_object('total', count(*),
        'sms', count(*) filter (where t.delai between 1 and 6 and not t.tal), 'courriel', count(*) filter (where t.delai between 7 and 11 and not t.tal),
        'med', count(*) filter (where t.delai >= 12 and not t.tal), 'tal', count(*) filter (where t.tal))
      from (select p.paid_date - p.due_date delai, exists (select 1 from jur.cases c where c.lease_id = p.lease_id and c.tal_filed_at is not null and c.tal_filed_at <= p.paid_date) tal
            from public.payments p where p.status = 'paid' and p.paid_date > p.due_date and p.due_date >= current_date - 365) t),
    'semaine', jsonb_build_object('payes', (select count(distinct p.lease_id) from public.payments p where p.status = 'paid' and p.paid_date >= v_lundi and p.paid_date > p.due_date),
      'ententes', (select count(distinct p.lease_id) from public.payments p where p.status <> 'paid' and p.reminder_paused and p.due_date < current_date)),
    'auto', coalesce((select valeur from config.parametres where cle = 'juridique_auto'), 'false'::jsonb) = 'true'::jsonb);
end $$;
revoke all on function public.lanceur_rappels() from public, anon;
grant execute on function public.lanceur_rappels() to authenticated;
