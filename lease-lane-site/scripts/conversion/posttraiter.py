# Retouches après conversion (propres au passage à Next.js).
import re,sys
D=sys.argv[1]
def edit(f,fn):
    p=D+'/'+f;s=open(p).read();n=fn(s)
    assert n!=s, f; open(p,'w').write(n)
# app.jsx : le rendu se fait par le gabarit Next.js (aucun createRoot).
def sans_root(s):
    i=s.index('ReactDOM.createRoot(')
    d=s.rindex('\nif (',0,i)+1
    f=s.index('\n}',i)+2
    return s[:d]+s[f:]
edit('app.jsx',sans_root)
# logements-store : les annonces viennent du serveur (SB1), pas du localStorage partagé avec l'admin du prototype.
def store(s):
    i=s.rindex('\nif (',0,s.index('/* Site public : les annonces'))+1
    j=s.index("\n}\n",i)+3
    return s[:i]+"/* Prototype : les annonces publiées dans l'admin (localStorage) remplaçaient la démonstration. Retiré : lecture serveur à venir (SB1). */\n"+s[j:]
edit('logements-store.jsx',store)

# Fiche : jours proposés pour la visite (calculés depuis aujourd'hui) — état client, stable à l'hydratation.
def jours(s):
    a="const jours = React.useMemo(() => {"
    assert a in s
    s=s.replace(a,"const [jours] = useEtatClient(() => {",1)
    i=s.index("const [jours] = useEtatClient(() => {")
    j=s.index("}, []);",i)
    s=s[:j]+"});"+s[j+len("}, []);"):]
    if "import { useEtatClient" not in s and "useEtatClient" not in s.split("function Moment")[0]:
        s=s.replace("import React from 'react';","import React from 'react';\nimport { useEtatClient } from '@/lib/hydratation';",1)
    return s
edit('fiche-concepts.jsx',jours)
# À propos : heure de Québec affichée — état client.
def heure(s):
    a="const [h, setH] = uS(f);"
    assert a in s
    s=s.replace(a,"const [h, setH] = useEtatClient(f);",1)
    if not re.search(r"import \{[^}]*useEtatClient",s):
        s=s.replace("import React from 'react';","import React from 'react';\nimport { useEtatClient } from '@/lib/hydratation';",1)
    return s
edit('apropos-concepts.jsx',heure)

# Version anglaise : la langue vient du gabarit (contexte React), le changement de langue ouvre la page jumelle.
def langue_entete(s):
    a="const [l, setL] = React.useState(LANGUE_INIT);"
    assert a in s
    s=s.replace(a,"const [l, setL] = React.useState(useLangue() === 'en' ? 'EN' : 'FR');",1)
    b="if (LL_LANGUE) LL_LANGUE.changer(x === 'EN' ? 'en' : 'fr');"
    assert b in s
    s=s.replace(b,"allerLangue(x === 'EN' ? 'en' : 'fr');",1)
    s=s.replace("import React from 'react';","import React from 'react';\nimport { useLangue, allerLangue } from '@/lib/i18n/contexte';",1)
    return s
edit('chrome.jsx',langue_entete)
def legal_en(s):
    a="{LL_LANGUE && LL_LANGUE.en && <p data-no-trad"
    assert a in s
    s=s.replace(a,"{useLangue() === 'en' && <p data-no-trad",1)
    b="__html: doc.html"
    assert b in s
    s=s.replace(b,"__html: useHtmlTraduit(doc.html)",1)
    s=s.replace("import React from 'react';","import React from 'react';\nimport { useLangue, useHtmlTraduit } from '@/lib/i18n/contexte';",1)
    return s
edit('pages-lease.jsx',legal_en)

# Cléo : les titres « texte {mot en couleur} suite » sont traduits d'un bloc (version anglaise).
def em_traduit(s):
    a="}) => String(t).split(/(\\{[^}]+\\})/).map((x, i) => x[0] === '{' ? <span key={i} className=\"cp-em\">{x.slice(1, -1)}</span> : <React.Fragment key={i}>{x}</React.Fragment>);"
    assert a in s, 'Em introuvable'
    s=s.replace(a,"""}) => {
  const parties = String(t).split(/(\\{[^}]+\\})/).filter(x => x !== '');
  const traduits = useMorceauxTraduits(parties.map(x => x[0] === '{' ? x.slice(1, -1) : x));
  return parties.map((x, i) => x[0] === '{' ? <span key={i} className="cp-em">{traduits[i]}</span> : <React.Fragment key={i}>{traduits[i]}</React.Fragment>);
};""",1)
    s=s.replace("import React from 'react';","import React from 'react';\nimport { useMorceauxTraduits } from '@/lib/i18n/contexte';",1)
    return s
edit('cleo-concepts.jsx',em_traduit)

# Cléo en anglais : mots-clés anglais des scénarios, profils tapés en anglais, FAQ cherchée dans sa traduction.
def cleo_anglais(s):
    EN = {
      "'disponible']": "'disponible', 'apartment', 'for rent', 'looking for', 'find a', 'available', 'bedroom']",
      "'créneau']": "'créneau', 'visit', 'viewing', 'appointment', 'tour', 'see the']",
      "'nouvelles annonces']": "'nouvelles annonces', 'notify', 'notification', 'new listing']",
      "'dégât']": "'dégât', 'leak', 'repair', 'emergency', 'broken', 'water heater', 'problem', 'outage', 'maintenance', 'damage', 'heating']",
      "'administrative']": "'administrative', 'complaint', 'comment']",
      "'propriétaire']": "'propriétaire', 'fee', 'cost', 'price', 'pricing', 'percentage', 'owner', 'my building', 'manage my']",
      "'parler à']": "'parler à', 'person', 'human', 'someone', 'talk to', 'speak to', 'representative']",
      "'fixation']": "'fixation', 'increase', 'raise the rent', 'rent hike']",
      "'sous-lo']": "'sous-lo', 'assignment', 'assign my lease', 'sublet', 'sublease']",
      "'postdat']": "'postdat', 'deposit', 'post-dated', 'key fee']",
      "'tribunal']": "'tribunal', 'lease', 'evict', 'repossess', 'terminate', 'cancel my lease']",
    }
    for a, b in EN.items():
        assert s.count(a) >= 1, a
        s = s.replace(a, b, 1)
    R = {
      "/^changer de profil/i": "/^(changer de profil|change (my )?profile)/i",
      "/^une autre question/i": "/^(une autre question|another question)/i",
      "/^je suis propri/i": "/^(je suis propri|i'?m an? (property )?owner|i am an? (property )?owner|i own)/i",
      "/^je suis locataire/i": "/^(je suis locataire|i'?m a tenant|i am a tenant)/i",
      "/^je cherche un logement$/i": "/^(je cherche un logement|i'?m looking for (a home|an apartment|a place)|i am looking for (a home|an apartment|a place))$/i",
    }
    for a, b in R.items():
        assert a in s, a
        s = s.replace(a, b, 1)
    a = "const n = motsF(F[id].q).filter(w => m.has(w)).length;"
    assert a in s
    s = s.replace(a, "const n = motsF(qFaq(F, id)).filter(w => m.has(w)).length;", 1)
    a = "const trouverFaq = (texte, ids) => {"
    s = s.replace(a, """/* Version anglaise : la FAQ est cherchée dans sa traduction (dictionnaire fourni par le panneau). */
let __dicoCleo = null;
const qFaq = (F, id) => { const q = F[id].q; const v = __dicoCleo && __dicoCleo[q.replace(/\\s+/g, ' ').trim()]; return v ? String(v) : q; };
""" + a, 1)
    a = "function AgentIA({"
    i = s.index(a); j = s.index('{', s.index(')', i)) + 1
    s = s[:j] + "\n  const __d = useDico();\n  __dicoCleo = __d.lang === 'en' ? __d.D : null;" + s[j:]
    s = s.replace("import React from 'react';", "import React from 'react';\nimport { useDico } from '@/lib/i18n/contexte';", 1)
    return s
edit('app.jsx', cleo_anglais)

# Aperçu de l'espace propriétaire (copié dans public/ par convertir.sh) : adresse absolue, valable sous /en/… aussi.
def apercu_absolu(s):
    a = "'../espace-proprietaire/index.html"
    b = '"../espace-proprietaire/index.html'
    assert a in s or b in s
    return s.replace(a, "'/espace-proprietaire/index.html").replace(b, '"/espace-proprietaire/index.html')
edit('gestion-options-a.jsx', apercu_absolu)
edit('pages-proprietaires.jsx', apercu_absolu)

# React 19 : « inert » est un attribut booléen (une chaîne vide vaut false).
def inert_booleen(s):
    import re
    return re.sub(r"inert=\{([^{}]*?) \? '' : undefined\}", r"inert={\1 ? true : undefined}", s)
edit('cleo-options.jsx', inert_booleen)

# Accueil, « Votre arrivée » (A12) : l'effet d'entrée lit `v`, qui vaut la valeur du serveur (visible) pendant l'hydratation
# puis passe à false juste après; avec des dépendances [], l'effet garde l'ancienne valeur et n'observe jamais la section
# (contenu resté transparent). Dépendre de `v` relance l'observation.
def entree_a12(s):
    a = """    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [r, v];"""
    assert a in s, 'useEntree A12'
    return s.replace(a, a.replace('}, []);', '}, [v]);'), 1)
edit('accueil-arrivee-12.jsx', entree_a12)

# Blogue : la langue d'affichage vient du contexte de langue du site (le prototype lit LL_LANGUE).
def blogue_langue(s):
    a = "const useEN=()=>!!(W.LL_LANGUE&&W.LL_LANGUE.en);"
    b = "const useEN = () => !!(LL_LANGUE && LL_LANGUE.en);"
    c = a if a in s else b
    assert c in s, 'useEN'
    s = s.replace(c, "const useEN = () => useLangue() === 'en';", 1)
    return s.replace("import React from 'react';", "import React from 'react';\nimport { useLangue } from '@/lib/i18n/contexte';", 1)
edit('pages-blogue.jsx', blogue_langue)
edit('pages-levis.jsx', blogue_langue)

# Inscrire mon entreprise (page faite main : src/components/InscriptionEntreprise.jsx, styles src/styles/inscription.css).
# Points d'accès demandés par la livraison design (LISEZMOI §2) : bouton de l'en-tête (masqué ≤ 620 px, il passe dans le menu),
# entrée du menu, colonne « Entreprises » du pied de page et bande d'appel sur l'accueil.
def ie_entete(s):
    a = "<LangueEntete />"
    assert s.count(a) == 1, 'LangueEntete'
    return s.replace(a, '<a href="/inscrire-mon-entreprise" className="ll-entete-inscrire">Inscrire mon entreprise <ChIcon name="building-2" size={18} /></a>' + a, 1)
edit('chrome.jsx', ie_entete)
def ie_menu(s):
    a = "const EXTRA = {"
    b = "ids: ['apropos', 'joindre', 'faq', 'blogue', 'cleo', 'confid']"
    assert s.count(a) == 1 and s.count(b) == 1, 'menu EXTRA/PROFILS'
    s = s.replace(a, a + "\n  entreprise: {\n    id: 'entreprise',\n    t: 'Inscrire mon entreprise',\n    d: 'Inscription gratuite des entrepreneurs',\n    ic: 'building-2',\n    to: '/inscrire-mon-entreprise',\n    type: 'page'\n  },", 1)
    return s.replace(b, "ids: ['apropos', 'joindre', 'faq', 'blogue', 'cleo', 'entreprise', 'confid']", 1)
edit('menu-options.jsx', ie_menu)
def ie_pied(s):
    a = "['/faq', 'Foire aux questions']]]];"
    b = "repeat(4,max-content)"
    assert s.count(a) == 1 and s.count(b) == 1, 'pied COLS'
    s = s.replace(a, "['/faq', 'Foire aux questions']]], ['Entreprises', [['/inscrire-mon-entreprise', 'Inscrire mon entreprise']]]];", 1)
    return s.replace(b, "repeat(5,max-content)", 1)
edit('pied-options.jsx', ie_pied)
def ie_accueil(s):
    a = "{<AccFaq actuel={<FAQSujets />} />}</React.Fragment>;"
    assert s.count(a) == 1, 'accueil corps'
    s = s.replace(a, "{<AppelInscription accueil />}" + a, 1)
    return s.replace("import React from 'react';", "import React from 'react';\nimport { AppelInscription } from '@/components/AppelInscription';", 1)
edit('accueil.jsx', ie_accueil)

# Article « Hausse de loyer 2026 » : la maquette le datait du 20 janvier 2026, avant la mise en ligne du site
# (9 octobre 2026). Date réelle de publication.
def hausse_date_routes(s):
    a = "  date: '2026-01-20',\n  maj: '2026-10-08'"
    assert s.count(a) == 1, 'hausse 2026 routes'
    return s.replace(a, "  date: '2026-10-09',\n  maj: '2026-10-09'", 1)
edit('routes.jsx', hausse_date_routes)

# Performance (PageSpeed, 22 oct. 2026) : la liste des adresses ne lit que les métadonnées des articles (src/lib/articles-meta.js,
# régénéré par scripts/articles-meta.mjs avant chaque construction), pas leur texte complet, chargé sinon sur chaque page.
def routes_articles_meta(s):
    a = "import { LL_ARTICLES } from '@/proto/articles-blogue';"
    assert s.count(a) == 1, 'routes articles'
    return s.replace(a, "import { LL_ARTICLES } from '@/lib/articles-meta';", 1)
edit('routes.jsx', routes_articles_meta)

# Performance : la bannière des pages intérieures (PBHeros, avec gestion-options-a/b) et le formulaire d'offre (FormOffreP)
# ne sont chargés que sur les pages qui les affichent; blocs.jsx est importé par l'en-tête de chaque page.
LENT = {
 "import { PBHeros } from '@/proto/pages-proprio-b';": ("PBHeros", "@/proto/pages-proprio-b"),
 "import { FormOffreP } from '@/proto/forms-principal';": ("FormOffreP", "@/proto/forms-principal"),
}
def blocs_lent(s):
    for a, (n, m) in LENT.items():
        assert s.count(a) == 1, 'blocs ' + n
        s = s.replace(a, "const %s__ = React.lazy(() => import('%s').then(m => ({ default: m.%s })));\nconst %s = p => <React.Suspense fallback={null}><%s__ {...p} /></React.Suspense>;" % (n, m, n, n, n), 1)
    return s
edit('blocs.jsx', blocs_lent)

# Performance : l'accroche de la bannière d'accueil sans importer pages-proprietaires.jsx.
import re
def heros3_lead(s):
    a = "import { PPC } from '@/proto/pages-proprietaires';"
    assert s.count(a) == 1, 'heros3 PPC'
    pp = open(D + '/pages-proprietaires.jsx').read()
    m = re.search(r"const PPC = \{\s*gestion: \{.*?\n    lead: ('(?:[^'\\]|\\.)*'),", pp, re.S)
    assert m, 'PPC.gestion.lead'
    return s.replace(a, "/* Seule la phrase d'accroche de PPC.gestion sert ici : copiée de pages-proprietaires.jsx par posttraiter.py au lieu d'importer\n   tout le module (≈ 170 Ko avec ses dépendances, chargés sinon sur l'accueil; PageSpeed, 22 oct. 2026). */\nconst PPC = { gestion: { lead: " + m.group(1) + " } };", 1)
edit('accueil-heros3.jsx', heros3_lead)

# Performance : la ligne d'immeubles de la bannière en WebP (35 Ko) partout — <img> et masque CSS (mask-image) : en PNG,
# le masque faisait télécharger une seconde copie de 70 Ko (PageSpeed, 23 oct. 2026). Même couche alpha, masque identique.
def heros7_webp(s):
    a = "  const IM = IMG + 'couverture-immeubles.png',"
    assert s.count(a) == 1, 'heros7 IM'
    return s.replace(a, "  const IM = IMG + 'couverture-immeubles.webp',", 1)
edit('accueil-heros7.jsx', heros7_webp)
def hausse_date_blogue(s):
    a = "  d: '2026-01-20',\n  m: '2026-10-08',"
    assert s.count(a) == 1, 'hausse 2026 blogue'
    return s.replace(a, "  d: '2026-10-09',\n  m: '2026-10-09',", 1)
edit('pages-blogue.jsx', hausse_date_blogue)

# Article 2027 (calculateur, page faite main /blogue/hausse-de-loyer-2027) : à la une du blogue, et lien
# « Voir les règles 2027 » dans l'article 2026 (lien croisé demandé par le plan SEO, lot 6).
def hausse_2027_liste(s):
    a = "const ARTICLES = [{\n  slug: 'hausse-de-loyer-2026',"
    assert s.count(a) == 1, 'ARTICLES'
    s = s.replace(a, "const ARTICLES = [{\n  slug: 'hausse-de-loyer-2027',\n  cat: 'droit',\n  t: 'Hausse de loyer 2027 : calculez la vôtre',\n  r: 'Le calculateur applique la méthode du TAL en vigueur depuis janvier 2026 : taux de base, taxes, assurance et travaux.',\n  d: '2026-10-21',\n  m: '2026-10-21',\n  min: 5,\n  aut: 'jt',\n  une: 1\n}, {\n  slug: 'hausse-de-loyer-2026',", 1)
    b = "  min: 7,\n  aut: 'jt',\n  une: 1\n}, ...LL_ARTICLES"
    assert s.count(b) == 1, 'une 2026'
    return s.replace(b, "  min: 7,\n  aut: 'jt'\n}, ...LL_ARTICLES", 1)
edit('pages-blogue.jsx', hausse_2027_liste)
def hausse_2027_lien(s):
    a = "}}>Notre méthode</strong>Chaque article de droit du logement cite ses sources officielles et porte sa date de mise à jour. <a href=\"/a-propos\">En savoir plus</a></div>\n      </aside>"
    assert s.count(a) >= 1, 'aside 2026'
    i = s.index(a)
    return s[:i] + a.replace("</div>\n      </aside>", "</div>\n          <div style={{ padding: '16px 18px', borderRadius: '14px', border: FIN, fontSize: '13px', lineHeight: 1.6, color: TXT }}><strong style={{ display: 'block', color: MAR, marginBottom: '4px' }}>Hausse de loyer 2027</strong>Le calculateur de la hausse 2027 et ses règles. <a href=\"/blogue/hausse-de-loyer-2027\">Voir les règles 2027</a></div>\n      </aside>") + s[i + len(a):]
edit('pages-blogue.jsx', hausse_2027_lien)

# Plan SEO, lot 3 : adresse du quartier Sainte-Foy–Sillery–Cap-Rouge avec ses traits d'union
# (l'ancienne /quartiers/sainte-foysillerycap-rouge redirige en 301 : next.config.ts). Tolérant : si la designer
# corrige déjà l'adresse, rien à faire.
import glob as _glob
for _p in _glob.glob(D + '/*.jsx'):
    _s = open(_p).read()
    if 'sainte-foysillerycap-rouge' in _s: open(_p, 'w').write(_s.replace('sainte-foysillerycap-rouge', 'sainte-foy-sillery-cap-rouge'))
