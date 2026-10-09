"""Version anglaise : convertit les sources du prototype en modules du site Next.js.
   - traduction-en.js (dictionnaire FR → EN, source unique et éditable) → src/lib/i18n/dictionnaire.js
   - langue.js (table des adresses jumelles, titres et descriptions anglais) → src/lib/i18n/adresses.js
   Usage : python3 convertir-langue.py <dossier du prototype> <racine du projet Next.js>"""
import re, sys, os

P, N = sys.argv[1], sys.argv[2]
D = os.path.join(N, 'src', 'lib', 'i18n')
os.makedirs(D, exist_ok=True)

def ecrire(nom, texte):
    p = os.path.join(D, nom)
    if os.path.exists(p) and open(p, encoding='utf-8').read() == texte:
        return  # inchangé (dossier synchronisé par iCloud : pas de réécriture inutile)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(texte)

# 1. Dictionnaire
t = open(os.path.join(P, 'traduction-en.js'), encoding='utf-8').read()
assert t.count('window.LL_EN_TXT=') == 1 and t.count('window.LL_EN_ATTR=') == 1, 'format du dictionnaire inattendu'
t = t.replace('window.LL_EN_TXT=', 'export const LL_EN_TXT = ').replace('window.LL_EN_ATTR=', 'export const LL_EN_ATTR = ')
# Ajouts propres au site Next.js (textes de Cléo qui n'apparaissent qu'après une interaction, etc.) : scripts/traduction/ajouts-en.json
import json as _json
_aj = os.path.join(N, 'scripts', 'traduction', 'ajouts-en.json')
if os.path.exists(_aj):
    t += '\nObject.assign(LL_EN_TXT, ' + _json.dumps(_json.load(open(_aj, encoding='utf-8')), ensure_ascii=False, indent=0) + ');\n'
ecrire('dictionnaire.js', '/* Généré depuis ui_kits/site-public/traduction-en.js par scripts/conversion/convertir-langue.py — modifier la source. */\n' + t)

# 2. Table des adresses (langue.js)
l = open(os.path.join(P, 'langue.js'), encoding='utf-8').read()
i, j = l.index('var Q='), l.index('var FR={},EN={};')
table = l[i:j].strip()
ecrire('adresses.js', """/* Généré depuis ui_kits/site-public/langue.js par scripts/conversion/convertir-langue.py — modifier la source.
   Chaque page française a sa jumelle anglaise : [chemin français, chemin anglais, titre, description, requête cible, libellé du fil d'Ariane]. */
""" + table + """

export const ROUTES_EN = {};
export const FR_DE_EN = {};
T.forEach(function (t) { ROUTES_EN[t[0]] = {en: t[1], titre: t[2], description: t[3], requete: t[4], fil: t[5]}; FR_DE_EN[t[1]] = t[0]; });
const norm = function (p) { p = String(p || '/').split('?')[0]; return p.replace(/\\/+$/, '') || '/'; };
/* Chemin anglais d'un chemin français (garde l'ancre); inconnu : /en + chemin. */
export function versEN(p) { const a = String(p || '/').split('#'), b = norm(a[0]), e = ROUTES_EN[b]; const r = e ? e.en : (b === '/' ? '/en' : '/en' + b); return a[1] ? r + '#' + a[1] : r; }
/* Chemin français d'un chemin anglais. */
export function versFR(p) { const a = String(p || '/').split('#'), b = norm(a[0]); const r = FR_DE_EN[b] || (b.indexOf('/en/') === 0 ? b.slice(3) : b === '/en' ? '/' : b); return a[1] ? r + '#' + a[1] : r; }
export const estEN = function (p) { return /^\\/en(\\/|$)/.test(p || ''); };
""")
print('i18n : dictionnaire.js et adresses.js à jour')
