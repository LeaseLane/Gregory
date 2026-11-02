#!/usr/bin/env python3
"""Refonte de Steven (site statique du 1er nov. 2026) → public/refonte/, servie aux adresses du site par next.config.ts.

usage : python3 scripts/refonte/importer.py <dossier du site final décompressé>

Les pages restent celles de Steven (générées par son _src/construire.py) : seules les adresses changent.
- liens « page.html » → adresse du site (canonique de la page), « kit/ » et « img/ » → /refonte/kit/, /refonte/img/;
- Poppins servie depuis le domaine (/assets/fonts) au lieu de Google Fonts (Loi 25 : aucun tiers avant consentement);
- kit/temoins.js annonce le choix (« ll-temoins-choix »), comme la bannière du site; branchements.js s'y abonne
  (GA4, pixel Meta, preuve du choix) et envoie les formulaires;
- pages gardées du site en ligne : logements-a-louer, logement et demande-de-location (annonces d'exemple, « Bientôt »),
  plan.html (page interne) n'est pas servie.
Sortie : public/refonte/ et src/lib/refonte-routes.json (adresse → fichier), lu par next.config.ts et src/proxy.ts.
"""
import json, re, shutil, sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
SITE = ICI.parent.parent
SRC = Path(sys.argv[1]).resolve()
DEST = SITE / 'public' / 'refonte'
ROUTES = SITE / 'src' / 'lib' / 'refonte-routes.json'

GARDEES = {'logements-a-louer': '/logements-a-louer', 'logement': '/logements-a-louer',
           'demande-de-location': '/locataires/demande-de-location', 'plan': '/'}

canon = re.compile(r'<link rel="canonical" href="https://leaselane\.ca([^"]*)"')
liens, routes = dict(GARDEES), {}
for f in sorted(SRC.glob('*.html')):
    if f.stem in GARDEES:
        continue
    m = canon.search(f.read_text(encoding='utf-8'))
    assert m, f'{f.name} : aucune canonique'
    url = m[1] or '/'
    assert url not in routes, f'{url} : deux pages ({routes.get(url)}, {f.name})'
    liens[f.stem], routes[url] = url, f.name

inconnus = set()
def adresses(t):
    def lien(m):
        if m[1] not in liens:
            inconnus.add(m[1])
            return m[0]
        return liens[m[1]]
    t = re.sub(r'(?<=["\'`(])([a-z0-9-]+)\.html(?=[#?"\'`)])', lien, t)
    t = re.sub(r'(?<=["\'`(])(?:\.\./)?(kit|img)/', r'/refonte/\1/', t)
    return t

POLICES = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
           '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
           '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">')

if DEST.exists():
    shutil.rmtree(DEST)
shutil.copytree(SRC / 'img', DEST / 'img')
(DEST / 'kit').mkdir(parents=True)
for f in (SRC / 'kit').iterdir():
    if f.suffix in ('.js', '.css'):
        (DEST / 'kit' / f.name).write_text(adresses(f.read_text(encoding='utf-8')), encoding='utf-8')
    else:
        shutil.copy2(f, DEST / 'kit' / f.name)

# Choix des témoins annoncé au reste de la page (même événement que la bannière du site : src/proto/cleo-temoins.jsx).
t = (DEST / 'kit' / 'temoins.js').read_text(encoding='utf-8')
ENREG = 'localStorage.setItem(CLE,JSON.stringify({...p,version:VERSION,date:new Date().toISOString()}))}catch(e){}'
assert t.count(ENREG) == 1, 'kit/temoins.js : enregistrement du choix introuvable'
t = t.replace(ENREG, ENREG + "dispatchEvent(new CustomEvent('ll-temoins-choix',{detail:{...p,version:VERSION}}));")
(DEST / 'kit' / 'temoins.js').write_text(t, encoding='utf-8')

# Cléo : une question que la maquette ne reconnaît pas part à handle-public-faq (window.llCleo, branchements.js), comme sur le site.
t = (DEST / 'kit' / 'cleo.js').read_text(encoding='utf-8')
DEFAUT = 'const s=SC[k]||SC.defaut;dire(s.m,s.s);'
assert t.count(DEFAUT) == 1, 'kit/cleo.js : réponse par défaut introuvable'
t = t.replace(DEFAUT, "if(k==='defaut'&&client&&window.llCleo){const g=gen,f=filEl();"
              "f&&f.insertAdjacentHTML('beforeend','<p class=\"clv-ecrit\" aria-label=\"Cléo écrit\"><i></i><i></i><i></i></p>');bas();"
              "window.llCleo(client).then(t=>[[{t}],['Autre question','Parler à une personne']],()=>[SC.defaut.m,SC.defaut.s])"
              ".then(([m,s])=>{const e=corps.querySelector('.clv-ecrit');e&&e.remove();if(g===gen)dire(m,s)});return}" + DEFAUT)
(DEST / 'kit' / 'cleo.js').write_text(t, encoding='utf-8')

# Poppins 300 à 700 depuis le domaine (mêmes fichiers que le site : src/styles/tokens/fonts.css).
faces = [l for l in (SITE / 'src/styles/tokens/fonts.css').read_text(encoding='utf-8').splitlines()
         if "font-family:'Poppins'" in l and re.search(r'font-weight:[3-7]00', l)]
assert len(faces) == 10, 'fonts.css : 10 déclarations Poppins attendues'
(DEST / 'kit' / 'polices.css').write_text('\n'.join(faces) + '\n', encoding='utf-8')
shutil.copy2(ICI / 'branchements.js', DEST / 'kit' / 'branchements.js')

for url, nom in routes.items():
    t = (SRC / nom).read_text(encoding='utf-8')
    assert t.count(POLICES) == 1, f'{nom} : liens Google Fonts introuvables'
    t = t.replace(POLICES, '<link rel="stylesheet" href="kit/polices.css">')
    t = t.replace('</head>', '<script src="kit/branchements.js" defer></script>\n</head>', 1)
    # Images chargées au défilement, sauf le logo de l'en-tête (visible dès l'arrivée). Les héros sont des fonds CSS.
    t = re.sub(r'<img\b(?![^>]*\bloading=)(?![^>]*class="logo-[hv]")([^>]*)>',
               lambda m: '<img loading="lazy"' + ('' if 'decoding=' in m[1] else ' decoding="async"') + m[1] + '>', t)
    (DEST / nom).write_text(adresses(t), encoding='utf-8')

ROUTES.write_text(json.dumps(routes, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(f'{len(routes)} pages → public/refonte/, adresses dans {ROUTES.relative_to(SITE)}')
if inconnus:
    print('Liens vers des pages absentes (laissés tels quels) :', ', '.join(sorted(inconnus)))
