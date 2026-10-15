# Lanceur (admin.leaselane.ca) — construit et servi par Coolify (OVH).
# Contexte = racine du dépôt : le registre d'opérations vit dans supabase/functions/_shared/operations.
FROM node:22-alpine AS build
WORKDIR /app/lanceur
COPY lanceur/package.json lanceur/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY supabase/functions/_shared /app/supabase/functions/_shared
COPY lanceur/ ./
# NEXT_PUBLIC_* sont figées dans le code au build : arguments de construction.
ARG LL_ENV
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV LL_ENV=$LL_ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_TELEMETRY_DISABLED=1
RUN rm -f .env.local && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/lanceur/.next/standalone ./
COPY --from=build /app/lanceur/.next/static ./lanceur/.next/static
COPY --from=build /app/lanceur/public ./lanceur/public
USER node
EXPOSE 3000
CMD ["node", "lanceur/server.js"]
