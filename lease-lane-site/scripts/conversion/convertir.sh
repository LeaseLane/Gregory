#!/bin/zsh
# Prototype (ui_kits/site-public) -> modules Next.js (src/proto, src/styles/proto).
#   1. convertir.mjs  : scripts globaux -> modules ES (imports/exports selon l'ordre de chargement du prototype),
#                       protections pour le rendu serveur, hydratation stable, clés de revue neutralisées, CSS injectées extraites.
#   2. posttraiter.py : retouches ciblées (gabarit Next.js, états qui dépendent de l'heure…).
#   3. elaguer.mjs    : ne garde que ce qui est atteignable depuis les pages retenues et le gabarit (racines.json).
#   4. copie sur place (rsync) dans src/ : le dossier est synchronisé par iCloud, supprimer puis recréer crée des copies « x 2.jsx ».
# Usage : scripts/conversion/convertir.sh [dossier du prototype]
set -e
ICI=${0:A:h}
N=${ICI:h:h}
P=${1:-"$N/../lease-lane-design-system/project/ui_kits/site-public"}
T=$(mktemp -d)
node "$ICI/convertir.mjs" "$P" "$T/proto"
python3 "$ICI/posttraiter.py" "$T/proto"
node "$ICI/elaguer.mjs" "$T/proto" "$ICI/racines.json"
rsync -a --delete --checksum --inplace --include='*.jsx' --exclude='*' "$T/proto/" "$N/src/proto/"
rsync -a --delete --checksum --inplace --include='*.css' --exclude='*' "$T/styles/" "$N/src/styles/proto/"
cp "$T/rapport-conversion.json" "$ICI/rapport-conversion.json"
rm -rf "$T"
# 5. Aperçu de l'espace propriétaire (iframe des pages Gestion) : copie du prototype du portail, servie telle quelle.
#    Ses chemins relatifs (../../styles.css, ../../assets/…) se résolvent à la racine du site; page non indexée (en-tête X-Robots-Tag).
K=${P:h:h}
mkdir -p "$N/public/espace-proprietaire" "$N/public/portail-commun" "$N/public/tokens"
rsync -a --checksum --inplace --exclude='Export*' --include='*.html' --include='*.js' --include='*.jsx' --exclude='*' "${P:h}/espace-proprietaire/" "$N/public/espace-proprietaire/"
rsync -a --checksum --inplace --include='*.js' --include='*.jsx' --include='*.css' --exclude='*' "${P:h}/portail-commun/" "$N/public/portail-commun/"
rsync -a --checksum --inplace --include='*.css' --exclude='*' "$K/tokens/" "$N/public/tokens/"
rsync -a --checksum --inplace "$K/styles.css" "$K/_ds_bundle.js" "$N/public/"
echo "Modules : $(ls "$N/src/proto" | wc -l | tr -d ' ') · rapport : scripts/conversion/rapport-conversion.json"
