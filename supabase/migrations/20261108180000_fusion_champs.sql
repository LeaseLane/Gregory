-- Ventes · Fusionner les fiches (maquette e18) : les deux fiches côte à côte, champ par champ; on choisit la fiche principale
-- et, pour le courriel, le téléphone et le deal, la valeur gardée en premier. Rien n'est perdu : l'autre valeur reste en second,
-- l'autre deal est marqué fusionné dans celui qu'on garde (s'ils sont dans le même pipeline).

create or replace function crm.fiche_doublon(p uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', c.id, 'nom', c.full_name, 'emails', c.emails, 'phones', c.phones_e164,
    'detail', case when c.owner_id is not null then 'Client depuis ' || (select extract(year from o.created_at)::int from public.owners o where o.id = c.owner_id)
                   when c.tenant_id is not null then 'Locataire' else 'Nouveau lead' end,
    'sous', coalesce((select so.name || ' · ' || crm.heure_courte(d.created_at) from crm.deal_contacts dc join crm.deals d on d.id = dc.deal_id left join crm.sources so on so.id = d.source_id
                       where dc.contact_id = c.id and d.merged_into is null order by d.created_at desc limit 1), to_char(c.created_at, 'DD/MM/YYYY')),
    'adresse', coalesce((select o.mailing_address from public.owners o where o.id = c.owner_id),
                        (select d.subtitle from crm.deal_contacts dc join crm.deals d on d.id = dc.deal_id where dc.contact_id = c.id and d.merged_into is null order by d.created_at desc limit 1)),
    'deals', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'texte', concat_ws(' · ', s.name, pl.name, d.doors || ' portes'), 'pipeline', pl.code, 'actif', s.category = 'active') order by d.created_at desc)
                       from crm.deal_contacts dc join crm.deals d on d.id = dc.deal_id join crm.stages s on s.id = d.stage_id join crm.pipelines pl on pl.id = d.pipeline_id
                       where dc.contact_id = c.id and d.merged_into is null), '[]'::jsonb),
    'consentement', (select concat_ws(' · ', case when i.channel = 'sms' then 'Courriel et SMS' else 'Courriel' end, to_char(i.consented_at at time zone 'America/Toronto', 'DD/MM/YYYY'))
                     from public.inquiries i where i.consented_at is not null and lower(i.email) = any (c.emails) order by i.consented_at desc limit 1))
  from crm.contacts c where c.id = p;
$$;

create or replace function public.lanceur_doublon(p_a uuid, p_b uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform crm.require_aal2();
  if not crm.can('ventes.lire') then raise exception 'Votre rôle ne donne pas accès aux ventes.' using errcode = 'PT403'; end if;
  return (select jsonb_build_object('a', crm.fiche_doublon(p_a), 'b', crm.fiche_doublon(p_b), 'courriel', pd.courriel, 'telephone', pd.telephone, 'nom', pd.nom, 'confiance', pd.confiance)
    from crm.paires_doublons() pd where (pd.a, pd.b) in ((p_a, p_b), (p_b, p_a)));
end $$;

-- p_choix : { "courriel": "<valeur>", "telephone": "<valeur>", "deal": "<uuid du deal gardé>" } (tous facultatifs)
create or replace function public.lanceur_fusionner_choix(p_survivant uuid, p_perdant uuid, p_choix jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v jsonb; v_deal uuid := nullif(p_choix ->> 'deal', '')::uuid; d record; v_perdus uuid[];
begin
  -- deals de la fiche perdante, lus avant que la fusion ne repointe les liens
  v_perdus := array(select dc.deal_id from crm.deal_contacts dc join crm.deals dd on dd.id = dc.deal_id where dc.contact_id = p_perdant and dd.merged_into is null);
  v := crm.merge_contacts(p_survivant, p_perdant);
  if nullif(p_choix ->> 'courriel', '') is not null then
    update crm.contacts set emails = array[lower(p_choix ->> 'courriel')] || array_remove(emails, lower(p_choix ->> 'courriel')) where id = p_survivant and lower(p_choix ->> 'courriel') = any (emails);
  end if;
  if nullif(p_choix ->> 'telephone', '') is not null then
    update crm.contacts set phones_e164 = array[p_choix ->> 'telephone'] || array_remove(phones_e164, p_choix ->> 'telephone') where id = p_survivant and (p_choix ->> 'telephone') = any (phones_e164);
  end if;
  if v_deal is not null then
    -- l'autre deal actif du même pipeline est fusionné dans celui qu'on garde
    for d in select dd.id from crm.deals dd join crm.deal_contacts dc on dc.deal_id = dd.id join crm.stages s on s.id = dd.stage_id
             where dc.contact_id = p_survivant and dd.id <> v_deal and dd.merged_into is null and s.category = 'active'
               and dd.pipeline_id = (select pipeline_id from crm.deals where id = v_deal)
               and (dd.id = any (v_perdus) or v_deal = any (v_perdus))
    loop
      update crm.deals set merged_into = v_deal, updated_at = now() where id = d.id;
      perform crm.journal('deal.merged', 'crm.deals', d.id, null, jsonb_build_object('garde', v_deal), 'merge-contacts');
    end loop;
  end if;
  perform crm.journal('contact.merge_choices', 'crm.contacts', p_survivant, null, p_choix, 'merge-contacts');
  return v;
end $$;

revoke all on function crm.fiche_doublon(uuid) from public, anon, authenticated;
revoke all on function public.lanceur_doublon(uuid, uuid), public.lanceur_fusionner_choix(uuid, uuid, jsonb) from public, anon;
grant execute on function public.lanceur_doublon(uuid, uuid), public.lanceur_fusionner_choix(uuid, uuid, jsonb) to authenticated;
