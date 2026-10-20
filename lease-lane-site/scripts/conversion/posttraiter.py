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
    return s.replace("import React from 'react';", "import React from 'react';\nimport { AppelInscription } from '@/components/InscriptionEntreprise';", 1)
edit('accueil.jsx', ie_accueil)
