"""Génère les vues client (src/vues) et les routes Next.js à partir des pages retenues du prototype.
   - Français : src/app/(fr)/… (gabarit racine lang="fr-CA")
   - Anglais  : src/app/(en)/en/… (gabarit racine lang="en-CA"), adresses jumelles de langue.js
   Une vue = la page retenue du prototype (app.jsx, objet `pages`), sans les variantes de revue.
   Usage : python3 scripts/generer-pages.py"""
import os, json, subprocess

R = os.path.dirname(os.path.abspath(__file__)) + '/..'
VUES = {
 'accueil': ('Accueil', 'accueil', '<Accueil aller={naviguer} data={LL_DATA} />', ['LL_DATA']),
 'gestion': ('PageGestion', 'pages-proprietaires', None, []),
 'location': ('PageLocationV3', 'proprio-concepts', None, []),
 'expertise': ('PageExpertiseV3', 'proprio-concepts', None, []),
 'changer': ('PageChangerV3', 'proprio-concepts', None, []),
 'offre': ('PageOffre', 'pages-proprietaires', None, []),
 'cleo': ('PageCleoV2', 'cleo-concepts', None, []),
 'apropos': ('PageAProposV2', 'apropos-concepts', None, []),
 'contact': ('PageContact', 'pages-contact-v2', None, []),
 'faq': ('PageFAQ', 'pages-lease', None, []),
 'legal': ('PageLegal', 'pages-lease', None, []),
 'logements': ('PageLogements', 'pages-locataires', '<PageLogements route={route} aller={naviguer} data={LL_DATA} selection={selection} setSelection={setSelection} />', ['LL_DATA', 'selection']),
 'fiche': ('FicheV2', 'fiche-concepts', '<FicheV2 aller={naviguer} ouvrirAgent={() => ouvrirCleo()} />', ['ouvrirCleo']),
 'locataires': ('PageLocatairesV3', 'locataires-v3-commun', None, []),
 'formulaire': ('PageFormulaire', 'formulaires', None, []),
 'blogue': ('PageBlogue', 'pages-blogue', None, []),
 'article': ('PageArticle', 'pages-blogue', None, []),
 'quartiers': ('PageQuartiers', 'pages-guides', None, []),
 'quartier': ('PageQuartier', 'pages-guides', None, []),
 'glossaire': ('PageGlossaire', 'pages-guides', None, []),
}

def ecrire(p, texte):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    if os.path.exists(p) and open(p, encoding='utf-8').read() == texte:
        return  # inchangé (dossier synchronisé par iCloud : pas de réécriture inutile)
    open(p, 'w', encoding='utf-8').write(texte)

# ——— Vues ———
for page, (comp, mod, jsx, extra) in VUES.items():
    lignes = ["/** @jsxImportSource @/lib/i18n */", "'use client';",
              "/* Vue de la page « %s » : page retenue du prototype (%s). Généré par scripts/generer-pages.py. */" % (page, mod),
              "import React%s from 'react';" % (", { useState }" if 'selection' in extra else ''),
              "import { useRoute, naviguer } from '@/lib/routeur';",
              "import { usePagePrete } from '@/lib/finitions';",
              "import { %s } from '@/proto/%s';" % (comp, mod)]
    if 'LL_DATA' in extra: lignes.append("import { LL_DATA } from '@/proto/data';")
    if 'ouvrirCleo' in extra: lignes.append("import { ouvrirCleo } from '@/proto/seo';")
    corps = ["  const { route } = useRoute();", "  usePagePrete();"]
    if 'selection' in extra: corps.append("  const [selection, setSelection] = useState('L1');")
    rendu = jsx or '<%s route={route} />' % comp
    lignes += ["", "export default function Vue() {"] + corps + ["  void route; void naviguer;", "  return %s;" % rendu, "}", ""]
    ecrire(R + '/src/vues/%s.jsx' % page, '\n'.join(lignes))

# ——— Adresses ———
ROUTES = json.load(open(R + '/scripts/routes.json'))
EN = json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
    "import {ROUTES_EN} from './src/lib/i18n/adresses.js'; console.log(JSON.stringify(Object.fromEntries(Object.entries(ROUTES_EN).map(([k,v])=>[k,v.en]))))"],
    cwd=R, stderr=subprocess.DEVNULL).decode())
# Segments dynamiques (FR → EN) : une page par type, adresses connues pré-rendues.
DYN = [('/quartiers/', '/en/neighbourhoods/', 'quartier', 'quartier'), ('/blogue/', '/en/blog/', 'slug', 'article'), ('/logements-a-louer/', '/en/apartments-for-rent/', 'slug', 'fiche')]

def page_statique(chemin, page, lang):
    return """/* %(url)s — généré par scripts/generer-pages.py */
import { metadataDe, jsonLdTexte } from '@/lib/pages';
import Vue from '@/vues/%(page)s';

const CHEMIN = '%(fr)s';
export const metadata = metadataDe(CHEMIN, '%(lang)s');

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdTexte(CHEMIN, '%(lang)s') }} />
      <Vue />
    </>
  );
}
""" % dict(url=(EN[chemin] if lang == 'en' else chemin), page=page, fr=chemin, lang=lang)

def page_dynamique(base_fr, base, param, page, lang):
    conv = "versFR('%s' + %s)" % (base, param) if lang == 'en' else "'%s' + %s" % (base_fr, param)
    imp = "\nimport { versEN, versFR } from '@/lib/i18n/adresses';" if lang == 'en' else ''
    params = ("routesDe('%s').filter(r => r.path.startsWith('%s')).map(r => ({ %s: versEN(r.path).slice(%d) }))" % (page, base_fr, param, len(base))) if lang == 'en' \
        else ("routesDe('%s').filter(r => r.path.startsWith('%s')).map(r => ({ %s: r.path.slice(%d) }))" % (page, base_fr, param, len(base_fr)))
    return """/* %(base)s[%(param)s] — généré par scripts/generer-pages.py */
import { notFound } from 'next/navigation';
import { metadataDe, jsonLdTexte, routesDe, existe } from '@/lib/pages';%(imp)s
import Vue from '@/vues/%(page)s';

/* Adresses connues (routes.js du prototype) : pré-rendues à la compilation. Toute autre adresse répond un vrai 404 :
   la page attend ses paramètres avant de répondre (instant = false), au lieu de diffuser une coquille en 200. */
export const instant = false;
export function generateStaticParams() {
  return %(params)s;
}
export async function generateMetadata({ params }: { params: Promise<{ %(param)s: string }> }) {
  const { %(param)s } = await params;
  const chemin = %(conv)s;
  return existe(chemin) ? metadataDe(chemin, '%(lang)s') : {};
}
export default async function Page({ params }: { params: Promise<{ %(param)s: string }> }) {
  const { %(param)s } = await params;
  const chemin = %(conv)s;
  if (!existe(chemin)) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdTexte(chemin, '%(lang)s') }} />
      <Vue />
    </>
  );
}
""" % dict(base=base, param=param, page=page, lang=lang, conv=conv, imp=imp, params=params)

n = 0
for lang in ('fr', 'en'):
    racine = R + '/src/app/(%s)' % lang
    faits = set()
    for r in ROUTES:
        p, page = r['path'], r['page']
        dyn = [d for d in DYN if p.startswith(d[0])]
        if dyn:
            base_fr, base_en, param, _ = dyn[0]
            base = base_en if lang == 'en' else base_fr
            d = racine + base + '[' + param + ']'
            if d in faits: continue
            faits.add(d)
            ecrire(d + '/page.tsx', page_dynamique(base_fr, base, param, page, lang)); n += 1
            continue
        url = EN[p] if lang == 'en' else p
        ecrire(racine + ('' if url == '/' else url) + '/page.tsx', page_statique(p, page, lang)); n += 1
print(len(VUES), 'vues;', n, 'fichiers de page (fr + en)')
