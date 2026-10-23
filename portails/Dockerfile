# Portails (app.leaselane.ca) sur Coolify, à la place de GitHub Pages.
# Même liste blanche que .github/workflows/pages.yml : pages HTML de la racine, assets/, robots.txt, sitemap.xml.
# Rien d'autre du dépôt (lanceur/, supabase/, docs/, scripts/…) n'entre dans l'image.
FROM nginx:1.27-alpine
COPY portails/nginx.conf /etc/nginx/conf.d/default.conf
COPY *.html robots.txt sitemap.xml /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
