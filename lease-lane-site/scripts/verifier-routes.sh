#!/bin/zsh
# Récupère chaque route du site Next.js (sans JavaScript) : code HTTP, h1, JSON-LD, première erreur.
B=${1:-http://localhost:3010}
for p in $(python3 -c "import json;print(' '.join(r['path'] for r in json.load(open('/Users/thewebismine/Desktop/LEASE LANE/lease-lane-site/scripts/routes.json'))))"); do
  h=$(curl -s -m 60 -w '\n%{http_code}' "$B$p"); code=${h##*$'\n'}; corps=${h%$'\n'*}
  h1=$(print -r -- "$corps" | grep -o '<h1[^>]*>.\{0,90\}' | head -1 | sed 's/<[^>]*>//g' | cut -c1-60)
  ld=$(print -r -- "$corps" | grep -c 'application/ld+json')
  err=$(print -r -- "$corps" | grep -o '\(ReferenceError\|TypeError\|SyntaxError\|Error\): [^<"\\]\{0,140\}' | head -1)
  printf "%-48s %s ld=%s h1=%s %s\n" "$p" "$code" "$ld" "$h1" "$err"
done
