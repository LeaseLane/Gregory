#!/usr/bin/env python3
"""Version anglaise de la refonte de Steven : public/refonte/en/*.html, servie aux adresses anglaises (hreflang en-CA de chaque page).

usage : python3 scripts/refonte/anglais.py extraire <dossier>   textes français pas encore traduits → <dossier>/lot-NN.json ({id: texte})
        python3 scripts/refonte/anglais.py construire           pages anglaises, kit/en/ et adresses (src/lib/refonte-routes.json)

Le dictionnaire scripts/refonte/en/dictionnaire.json (français → anglais) garde chaque traduction : après un nouvel import de Steven,
seuls les textes nouveaux ou modifiés sont à traduire. Un même texte français a toujours la même traduction (filtres du blogue :
data-f, data-cat et chaînes du script restent égaux entre eux).
Découpage : un segment = texte et balises en ligne entre deux balises de bloc (le traducteur garde les balises); attributs lus par
les gens ou par les scripts (aria-label, alt, data-l…); chaînes des scripts (pages et kit/); textes du JSON-LD.
"""
import json, re, sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
SITE = ICI.parent.parent
REF = SITE / 'public' / 'refonte'
DICO = ICI / 'en' / 'dictionnaire.json'
ROUTES = SITE / 'src' / 'lib' / 'refonte-routes.json'
# Pages sans hreflang en-CA chez Steven : adresse anglaise de l'application (src/lib/i18n/adresses.js).
EN_MANQUANTES = {'/commentaire-ou-plainte': '/en/tenants/comment-or-complaint',
                 '/glossaire-bail-residentiel': '/en/residential-lease-glossary', '/guide-local': '/en/local-guide'}

RETOUCHES = {"'Fermer sans modifier':'Revenir'": "'Close without saving':'Go back'", 'QUÉBEC ET LÉVIS': 'QUÉBEC CITY AND LÉVIS'}
EN_LIGNE = {'a', 'abbr', 'b', 'br', 'cite', 'code', 'em', 'i', 'mark', 'q', 's', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'wbr'}
ATTRS = {'aria-label', 'alt', 'title', 'placeholder', 'data-l', 'data-r', 'data-cat', 'data-f', 'data-filtre', 'data-vide',
         'data-titre', 'data-prog', 'value'}
META = {'description', 'og:title', 'og:description', 'og:image:alt', 'twitter:title', 'twitter:description'}
LETTRES = re.compile(r'[A-Za-zÀ-ÿ]{2}')
MOTS_FR = re.compile(r'[À-ÿ’]|\b(le|la|les|de|des|du|un|une|et|pour|vous|votre|vos|au|aux|sur|est|pas|par|avec|dans|ou|ce|cette|nous|son|sa|ses)\b', re.I)
JSONLD_CLES = {'name', 'description', 'slogan', 'headline', 'text', 'alternativeHeadline', 'about', 'abstract', 'caption', 'keywords',
               'areaServed', 'serviceType', 'jobTitle', 'alternateName', 'articleSection', 'disambiguatingDescription'}

JETON = re.compile(r'<!--.*?-->|<(script|style|svg)\b[^>]*>.*?</\1\s*>|<[^>]+>|[^<]+', re.S | re.I)
ATTR = re.compile(r'(\s)([a-zA-Z:-]+)="([^"]*)"')


def texte_de(frag):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', frag)).strip()


def segments(html, tr):
    """Remplace chaque segment de texte (balises en ligne comprises) par tr(segment); None = inchangé."""
    out, run = [], []

    def vider():
        brut = ''.join(run)
        run.clear()
        # du premier au dernier caractère de texte, balises de bord exclues
        m = re.match(r'((?:\s|<[^>]+>)*)(.*?)((?:\s|<[^>]+>)*)$', brut, re.S)
        cœur = m[2]
        if cœur and LETTRES.search(texte_de(cœur)) and cœur.count('<') == cœur.count('>'):
            r = tr(cœur)
            out.append(m[1] + (cœur if r is None else r) + m[3])
        else:
            out.append(brut)

    for j in JETON.finditer(html):
        t = j[0]
        nom = re.match(r'</?([a-zA-Z0-9]+)', t)
        if t.startswith('<') and not (nom and nom[1].lower() in EN_LIGNE):
            if run:
                vider()
            out.append(t)
        else:
            run.append(t)
    if run:
        vider()
    return ''.join(out)


def attributs(html, tr):
    def balise(m):
        b = m[0]
        if b.startswith(('<!--', '<script', '<style', '<svg')) or not b.startswith('<'):
            return b
        est_meta = b.startswith('<meta')
        nommeta = re.search(r'(?:name|property)="([^"]+)"', b) if est_meta else None

        def a(x):
            n, v = x[2], x[3]
            ok = (n in ATTRS) or (est_meta and n == 'content' and nommeta and nommeta[1] in META)
            if ok and LETTRES.search(v):
                r = tr(v)
                if r is not None:
                    return x[1] + n + '="' + r.replace('"', '&quot;') + '"'
            return x[0]
        return ATTR.sub(a, b)
    return JETON.sub(balise, html)


def fin_code(js, k):
    """Indice après la } qui ferme un ${ ouvert juste avant k."""
    prof, n = 1, len(js)
    while k < n:
        c = js[k]
        if c in '\'"':
            k += 1
            while k < n and js[k] != c:
                k += 2 if js[k] == '\\' else 1
        elif c == '`':
            k = fin_gabarit(js, k)
        elif c == '{':
            prof += 1
        elif c == '}':
            prof -= 1
            if not prof:
                return k + 1
        k += 1
    return n


def fin_gabarit(js, i):
    """Indice du ` qui ferme le gabarit ouvert en i (gabarits imbriqués dans ${…} compris)."""
    k, n = i + 1, len(js)
    while k < n:
        if js[k] == '\\': k += 2; continue
        if js[k] == '`': return k
        if js.startswith('${', k): k = fin_code(js, k + 2); continue
        k += 1
    return n


def morceaux(g):
    """Contenu d'un gabarit → [texte, '${code}', texte…]."""
    res, k, d = [], 0, 0
    while k < len(g):
        if g[k] == '\\': k += 2; continue
        if g.startswith('${', k):
            res.append(g[d:k]); e = fin_code(g, k + 2); res.append(g[k:e]); k = d = e; continue
        k += 1
    res.append(g[d:])
    return [x for x in res if x]


def chaines_js(js, tr, connus):
    """Chaînes d'un script (lexeur minimal : commentaires, regex et gabarits sautés ou lus correctement)."""
    out, i, n, prec = [], 0, len(js), ''
    while i < n:
        c = js[i]
        if js.startswith('//', i):
            k = js.find('\n', i); k = n if k < 0 else k
            out.append(js[i:k]); i = k; continue
        if js.startswith('/*', i):
            k = js.find('*/', i + 2); k = n if k < 0 else k + 2
            out.append(js[i:k]); i = k; continue
        if c == '/' and (prec == '' or prec in '(,=:[!&|?{};+-*%<>~^' or re.search(r'\b(return|typeof|case|in|of)\s*$', js[max(0, i - 8):i])):
            k, cl = i + 1, False
            while k < n and (js[k] != '/' or cl):
                if js[k] == '\\': k += 1
                elif js[k] == '[': cl = True
                elif js[k] == ']': cl = False
                elif js[k] == '\n': break
                k += 1
            out.append(js[i:k + 1]); i = k + 1; prec = '/'; continue
        if c == '`' and '`' in js[i + 1:fin_gabarit(js, i)]:
            # gabarit qui contient des gabarits (${x?`…`:''}) : morceaux de texte traduits un à un, code relu récursivement
            k = fin_gabarit(js, i)
            out.append('`' + ''.join(chaines_js(x[2:-1], tr, connus).join(('${', '}')) if x.startswith('${')
                                     else (tr(x) or x) if LETTRES.search(x) and MOTS_FR.search(x) else x
                                     for x in morceaux(js[i + 1:k])) + '`')
            i = k + 1; prec = c; continue
        if c in '\'"`':
            k = fin_gabarit(js, i) if c == '`' else i + 1
            while c != '`' and k < n and js[k] != c:
                if js[k] == '\\': k += 1
                elif js[k] == '\n': break
                k += 1
            contenu = js[i + 1:k]
            fr = LETTRES.search(contenu) and not re.match(r'^[.#\[]|^[a-z]+:|^/|^[\w-]+$', contenu) and (' ' in contenu or MOTS_FR.search(contenu))\
                and len(re.findall(r'[A-Za-zÀ-ÿ]', contenu)) > len(contenu) * .3   # pas les tracés SVG de la carte
            r = tr(contenu) if (fr or contenu in connus) else None
            if r is not None and r != contenu:
                if c != '`':
                    r = r.replace('\\' + c, c).replace(c, '\\' + c)
                out.append(c + r + c)
            else:
                out.append(js[i:k + 1])
            i = k + 1; prec = c; continue
        out.append(c)
        if not c.isspace():
            prec = c
        i += 1
    return ''.join(out)


def jsonld(src, tr, url):
    d = json.loads(src)

    def v(x, cle=None):
        if isinstance(x, dict):
            return {k: v(y, k) for k, y in x.items()}
        if isinstance(x, list):
            return [v(y, cle) for y in x]
        if isinstance(x, str):
            if cle == 'inLanguage':
                return 'en-CA'
            if cle in JSONLD_CLES and LETTRES.search(x):
                r = tr(x)
                return x if r is None else r
            if x.startswith('https://leaselane.ca/'):
                return url(x)
        return x
    return json.dumps(v(d), ensure_ascii=False, separators=(',', ':'))


def scripts(html, tr, connus, url):
    def s(m):
        ouv, corps, ferm = m[1], m[2], m[3]
        if 'src=' in ouv:
            return m[0]
        if 'ld+json' in ouv:
            try:
                return ouv + jsonld(corps, tr, url) + ferm
            except ValueError:
                return m[0]
        return ouv + chaines_js(corps, tr, connus) + ferm
    return re.sub(r'(<script\b[^>]*>)(.*?)(</script\s*>)', s, html, flags=re.S | re.I)


def pages():
    """[(adresse française, fichier, adresse anglaise)] d'après refonte-routes.json et les hreflang."""
    r = json.loads(ROUTES.read_text(encoding='utf-8'))
    res = []
    for fr, f in r.items():
        if f.startswith('en/'):
            continue
        t = (REF / f).read_text(encoding='utf-8')
        m = re.search(r'hreflang="en-CA" href="https://leaselane\.ca([^"]*)"', t)
        en = m[1] if m else EN_MANQUANTES[fr]
        res.append((fr, f, en))
    return res


def kit_js():
    # seulement les scripts chargés par les pages (logement*.js servent aux pages d'annonces, non importées)
    pages_txt = ''.join((REF / f).read_text(encoding='utf-8') for _, f, _ in pages())
    return sorted(p for p in (REF / 'kit').glob('*.js') if f'/refonte/kit/{p.name}' in pages_txt)


def tout(tr, connus, url=lambda x: x):
    """Applique la traduction à chaque page et à chaque script du kit; rend {fichier: texte}."""
    res = {}
    for fr, f, en in pages():
        t = (REF / f).read_text(encoding='utf-8')
        t = scripts(t, tr, connus, url)
        t = segments(t, tr)
        res[f] = attributs(t, tr)
    for p in kit_js():
        res['kit/' + p.name] = chaines_js(p.read_text(encoding='utf-8'), tr, connus)
    return res


def charger():
    return json.loads(DICO.read_text(encoding='utf-8')) if DICO.exists() else {}


def extraire(dossier):
    dico, vus = charger(), {}

    def note(x):
        if x not in dico and texte_de(x) not in ('LeaseLane', 'Cléo', 'FR', 'EN', 'FREN'):
            vus[x] = 1
        return None
    connus = set()
    tout(lambda x: (connus.add(x), note(x))[1], set())   # 1re passe : textes HTML (connus = chaînes à suivre dans les scripts)
    tout(note, connus)
    d = Path(dossier); d.mkdir(parents=True, exist_ok=True)
    lot, taille, k = {}, 0, 0
    for x in vus:
        lot[f'{len(lot)}'] = x; taille += len(x)
        if taille > 30000:
            (d / f'lot-{k:02}.json').write_text(json.dumps(lot, ensure_ascii=False, indent=0), encoding='utf-8'); k += 1; lot, taille = {}, 0
    if lot:
        (d / f'lot-{k:02}.json').write_text(json.dumps(lot, ensure_ascii=False, indent=0), encoding='utf-8'); k += 1
    print(f'{len(vus)} textes à traduire ({sum(map(len, vus))} caractères) → {k} lots dans {d}')


def fusionner(dossier):
    """lot-NN.json + lot-NN.en.json → dictionnaire."""
    dico = charger()
    for f in sorted(Path(dossier).glob('lot-??.json')):
        en = f.with_suffix('.en.json')
        if not en.exists():
            print('manque', en.name); continue
        a, b = json.loads(f.read_text(encoding='utf-8')), json.loads(en.read_text(encoding='utf-8'))
        for i, x in a.items():
            if i in b and b[i].strip():
                dico[x] = b[i]
            else:
                print(f'{f.name} #{i} sans traduction')
    DICO.parent.mkdir(exist_ok=True)
    DICO.write_text(json.dumps(dico, ensure_ascii=False, indent=0, sort_keys=True) + '\n', encoding='utf-8')
    print(len(dico), 'traductions')


def construire():
    dico, manque = charger(), set()
    liste = pages()
    carte = {fr: en for fr, _, en in liste}
    # autres adresses françaises de l'application (logements, pages locales…) : table de src/lib/i18n/adresses.js
    for fr, en in re.findall(r"\[\s*['\"](/[^'\"]*)['\"]\s*,\s*['\"](/en[^'\"]*)['\"]", (SITE / 'src/lib/i18n/adresses.js').read_text(encoding='utf-8')):
        carte.setdefault(fr, en)

    def tr(x):
        if x in dico:
            return dico[x]
        if texte_de(x) not in ('LeaseLane', 'Cléo', 'FR', 'EN', 'FREN'):
            manque.add(x)
        return None

    def adr(chemin):
        base, _, reste = chemin.partition('#')
        b = base.rstrip('/') or '/'
        for pre_fr, pre_en in (('/quartiers/', '/en/neighbourhoods/'), ('/logements-a-louer/', '/en/apartments-for-rent/')):
            if b not in carte and b.startswith(pre_fr):
                return pre_en + b[len(pre_fr):] + ('#' + reste if reste else '')
        return carte[b] + ('#' + reste if reste else '') if b in carte else None

    def url_abs(u):
        p = u[len('https://leaselane.ca'):]
        r = adr(p) if not p.startswith('/#') else None
        return 'https://leaselane.ca' + r if r else u

    connus = set(dico)
    trad = tout(tr, connus, url_abs)
    kit_en = {k for k, v in trad.items() if k.startswith('kit/') and v != (REF / k).read_text(encoding='utf-8')}
    sortie = REF / 'en'
    (sortie / 'kit').mkdir(parents=True, exist_ok=True)
    routes = {fr: f for fr, f in json.loads(ROUTES.read_text(encoding='utf-8')).items() if not f.startswith('en/')}
    for k in kit_en:
        js = liens(trad[k], adr, js=True)
        for x, y in RETOUCHES.items():   # chaînes collées à du code, hors dictionnaire
            js = js.replace(x, y)
        (sortie / k).write_text(js, encoding='utf-8')
    for fr, f, en in liste:
        t = trad[f]
        t = t.replace('<html lang="fr-CA">', '<html lang="en-CA">')
        t = re.sub(r'(<link rel="canonical" href=")https://leaselane\.ca[^"]*', lambda m: m[1] + 'https://leaselane.ca' + en, t)
        t = re.sub(r'(<meta property="og:url" content=")https://leaselane\.ca[^"]*', lambda m: m[1] + 'https://leaselane.ca' + en, t)
        t = t.replace('content="fr_CA"', 'content="§"').replace('content="en_CA"', 'content="fr_CA"').replace('content="§"', 'content="en_CA"')
        if fr in EN_MANQUANTES:   # alternates absents chez Steven : ajoutés aux deux versions
            alt = (f'<link rel="alternate" hreflang="fr-CA" href="https://leaselane.ca{fr}">\n'
                   f'<link rel="alternate" hreflang="en-CA" href="https://leaselane.ca{en}">\n'
                   f'<link rel="alternate" hreflang="x-default" href="https://leaselane.ca{fr}">\n')
            t = t.replace('<link rel="canonical"', alt + '<link rel="canonical"', 1)
        # sélecteur de langue : EN courant, FR mène à la jumelle française (branchements.js)
        for k in kit_en:
            t = t.replace(f'src="/refonte/{k}"', f'src="/refonte/en/{k}"')
        t = re.sub(r'>(\s*\d+),(\d+\s*)<', r'>\1.\2<', t)   # 23,1 → 23.1 (chiffres seuls; le compteur d’anime.js les laisse fixes)
        t = liens(t, adr)
        t = langue(t, fr, en, 'en')
        (sortie / f).write_text(t, encoding='utf-8')
        routes[en] = 'en/' + f
    ROUTES.write_text(json.dumps(routes, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    for fr, f, en in liste:   # pages françaises : vrais liens FR / EN, alternates manquants
        p = REF / f; t = p.read_text(encoding='utf-8')
        t = langue(t, fr, en, 'fr')
        if 'hreflang="en-CA"' in t:
            p.write_text(t, encoding='utf-8')
        else:
                p.write_text(t.replace('<link rel="canonical"', f'<link rel="alternate" hreflang="fr-CA" href="https://leaselane.ca{fr}">\n'
                             f'<link rel="alternate" hreflang="en-CA" href="https://leaselane.ca{en}">\n'
                             f'<link rel="alternate" hreflang="x-default" href="https://leaselane.ca{fr}">\n<link rel="canonical"', 1), encoding='utf-8')
    print(f'{len(liste)} pages anglaises, {len(kit_en)} scripts du kit traduits, {len(manque)} textes sans traduction')
    for x in list(manque)[:15]:
        print('  ·', x[:120])


def langue(t, fr, en, ici):
    """Sélecteur FR / EN de l'en-tête et du menu : vrais liens vers les jumelles, langue de la page marquée."""
    lien = lambda l, h: f'<a href="{h}" lang="{l}"' + (' aria-current="true"' if l == ici else '') + f'>{l.upper()}</a>'
    t = re.sub(r'(<div class="tete-langue"[^>]*>).*?(</div>)', lambda m: m[1] + lien('fr', fr) + lien('en', en) + m[2], t, flags=re.S)
    return re.sub(r'<button type="button" aria-pressed="(?:true|false)" lang="(fr|en)">',
                  lambda m: f'<button type="button" aria-pressed="{str(m[1] == ici).lower()}" lang="{m[1]}">', t)


def liens(t, adr, js=False):
    """Adresses françaises du site → anglaises : href, action, location.href et chaînes '/…' (seules les adresses connues changent)."""
    def h(m):
        r = adr(m[2])
        return m[1] + r if r else m[0]
    t = re.sub(r'((?:href|action)=\\?["\'])(/[a-z0-9\-/]*(?:#[\w-]*)?)(?=[?#\\"\'])', h, t)
    t = re.sub(r"(location\.href\s*=\s*['\"])(/[a-z0-9\-/]*)", h, t)
    t = re.sub(r"(['\"])(/(?!refonte|assets|rest|api)[a-z0-9][a-z0-9\-/]*)(?=[?#'\"])", h, t)
    return t

if __name__ == '__main__':
    {'extraire': lambda: extraire(sys.argv[2]), 'fusionner': lambda: fusionner(sys.argv[2]), 'construire': construire}[sys.argv[1]]()
