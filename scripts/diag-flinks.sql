-- Destinataires des rappels d'onboarding. Lecture seule.
-- Reprend exactement le filtre de flag_incomplete_onboarding().
\pset format aligned
\pset border 2
select u.email,
       o.full_name,
       to_char(o.created_at,'YYYY-MM-DD') as cree_le,
       o.onboarding_reminder_count as rappels,
       to_char(o.onboarding_reminder_sent_at,'YYYY-MM-DD') as dernier_envoi,
       concat_ws(', ',
         case when c.missing_phone then 'téléphone' end,
         case when c.missing_buildings then 'immeubles' end,
         case when c.missing_units then 'unités' end,
         case when c.units_missing_rent_count > 0 then c.units_missing_rent_count || ' loyers' end,
         case when c.occupied_units_missing_lease_count > 0 then c.occupied_units_missing_lease_count || ' baux' end,
         case when c.active_leases_missing_tenant_contact_count > 0 then 'contacts locataires' end,
         case when c.active_leases_missing_bail_doc_count > 0 then 'copies de bail' end
       ) as manque
from owner_onboarding_checklist c
join owners o on o.id = c.owner_id
left join users u on u.id = o.user_id
where o.onboarding_completed_at is null
  and o.created_at <= now() - interval '3 days'
  and (o.onboarding_reminder_sent_at is null or o.onboarding_reminder_sent_at <= now() - interval '5 days')
  and (c.missing_phone or c.missing_buildings or c.missing_units
       or c.units_missing_rent_count > 0 or c.occupied_units_missing_lease_count > 0
       or c.active_leases_missing_tenant_contact_count > 0 or c.active_leases_missing_bail_doc_count > 0)
order by o.created_at;
