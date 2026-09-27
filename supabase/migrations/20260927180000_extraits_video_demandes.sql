-- Vidéos longues : images extraites + bande son préparées par le portail
-- locataire, lues par Gemini à la place de la vidéo entière (trop lourde
-- pour la passerelle au-delà de ~18 Mo).
-- Forme : [{ "video": chemin|null, "images": [chemins], "audio": chemin|null, "pas": s, "duree": s, "nom": "..." }]
alter table public.service_requests add column if not exists video_analysis jsonb;
