-- Cléo et IA › Cléo (maquette e56) : ce que Cléo règle seule, pourquoi elle passe la main, ses canaux, ses sources et son ton.
-- Tout est lu dans les vraies tables : conversations et messages de l'Inbox, articles du site, modèles juridiques.
-- La raison d'un passage de main n'est pas une colonne : elle est lue dans le résumé que Cléo écrit au passage (mots clés), « Autre » sinon.

create or replace function crm.raison_passage(p text) returns text language sql immutable set search_path = '' as $$
  select case when p ~* '(urgen|fuite|feu|fumée|chauffage|inond|gaz|dégât)' then 'Urgence'
              when p ~* '(loyer|paiement|rembours|frais|factur|entente)' then 'Paiement'
              when p ~* '(tal|tribunal|juridique|avocat|mise en demeure|résili|bail)' then 'Question juridique'
              when p ~* '(mécontent|plainte|insatisf|fâch|inacceptable|déçu)' then 'Client mécontent'
              else 'Autre' end
$$;

create or replace function public.lanceur_cleo() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_debut timestamptz := now() - interval '30 days'; v_prec timestamptz := now() - interval '60 days';
begin
  perform crm.require_aal2();
  if not crm.can('ia.lire') then raise exception 'Votre rôle ne donne pas accès à Cléo et IA.' using errcode = 'PT403'; end if;
  return (with c as (
      select cv.*, cv.handoff_at is null and not exists (select 1 from crm.conversation_messages m where m.conversation_id = cv.id and m.author = 'team') seule
      from crm.conversations cv where cv.last_message_at >= v_prec)
    select jsonb_build_object(
      'total', (select count(*) from c where last_message_at >= v_debut),
      'seule', (select count(*) from c where last_message_at >= v_debut and seule),
      'precedent', (select jsonb_build_object('total', count(*), 'seule', count(*) filter (where seule)) from c where last_message_at < v_debut),
      'raisons', coalesce((select jsonb_agg(jsonb_build_object('raison', r, 'n', n) order by n desc) from (
          select crm.raison_passage(handoff_summary) r, count(*) n from crm.conversations where handoff_at >= v_debut group by 1) z), '[]'::jsonb),
      'passages', coalesce((select jsonb_agg(jsonb_build_object('nom', display_name, 'resume', handoff_summary, 'le', handoff_at, 'raison', crm.raison_passage(handoff_summary)) order by handoff_at desc)
          from (select * from crm.conversations where handoff_at is not null order by handoff_at desc limit 4) z), '[]'::jsonb),
      'canaux', jsonb_build_object(
          'sms', (select count(distinct m.conversation_id) from crm.conversation_messages m where m.channel = 'sms' and m.created_at >= v_debut),
          'courriel', (select count(distinct m.conversation_id) from crm.conversation_messages m where m.channel = 'email' and m.created_at >= v_debut),
          'voix', (select count(distinct m.conversation_id) from crm.conversation_messages m where m.channel = 'voice' and m.created_at >= v_debut),
          'portail', (select count(distinct m.conversation_id) from crm.conversation_messages m where m.channel = 'portail' and m.created_at >= v_debut),
          'telephone', (select phone_main from public.company_settings where id)),
      'sources', jsonb_build_object(
          'articles', (select count(*) from site.articles where statut = 'publie'), 'articles_le', (select max(publie_le) from site.articles where statut = 'publie'),
          'modeles', (select count(*) from jur.templates), 'modeles_le', (select max(created_at) from jur.templates)),
      'peut_ecrire', crm.can('ia.ecrire')));
end $$;

revoke all on function crm.raison_passage(text) from public, anon, authenticated;
revoke all on function public.lanceur_cleo() from public, anon;
grant execute on function public.lanceur_cleo() to authenticated;
