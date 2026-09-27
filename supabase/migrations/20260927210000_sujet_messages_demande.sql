-- Objet du courriel quand un message du fil a été envoyé au locataire par courriel.
alter table public.service_request_messages add column if not exists sujet text;
