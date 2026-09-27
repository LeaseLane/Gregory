-- Heure proposée par le travailleur (« Autre heure ») : conservée comme une
-- vraie date pour que l'équipe l'accepte en un clic.
alter table public.work_orders add column if not exists proposed_appointment_at timestamptz;
