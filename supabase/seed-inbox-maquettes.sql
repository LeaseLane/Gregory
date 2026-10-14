-- T7 · Fils de démonstration de l'Inbox (maquette l04), préproduction seulement. Rejouable : efface puis recrée
-- les fils des adresses @exemple-inbox.test. Les messages entrants passent par crm.recevoir_message (vrai chemin).
delete from crm.conversations where email like '%@exemple-inbox.test' or phone_e164 in ('+14185550164', '+14185550177', '+14185550188');

do $$
declare c uuid; camille uuid := (select id from auth.users where email = 'equipe-location@leaselane.test');
  julie uuid := (select id from auth.users where email = 'equipe-gestionnaire@leaselane.test');
  t timestamptz := now() - interval '12 hours 10 minutes';  -- l'heure « 12 h 01 » de la maquette = il y a 9 minutes
begin
  -- Émilie Gagnon : SMS, Cléo répond et passe la main à Camille
  c := crm.recevoir_message('sms', '+14185550164', 'Bonjour, le 4½ du 640 est-il encore libre?', 'demo-eg-1');
  update crm.conversation_messages set created_at = t + time '11:52' where provider_message_id = 'demo-eg-1';
  insert into crm.conversation_messages (conversation_id, direction, channel, author, body, created_at)
  values (c, 'out', 'sms', 'cleo', 'Oui! Une visite jeudi à 10 h vous conviendrait?', t + time '11:53');
  perform crm.recevoir_message('sms', '+14185550164', 'Parfait, merci! À jeudi.', 'demo-eg-2');
  update crm.conversation_messages set created_at = t + time '12:01' where provider_message_id = 'demo-eg-2';
  update crm.conversations set display_name = 'Émilie Gagnon', last_message_at = t + time '12:01' where id = c;
  perform crm.passer_la_main(c, 'Visite réservée jeudi 10 h. Budget 1 450 $, arrivée le 1er décembre, sans animaux.', camille);

  -- Gabriel Paquet : courriel, en attente
  c := crm.recevoir_message('email', 'gabriel@exemple-inbox.test', 'Je peux payer la moitié vendredi et le reste le 15. Est-ce que ça vous va?', 'demo-gp-1', 'Loyer d’octobre');
  update crm.conversations set display_name = 'Gabriel Paquet', status = 'waiting', assignee_user_id = julie, last_message_at = t + time '11:40' where id = c;
  update crm.conversation_messages set created_at = t + time '11:40' where provider_message_id = 'demo-gp-1';

  -- Investissements Roy : courriel
  c := crm.recevoir_message('email', 'roy@exemple-inbox.test', 'Oui, on vous confie le 1260 et le 1272. Envoyez-nous le mandat.', 'demo-ir-1', 'Mandat de gestion');
  update crm.conversations set display_name = 'Investissements Roy', last_message_at = t + time '09:12' where id = c;
  update crm.conversation_messages set created_at = t + time '09:12' where provider_message_id = 'demo-ir-1';

  -- Léa Bouchard : SMS, fermé, lu
  c := crm.recevoir_message('sms', '+14185550177', 'Le plombier est passé, tout est réglé.', 'demo-lb-1');
  update crm.conversations set display_name = 'Léa Bouchard', status = 'closed', unread = false, last_message_at = t - interval '1 day' + time '16:20' where id = c;
  update crm.conversation_messages set created_at = t - interval '1 day' + time '16:20' where provider_message_id = 'demo-lb-1';

  -- Sophie Ménard : SMS
  c := crm.recevoir_message('sms', '+14185550188', 'Vu votre rappel. Je règle ça demain.', 'demo-sm-1');
  update crm.conversations set display_name = 'Sophie Ménard', last_message_at = t - interval '1 day' + time '18:05' where id = c;
  update crm.conversation_messages set created_at = t - interval '1 day' + time '18:05' where provider_message_id = 'demo-sm-1';

  -- Nadia Tremblay : courriel, fermé, lu
  c := crm.recevoir_message('email', 'nadia@exemple-inbox.test', 'Merci pour le robinet!', 'demo-nt-1', 'Robinet de la cuisine');
  update crm.conversations set display_name = 'Nadia Tremblay', status = 'closed', unread = false, last_message_at = t - interval '9 days' where id = c;
  update crm.conversation_messages set created_at = t - interval '9 days' where provider_message_id = 'demo-nt-1';
end $$;

-- Consentements de la démo (Émilie : courriel et SMS)
delete from comms.consents where address in ('+14185550164') and source = 'demo-inbox';
insert into comms.consents (channel, address, basis, source, obtained_at) values ('sms', '+14185550164', 'express', 'demo-inbox', now() - interval '2 days');
delete from comms.suppressions where address in ('+14185550164', '+14185550177', '+14185550188');
select display_name, channel, status, unread from crm.conversations where email like '%@exemple-inbox.test' or phone_e164 like '+141855501%' order by last_message_at desc;
