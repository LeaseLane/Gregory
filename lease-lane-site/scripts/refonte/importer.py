#!/usr/bin/env python3
"""Refonte de Steven (site statique du 1er nov. 2026) → public/refonte/, servie aux adresses du site par next.config.ts.

usage : python3 scripts/refonte/importer.py <dossier du site final décompressé>

Les pages restent celles de Steven (générées par son _src/construire.py) : seules les adresses changent.
- liens « page.html » → adresse du site (canonique de la page), « kit/ » et « img/ » → /refonte/kit/, /refonte/img/;
- Poppins servie depuis le domaine (/assets/fonts) au lieu de Google Fonts (Loi 25 : aucun tiers avant consentement);
- kit/temoins.js annonce le choix (« ll-temoins-choix »), comme la bannière du site; branchements.js s'y abonne
  (GA4, pixel Meta, preuve du choix) et envoie les formulaires;
- balise robots passée de noindex à index, follow (mise en ligne du 3 nov. 2026);
- pages gardées du site en ligne : logements-a-louer, logement et demande-de-location (annonces d'exemple, « Bientôt »),
  plan.html (page interne) n'est pas servie.
Sortie : public/refonte/ et src/lib/refonte-routes.json (adresse → fichier), lu par next.config.ts et src/proxy.ts.
"""
import json, re, shutil, sys
from liens_morts import relier
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
    # Steven, 2026-11-06 : « Voir le guide » de /quartiers construit 'quartier-<secteur>.html' (404) : les guides sont à /quartiers/<secteur>.
    t = t.replace("'quartier-'+s.s+'.html'", "'/quartiers/'+s.s")
    t = re.sub(r'(?<=["\'`(])(?:\.\./)?(kit|img)/', r'/refonte/\1/', t)
    return t

POLICES = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
           '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
           '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">')

FAQ_SANS = ("else dire('Je n’ai pas de réponse toute prête à cette question. Choisissez une catégorie, ou "
            "<a href=\"nous-joindre.html\">écrivez à l’équipe</a> : une personne vous répond.'+(cote?'':liste()),800,true)};")
METIERS = re.findall(r"\['([a-z_]+)', '([^']+)'\]", (SITE.parent / 'assets' / 'metiers.js').read_text(encoding='utf-8'))
assert len(METIERS) >= 10, 'assets/metiers.js : liste des métiers introuvable'
INSC_ANCRE = '        <div class="rang-21">\n          <div class="champ"><label for="ie-tel">'
INSC_AIDE = 'Trois champs obligatoires, marqués d’un *. Le reste se complète dans la plateforme.'
INSC_CHAMPS = ('        <div class="champ"><label for="ie-ent">Nom de l’entreprise <span class="req">*</span></label>'
  '<input class="saisie" id="ie-ent" autocomplete="organization" placeholder="Plomberie Exemple inc."></div>\n'
  '        <fieldset class="champ" id="ie-metiers" style="border:0;padding:0;margin:0"><legend class="etiq">Métiers <span class="req">*</span></legend>'
  '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 16px;margin-top:8px">'
  + ''.join(f'<label class="case"><input type="checkbox" value="{c}"><span>{l}</span></label>' for c, l in METIERS) +
  '</div><span class="aide">Nos demandes vous arrivent selon ces métiers.</span></fieldset>\n'
  '        <div class="rang-21">\n'
  '          <div class="champ"><label for="ie-sect">Secteurs desservis <span class="facult">(facultatif)</span></label>'
  '<input class="saisie" id="ie-sect" placeholder="Lévis, Québec, Saint-Nicolas"><span class="aide">Séparés par des virgules.</span></div>\n'
  '          <div class="champ"><label for="ie-rbq">Numéro RBQ <span class="facult">(facultatif)</span></label>'
  '<input class="saisie" id="ie-rbq" inputmode="numeric" placeholder="1234-5678-90"></div>\n'
  '        </div>\n')
NOINDEX = '<meta name="robots" content="noindex, nofollow">'

if DEST.exists():
    shutil.rmtree(DEST)
shutil.copytree(SRC / 'img', DEST / 'img')
(DEST / 'kit').mkdir(parents=True)
for f in (SRC / 'kit').iterdir():
    if f.suffix in ('.js', '.css'):
        (DEST / 'kit' / f.name).write_text(adresses(f.read_text(encoding='utf-8')), encoding='utf-8')
    else:
        shutil.copy2(f, DEST / 'kit' / f.name)

# Steven, 2026-11-06 : « Découvrir Montréal » (Bientôt, /guide-local) ressemblait à un bouton actif. Un bouton aria-disabled a l'air désactivé.
with open(DEST / 'kit' / 'kit.css', 'a', encoding='utf-8') as css:
    css.write('\n.btn[aria-disabled="true"],.btn[aria-disabled="true"]:hover{opacity:.5;cursor:not-allowed;background:none;color:inherit;box-shadow:inset 0 0 0 .7px currentColor}\n')

# Accessibilité (QA twim-design du 18 nov. 2026) : CSS ajoutée à kit.css; la bulle des témoins ne vole plus le focus à l'arrivée
# (le clavier restait coincé dans la bulle; le focus n'y va que si la personne l'ouvre elle-même : Choisir, Gérer mes témoins).
with open(DEST / 'kit' / 'kit.css', 'a', encoding='utf-8') as css:
    css.write("\n/* Accessibilité (QA twim-design du 18 nov. 2026) : lien d'évitement visible au focus, anneaux contrastés sur l'en-tête, cibles de 44 px,\n   anneau entier dans le fil de Cléo, et un élément atteint au clavier ne passe plus sous la bulle flottante de Cléo. */\n.sr:focus{position:fixed;left:16px;top:16px;width:auto;height:auto;clip:auto;overflow:visible;white-space:normal;z-index:1000;padding:12px 16px;background:#fff;color:var(--marine-900);font:600 14px Poppins,system-ui,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,.25)}\n.tete-outils .tete-loge:focus-visible,.tete-outils .burger:focus-visible{outline-color:#fff;box-shadow:0 0 0 6px var(--marine-900)}\n.ct .ct-b{min-height:44px}button.fq4-reprise{min-width:44px;min-height:44px}.fil a{display:inline-block;min-width:44px}\n.cl-flot{transition:opacity .2s,transform .2s}.cl-flot.cl-retire{opacity:0;transform:translateY(16px);pointer-events:none}\n.fq4-fil :focus-visible{outline-offset:-3px}\n@media (max-width:760px){html{scroll-padding-bottom:120px}}\n")
FOCUS_A, FOCUS_B = "const f=ct.querySelector(v==='detail'?'.ct-sw':'.ct-b');if(f)f.focus({preventScroll:true});", "const f=ct.querySelector(v==='detail'?'.ct-sw':'.ct-b');if(f&&v!=='bulle')f.focus({preventScroll:true});"

# Choix des témoins annoncé au reste de la page (même événement que la bannière du site : src/proto/cleo-temoins.jsx).
t = (DEST / 'kit' / 'temoins.js').read_text(encoding='utf-8')
ENREG = 'localStorage.setItem(CLE,JSON.stringify({...p,version:VERSION,date:new Date().toISOString()}))}catch(e){}'
assert t.count(ENREG) == 1, 'kit/temoins.js : enregistrement du choix introuvable'
assert t.count(FOCUS_A) == 1, 'kit/temoins.js : mise au point de la bulle introuvable'
t = t.replace(FOCUS_A, FOCUS_B)
FOCUS_JS_A = "  if(!lire())setTimeout(()=>vue('bulle'),900);"
assert t.count(FOCUS_JS_A) == 1, 'kit/temoins.js : ouverture de la bulle introuvable'
t = t.replace(FOCUS_JS_A, "  /* Clavier : un élément atteint sous la bulle flottante la fait glisser hors du chemin; elle revient dès que le focus s'en éloigne ou y entre. */\n  const sous=()=>{const a=document.activeElement;if(!a||a===document.body||racine.contains(a)){racine.classList.remove('cl-retire');return}const q=a.getBoundingClientRect(),r={top:q.top-8,bottom:q.bottom+8,left:q.left-8,right:q.right+8},f=[...racine.children].filter(x=>!x.hidden).map(x=>x.getBoundingClientRect());const dy=racine.classList.contains('cl-retire')?16:0;racine.classList.toggle('cl-retire',f.some(b=>r.bottom>b.top-dy&&r.top<b.bottom-dy&&r.right>b.left&&r.left<b.right))};document.addEventListener('focusin',()=>{requestAnimationFrame(sous);setTimeout(sous,450)});addEventListener('scrollend',sous);\n  if(!lire())setTimeout(()=>vue('bulle'),900);")
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
    # Mise en ligne (3 nov. 2026) : les pages de Steven sont indexées, comme celles qu'elles remplacent (son noindex servait à l'aperçu).
    assert t.count(NOINDEX) == 1, f'{nom} : balise robots introuvable'
    t = t.replace(NOINDEX, '<meta name="robots" content="index, follow">')
    # FAQ de l'accueil (fq4) : une question sans réponse toute prête part à Cléo (window.llCleo), le message de la maquette reste en secours.
    if FAQ_SANS in t:
        t = t.replace(FAQ_SANS, "else{const non=()=>" + FAQ_SANS[5:-2] + ",g=gen;if(!window.llCleo)return non();"
                      "window.llCleo(t).then(r=>{if(g===gen)r?dire(esc(r),300,true):non()},()=>{if(g===gen)non()})}};")
    # Inscrire mon entreprise, dispatch d'abord (2026-11-04) : nom de l'entreprise, métiers (assets/metiers.js), secteurs et RBQ,
    # entre la preuve d'assurance et le téléphone; branchements.js les envoie à inscription-entreprise.
    if nom == 'inscrire-mon-entreprise.html':
        assert t.count(INSC_ANCRE) == 1 and t.count(INSC_AIDE) == 1, 'inscrire-mon-entreprise.html : formulaire modifié par Steven'
        t = t.replace(INSC_ANCRE, INSC_CHAMPS + INSC_ANCRE).replace(INSC_AIDE, 'Cinq champs obligatoires, marqués d’un *. Le reste se complète dans la plateforme.')
    # Accueil : les deux cartes flottantes du héros (Logements à louer « Bientôt », Cléo 24/7) retirées à la demande d'Octa (23 nov. 2026).
    t = re.sub(r'\s*<ul class="hf"[^>]*>.*?</ul>', '', t, count=1, flags=re.S)
    # Images chargées au défilement, sauf le logo de l'en-tête (visible dès l'arrivée). Les héros sont des fonds CSS.
    t = re.sub(r'<img\b(?![^>]*\bloading=)(?![^>]*class="logo-[hv]")([^>]*)>',
               lambda m: '<img loading="lazy"' + ('' if 'decoding=' in m[1] else ' decoding="async"') + m[1] + '>', t)
    # Liens « # » de la maquette (connexions, cartes du portail locataire) → vraies adresses (2026-11-05).
    t = relier(t)
    (DEST / nom).write_text(adresses(t), encoding='utf-8')

ROUTES.write_text(json.dumps(routes, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(f'{len(routes)} pages → public/refonte/, adresses dans {ROUTES.relative_to(SITE)}')
if inconnus:
    print('Liens vers des pages absentes (laissés tels quels) :', ', '.join(sorted(inconnus)))

# Version anglaise (17 nov. 2026) : pages /en traduites depuis scripts/refonte/en/dictionnaire.json; les textes nouveaux sont listés.
import subprocess
subprocess.run([sys.executable, str(ICI / 'anglais.py'), 'construire'], check=True)
