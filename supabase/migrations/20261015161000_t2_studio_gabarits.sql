-- T2 · Studio › Gabarits (maquette e54) : lecture des gabarits et « Envoyer un test » à soi-même.
-- Le schéma comms n'est pas exposé à l'API : portes public.lanceur_* (même modèle que T1).

create or replace function public.lanceur_gabarits() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not crm.can('studio.lire') then raise exception 'Votre rôle ne donne pas accès au Studio.' using errcode = 'PT403'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'code', t.code, 'name', t.name, 'audience', t.audience, 'subject', t.subject, 'sms_text', t.sms_text, 'contenu', t.contenu,
      'trigger_event', t.trigger_event, 'send_mode', t.send_mode, 'active', t.active, 'essential', t.essential,
      'lcap_category', t.lcap_category, 'variables', t.variables, 'locale', t.locale, 'version', t.version, 'updated_at', t.updated_at
    ) order by t.code)
    from comms.email_templates t
    where t.version = (select max(v.version) from comms.email_templates v where v.code = t.code and v.locale = t.locale)), '[]'::jsonb);
end $$;

-- Test : seulement à sa propre adresse, avec les valeurs d'exemple, par la file (mêmes règles que tout envoi).
create or replace function public.lanceur_envoyer_test(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_courriel text := auth.jwt() ->> 'email'; t comms.email_templates; o comms.outbox;
begin
  if not crm.can('studio.lire') then raise exception 'Votre rôle ne donne pas accès au Studio.' using errcode = 'PT403'; end if;
  if coalesce(v_courriel, '') = '' then raise exception 'Adresse de courriel inconnue.' using errcode = 'PT422'; end if;
  select * into t from comms.email_templates where code = p_code and active order by version desc limit 1;
  if not found then raise exception 'Ce gabarit n’est pas encore actif : ses exemples de maquette doivent d’abord devenir des variables.' using errcode = 'PT422'; end if;
  o := comms.enqueue(jsonb_build_object('template_code', p_code, 'channel', 'email', 'recipient', v_courriel,
    'vars', coalesce(t.contenu -> 'exemple', '{}'::jsonb), 'canal_journal', 'interface',
    'idempotency_key', 'test:' || p_code || ':' || auth.uid() || ':' || floor(extract(epoch from now()))));
  return jsonb_build_object('id', o.id, 'scheduled_for', o.scheduled_for, 'recipient', o.recipient);
end $$;

revoke all on function public.lanceur_gabarits(), public.lanceur_envoyer_test(text) from public, anon;
grant execute on function public.lanceur_gabarits(), public.lanceur_envoyer_test(text) to authenticated;
