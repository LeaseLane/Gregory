-- Nouveau site public : les formulaires généraux (nous joindre, rappel,
-- demande de location, plainte) arrivent dans inquiries avec le type
-- « contact ». Même chaîne que visite/mandat : réponse automatique au
-- visiteur et courriel à l'équipe (handle-inquiry).
alter table public.inquiries drop constraint if exists inquiries_type_check;
alter table public.inquiries
  add constraint inquiries_type_check check (type in ('visite', 'mandat', 'contact'));
