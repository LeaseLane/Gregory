# Lanceur — admin Lease Lane (Next.js + Supabase)

Phase 2, Epic 1 (T0 · socle). Plan : `PHASE 2 COMPLÈTE/READ.ME/ARCHITECTURE.md`.

## Démarrer

```bash
cp .env.example .env.local   # LL_ENV + URL et clé publique de la PRÉPRODUCTION
npm install
npm run dev                  # http://localhost:3020
```

Garde-fou : hors `LL_ENV=production`, l'application refuse de démarrer si elle pointe la base de production.

## Déjà fait

- Connexion (maquette `connexion-admin.png`), code 2FA, inscription obligatoire du facteur (aucune exemption).
- `src/proxy.ts` : session rafraîchie, étape due imposée (connexion → code → inscription 2FA) avant toute page.
- Coquille : barre du haut, accueil des 10 espaces, « Accès réservé » si le compte n'est pas admin (`auth_is_admin`).

## Pas encore

« Rester connecté » et « Recevoir un lien courriel ou texto » (maquette) ; rôles `crm.team_members` et `crm.can()`,
journal `crm.journal()`, registre d'opérations, `check-rls.sh`, seed fictif (suite du T0).
