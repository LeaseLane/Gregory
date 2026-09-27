-- Ce que Gemini voit et entend dans la vidéo jointe par le locataire
-- (texte transmis ensuite à Claude pour le diagnostic).
alter table public.service_requests add column if not exists ai_video_summary text;
