-- TH · e45 Relevé mensuel côté équipe (adapté : aucun « versé à la propriétaire »; le total est la facture d'honoraires) : relevé émis
-- (ou aperçu), honoraires des 6 derniers mois, factures de travaux du mois; renvoyer PRO-05 et PRO-06.
create or replace function public.lanceur_releve(p_owner uuid, p_mois date) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_m date := date_trunc('month', p_mois)::date; s fin.owner_statements; o record;
begin
  perform crm.require_aal2();
  if not crm.can('finances.lire') then raise exception 'Votre rôle ne permet pas de voir les finances.' using errcode = 'PT403'; end if;
  select ow.id, ow.full_name, (select count(*) from public.units u join public.buildings b on b.id = u.building_id where b.owner_id = ow.id) as logements,
    (select string_agg(b.address, ' · ' order by b.address) from public.buildings b where b.owner_id = ow.id) as immeubles into o from public.owners ow where ow.id = p_owner;
  if o.id is null then raise exception 'Propriétaire introuvable.' using errcode = 'PT404'; end if;
  select * into s from fin.owner_statements where owner_id = p_owner and mois = v_m;
  return jsonb_build_object('id', s.id, 'proprietaire', o.full_name, 'owner_id', o.id, 'logements', o.logements, 'immeubles', o.immeubles, 'mois', v_m, 'emis', s.id is not null,
    'numero', s.numero, 'emis_le', s.emis_le,
    'envoi', jsonb_build_object('releve', (select jsonb_build_object('statut', status, 'le', coalesce(sent_at, scheduled_for)) from comms.outbox where id = s.pro05_outbox_id),
                                'facture', (select jsonb_build_object('statut', status, 'le', coalesce(sent_at, scheduled_for)) from comms.outbox where id = s.pro06_outbox_id)),
    'lignes', coalesce(s.lignes, (select jsonb_agg(jsonb_build_object('libelle', e.libelle, 'categorie', e.categorie, 'le', e.le, 'montant', e.montant, 'immeuble', e.immeuble)
        order by e.categorie <> 'Loyers', e.categorie <> 'Loyer partiel', e.le) from crm.ecritures_proprio(p_owner, v_m) e), '[]'::jsonb),
    'facture', coalesce(s.facture, crm.facture_honoraires(p_owner, v_m)),
    'historique', (select jsonb_agg(jsonb_build_object('mois', to_char(m, 'YYYY-MM'), 'honoraires', coalesce((select (st.facture ->> 'sous_total')::numeric from fin.owner_statements st where st.owner_id = p_owner and st.mois = m::date),
        (crm.facture_honoraires(p_owner, m::date) ->> 'sous_total')::numeric)) order by m) from generate_series(v_m - interval '5 months', v_m, interval '1 month') m),
    'parametres', to_jsonb(crm.parametres_honoraires((v_m + interval '1 month - 1 day')::date)));
end $$;

create or replace function public.lanceur_renvoyer_releve(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare s fin.owner_statements; v_mail text; o comms.outbox; v_mois text;
begin
  perform crm.require_aal2();
  if not crm.can('finances.ecritures.ecrire') then raise exception 'Votre rôle ne permet pas de renvoyer un relevé.' using errcode = 'PT403'; end if;
  select * into s from fin.owner_statements where id = p_id;
  if not found then raise exception 'Relevé introuvable.' using errcode = 'PT404'; end if;
  select u.email into v_mail from public.owners ow join auth.users u on u.id = ow.user_id where ow.id = s.owner_id;
  if v_mail is null then raise exception 'Ce propriétaire n’a pas de courriel de connexion.' using errcode = 'PT422'; end if;
  -- Même contenu qu'à l'émission, nouvelle clé d'envoi.
  for o in select * from comms.outbox where id in (s.pro05_outbox_id, s.pro06_outbox_id) loop
    perform comms.enqueue(jsonb_build_object('template_code', o.template_code, 'channel', 'email', 'recipient', v_mail, 'entity_type', 'fin.owner_statements', 'entity_id', s.id,
      'canal_journal', 'interface', 'idempotency_key', 'renvoi:' || o.id || ':' || extract(epoch from now())::bigint, 'vars', o.vars));
  end loop;
  perform crm.journal('owner_statement.resent', 'fin.owner_statements', s.id, null, null, 'resend-owner-statement');
end $$;

revoke all on function public.lanceur_releve(uuid, date), public.lanceur_renvoyer_releve(uuid) from public, anon;
grant execute on function public.lanceur_releve(uuid, date), public.lanceur_renvoyer_releve(uuid) to authenticated;
