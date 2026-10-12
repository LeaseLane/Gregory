"""Pages locales « Gestion immobilière à <municipalité> » (SEO local, par paliers).
   Source : scripts/localites/municipalites-50km.json (données vérifiées : Statistique Canada 2021, Ville de Québec, MAMH, RNCan).
   Palier 1 (page complète) : les 6 arrondissements de Québec et les municipalités de 5 000 habitants et plus à 50 km ou moins (Lévis a sa page à part).
   Les autres municipalités ont leur guide de secteur, réunis sur /quartiers (« La grande région de Québec »).
   Écrit dans le prototype : localites-donnees.js, localites-routes.js et le bloc LOCALITES de langue.js.
   Usage : python3 scripts/localites/generer.py  (puis npm run convertir)"""
import json, math, os, re, unicodedata

ICI = os.path.dirname(os.path.abspath(__file__))
PROTO = os.path.normpath(os.path.join(ICI, '../../../lease-lane-design-system/project/ui_kits/site-public'))
D = [x for x in json.load(open(os.path.join(ICI, 'municipalites-50km.json'), encoding='utf-8')) if x.get('inside50')]

SCHL = ('Rapport sur le marché locatif 2025 (SCHL)', 'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres')
SCHL_EN = ('Rental Market Report 2025 (CMHC)', SCHL[1])
VILLE = ('Données sur l’habitation (Ville de Québec)', 'https://www.ville.quebec.qc.ca/apropos/planification-orientations/habitation/donnees/index.aspx')
VILLE_EN = ('Housing data (Ville de Québec)', VILLE[1])
QUARTIERS = {'La Cité-Limoilou': [('Limoilou', 'limoilou'), ('Montcalm', 'montcalm'), ('Saint-Roch', 'saint-roch'), ('Saint-Sauveur', 'saint-sauveur'), ('Vieux-Québec', 'vieux-quebec')],
             'Sainte-Foy–Sillery–Cap-Rouge': [('Sainte-Foy', 'sainte-foy')], 'Charlesbourg': [('Charlesbourg', 'charlesbourg')],
             'Beauport': [('Beauport', 'beauport')], 'Les Rivières': [('Lebourgneuf', 'lebourgneuf')]}

def slugify(s):
    s = unicodedata.normalize('NFD', s.replace('–', '-').replace('’', '-').replace("'", '-')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', s)).strip('-')
def hav(a, b):
    R = 6371.0; p1, p2 = math.radians(a['lat']), math.radians(b['lat']); dp = p2 - p1; dl = math.radians(b['lng'] - a['lng'])
    return 2 * R * math.asin(math.sqrt(math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2))
def nfr(n): return f'{n:,}'.replace(',', ' ')
def nen(n): return f'{n:,}'
def pfr(p): return (f'{p:.1f}'.replace('.', ',')) + ' %'
def pen(p): return f'{p:.1f}%'
def kfr(k): return (f'{k:.1f}'.replace('.', ',')) + ' km'
def ken(k): return f'{k:.1f} km'
DIR_FR = {'N': 'au nord', 'NE': 'au nord-est', 'E': 'à l’est', 'SE': 'au sud-est', 'S': 'au sud', 'SO': 'au sud-ouest', 'O': 'à l’ouest', 'NO': 'au nord-ouest'}
DIR_EN = {'N': 'north', 'NE': 'northeast', 'E': 'east', 'SE': 'southeast', 'S': 'south', 'SO': 'southwest', 'O': 'west', 'NO': 'northwest'}
def mrc_court(x):
    m = x.get('mrc') or ''
    if x['type'].startswith('arrondissement (Ville de Québec'): return 'Ville de Québec'
    if 'Lévis' in m: return 'Ville de Lévis'
    if m.startswith('Agglomération de Québec'): return 'Agglomération de Québec'
    if m.startswith('Hors MRC'): return 'Wendake' if x['nom'] == 'Wendake' else 'Agglomération de Québec'
    return m.replace('MRC ', 'MRC de ')

ARR_Q = [x for x in D if x['type'] == 'arrondissement (Ville de Québec)']
MUN = [x for x in D if x['type'] not in ('arrondissement (Ville de Québec)', 'arrondissement (Ville de Lévis)') and x['nom'] not in ('Québec', 'Lévis')
       and (x.get('population2021') or 0) > 0 and x['nom'] not in ('Notre-Dame-des-Anges',)]
PALIER1 = ARR_Q + sorted([x for x in MUN if (x.get('population2021') or 0) >= 5000], key=lambda x: -x['population2021'])
P1 = {x['nom'] for x in PALIER1}
for x in D: x['slug'] = slugify(x['nom'])
LIEN = {x['nom']: '/gestion-immobiliere/' + x['slug'] for x in PALIER1}
LIEN['Lévis'] = '/gestion-immobiliere/levis'

# Prépositions : « à Charlesbourg », « dans Les Rivières », « dans La Cité-Limoilou »
def a_fr(x):
    n = x['nom']
    return 'dans ' + n if re.match(r'^(La|Les|Le) ', n) else 'à ' + n
def est_arr(x): return x['type'] == 'arrondissement (Ville de Québec)'

def situ_fr(x):
    k, d = x['distanceKm'], x.get('direction')
    if est_arr(x):
        return 'au cœur de la ville de Québec' if k < 3 else f'dans la ville de Québec, à {kfr(k)} du Vieux-Québec'
    return f'à {kfr(k)} {DIR_FR.get(d, "")} de Québec, dans la {mrc_court(x)}' if mrc_court(x).startswith('MRC') else f'à {kfr(k)} {DIR_FR.get(d, "")} de Québec'
def situ_en(x):
    k, d = x['distanceKm'], x.get('direction')
    if est_arr(x):
        return 'in the heart of Québec City' if k < 3 else f'in Québec City, {ken(k)} from Old Québec'
    m = mrc_court(x)
    return f'{ken(k)} {DIR_EN.get(d, "")} of Québec City, in the {m.replace("MRC de ", "").replace("MRC de L’", "L’")} RCM' if m.startswith('MRC') else f'{ken(k)} {DIR_EN.get(d, "")} of Québec City'

def voisins(x, n=4):
    pool = [y for y in D if y['nom'] not in (x['nom'], 'Québec', 'Notre-Dame-des-Anges', 'Saint-Louis-de-Gonzague-du-Cap-Tourmente') and y['type'] != 'arrondissement (Ville de Lévis)']
    return sorted(pool, key=lambda y: hav(x, y))[:n]

SERV_FR = [['key', 'Location', 'Fiche, photos, visites réservées par Cléo 24/7 et sélection des locataires conforme à la Loi 25.'], ['banknote', 'Loyers', 'Perception, reçus, rappels dès le premier jour de retard et suivi au TAL au besoin.'],
           ['wrench', 'Entretien', 'Demandes reçues avec photos, urgences prises en charge 24/7 et suivi des fournisseurs jusqu’à la fermeture du dossier.'], ['scale', 'Baux et TAL', 'Renouvellements, avis dans les délais, cessions et dossiers au Tribunal administratif du logement.'],
           ['chart-column', 'Rapports', 'Un rapport mensuel et un tableau de bord en ligne.'], ['message-square', 'Cléo', 'L’agent IA qui répond à vos locataires et aux locataires potentiels, jour et nuit, et passe le relais à l’équipe.']]
SERV_EN = [['key', 'Leasing', 'Listing, photos, viewings booked by Cléo 24/7 and tenant screening compliant with Law 25.'], ['banknote', 'Rent', 'Collection, receipts, reminders from the first day late and TAL follow-up when needed.'],
           ['wrench', 'Maintenance', 'Requests received with photos, emergencies handled 24/7 and suppliers followed until the file is closed.'], ['scale', 'Leases and the TAL', 'Renewals, notices on time, assignments and files at the Administrative Housing Tribunal.'],
           ['chart-column', 'Reports', 'A monthly report and an online dashboard.'], ['message-square', 'Cléo', 'The AI agent that answers your tenants and prospects, day and night, and hands over to the team.']]

def source_profil(x):
    u = x['sources'][0]
    if 'ville.quebec.qc.ca' in u: return (f'Portrait de l’arrondissement {x["nom"]} (Ville de Québec, Recensement de 2021)', u), (f'{x["nom"]} borough profile (Ville de Québec, 2021 Census)', u)
    return (f'Profil du recensement 2021, {x["nom"]} (Statistique Canada)', u), (f'2021 Census Profile, {x["nom"]} (Statistics Canada)', u.replace('Lang=F', 'Lang=E'))

def page(x):
    nom, pop, pct = x['nom'], x['population2021'], x['locatairesPct']
    tot = x.get('logementsPrives2021') or x.get('menagesSelonOccupation2021')
    loc = x.get('menagesLocataires2021')  # absent pour les arrondissements : on n'affiche alors que la part et le total (aucune valeur calculée)
    a, arr = a_fr(x), est_arr(x)
    sfr, sen = source_profil(x)
    # Marché : selon la part de locataires
    if pct >= 45:
        m1 = f'Avec {pfr(pct)} de ménages locataires, {nom} compte parmi les secteurs les plus locatifs de la région. La demande y est forte, et les locataires ont aussi beaucoup de choix : le bon loyer et une réponse le jour même font la différence.'
        e1 = f'With {pen(pct)} of households renting, {nom} is one of the most rental-oriented areas of the region. Demand is strong, and tenants also have plenty of choice: the right rent and a same-day reply make the difference.'
    elif pct >= 25:
        m1 = f'{a[0].upper() + a[1:]}, {pfr(pct)} des ménages sont locataires' + (f', soit {nfr(loc)} ménages en 2021' if loc else ' (2021)') + '. Propriétaires occupants et locataires s’y partagent le marché.'
        e1 = f'In {nom}, {pen(pct)} of households rent' + (f', or {nen(loc)} households in 2021' if loc else ' (2021)') + '. The market is shared between owner-occupiers and tenants.'
    else:
        m1 = f'Les locataires sont minoritaires {a} : {pfr(pct)} des ménages' + (f', soit {nfr(loc)} en 2021' if loc else ' en 2021') + '. Le parc locatif y est plus petit, et un logement vacant s’y remarque vite.'
        e1 = f'Tenants are a minority in {nom}: {pen(pct)} of households' + (f', or {nen(loc)} in 2021' if loc else ' in 2021') + '. The rental stock is smaller, and a vacant unit is quickly noticed.'
    if arr:
        m2 = 'Dans la ville de Québec, le taux d’inoccupation était de 2,2 % en 2025, selon la Ville. Il reste sous le seuil d’équilibre d’environ 3 %. Chaque jour de vacance a un coût : voir [ce que coûte un logement vacant](/blogue/logement-vacant-cout).'
        e2 = 'In Québec City, the vacancy rate was 2.2% in 2025, according to the City. It remains below the equilibrium threshold of about 3%. Every vacant day has a cost: see [what a vacant unit costs](/blogue/logement-vacant-cout).'
        src_m, src_me = [VILLE], [VILLE_EN]
    elif x['dansRMR']:
        m2 = f'{nom} fait partie de la région métropolitaine de Québec, où le taux d’inoccupation est passé à 2,4 % en octobre 2025, selon la SCHL. Chaque jour de vacance a un coût : voir [ce que coûte un logement vacant](/blogue/logement-vacant-cout).'
        e2 = f'{nom} is part of the Québec census metropolitan area, where the vacancy rate rose to 2.4% in October 2025, according to CMHC. Every vacant day has a cost: see [what a vacant unit costs](/blogue/logement-vacant-cout).'
        src_m, src_me = [SCHL], [SCHL_EN]
    else:
        m2 = f'{nom} est située hors de la région métropolitaine de Québec : les taux d’inoccupation publiés par la SCHL pour la région ne la couvrent pas. Le prix et la visibilité de l’annonce pèsent d’autant plus. Voir [ce que coûte un logement vacant](/blogue/logement-vacant-cout).'
        e2 = f'{nom} lies outside the Québec census metropolitan area, so the vacancy rates CMHC publishes for the region do not cover it. Price and listing visibility matter all the more. See [what a vacant unit costs](/blogue/logement-vacant-cout).'
        src_m, src_me = [], []
    notes = [n for n in x.get('notes', []) if not n['texte'].startswith(('Hôtel de ville', 'Bureau d', 'Point de référence'))]
    marche_fr, marche_en = [m1, m2], [e1, e2]
    src_notes = []
    for n in notes:
        t = n['texte']
        if 'Valcartier' in t:
            marche_fr.append('La Garnison Valcartier est à proximité : une partie de la demande locative vient du personnel militaire et de leurs familles.')
            marche_en.append('Garrison Valcartier is nearby: part of the rental demand comes from military personnel and their families.')
            src_notes.append(('Logement militaire à Valcartier (Défense nationale)', n['source']))
        elif 'Université Laval' in t:
            marche_fr.append('Le campus principal de l’Université Laval est dans l’arrondissement : la demande étudiante suit le calendrier universitaire.')
            marche_en.append('Université Laval’s main campus is in the borough: student demand follows the academic calendar.')
            src_notes.append(('Université Laval (Wikipédia)', n['source']))
        elif 'Mont-Sainte-Anne' in t:
            marche_fr.append('Le Mont-Sainte-Anne attire une demande saisonnière, surtout l’hiver.')
            marche_en.append('Mont-Sainte-Anne draws seasonal demand, especially in winter.')
            src_notes.append(('Mont-Sainte-Anne', n['source']))
        elif 'Stoneham' in t and 'station' in t.lower():
            marche_fr.append('La station de ski de Stoneham attire une demande saisonnière, surtout l’hiver.')
            marche_en.append('The Stoneham ski resort draws seasonal demand, especially in winter.')
            src_notes.append(('Station Stoneham', n['source']))
    vs = voisins(x)
    secteurs_fr = [[v['nom'], f'{kfr(hav(x, v))} · {mrc_court(v)}', LIEN.get(v['nom'])] for v in vs]
    secteurs_en = [[v['nom'], f'{ken(hav(x, v))} · {mrc_court(v).replace("MRC de ", "").replace("Ville de ", "City of ")}', LIEN.get(v['nom'])] for v in vs]
    q = QUARTIERS.get(nom, [])
    regles_fr = [f'Les baux {a} suivent les mêmes règles qu’ailleurs au Québec : le Code civil du Québec et les décisions du Tribunal administratif du logement.' +
                 (' À Québec, un règlement municipal exige aussi que le chauffage permette d’atteindre au moins 20 °C dans le logement : voir [les réparations urgentes](/blogue/urgences-locatives).' if arr else f' Les règlements municipaux de {nom} s’ajoutent pour l’entretien et la salubrité des bâtiments.'),
                 'Pour aller plus loin : [la hausse de loyer 2026](/blogue/hausse-de-loyer-2026), [la reprise de logement](/blogue/reprise-de-logement) et [le loyer impayé](/blogue/loyer-impaye).']
    regles_en = [f'Leases in {nom} follow the same rules as elsewhere in Québec: the Civil Code of Québec and the decisions of the Administrative Housing Tribunal.' +
                 (' In Québec City, a municipal by-law also requires heating that can reach at least 20 °C in the dwelling: see [urgent repairs](/blogue/urgences-locatives).' if arr else f' {nom}’s municipal by-laws also apply to building maintenance and sanitation.'),
                 'Learn more: [the 2026 rent increase](/blogue/hausse-de-loyer-2026), [repossessing a dwelling](/blogue/reprise-de-logement) and [unpaid rent](/blogue/loyer-impaye).']
    if q:
        regles_fr.append('Pour vos locataires : ' + ', '.join(f'[le guide du quartier {n}](/quartiers/{s})' for n, s in q) + '.')
        regles_en.append('For your tenants: ' + ', '.join(f'[the {n} neighbourhood guide](/quartiers/{s})' for n, s in q) + '.')
    ref_fr = 'du Vieux-Québec' if arr else 'du centre de Québec'
    ref_en = 'from Old Québec' if arr else 'from downtown Québec City'
    fr = {'titre': f'Gestion immobilière {a.replace(nom, "{" + nom + "}")}',
          'lead': f'Lease Lane gère des immeubles locatifs {a}, {situ_fr(x)}. Location, loyers, entretien 24/7 et suivi au TAL, avec Cléo qui répond à vos locataires jour et nuit.',
          'ficheT': f'{nom} en bref', 'fiche': [[nfr(pop), 'habitants (2021)'], [pfr(pct), 'des ménages sont locataires'], [nfr(loc), 'ménages locataires'] if loc else [nfr(tot), 'ménages privés'], [kfr(x['distanceKm']), ref_fr]],
          'ficheNote': 'Sources : ' + sfr[0] + '. Distance à vol d’oiseau depuis l’hôtel de ville de Québec.',
          'secteursT': f'Les secteurs voisins de {{{nom}}}' if not re.match(r'^(La|Les|Le) ', nom) else f'Autour {("de " + nom) if not nom.startswith("Les ") else ("des " + nom[4:])}'.replace('de La ', 'de La '),
          'secteursD': 'Nous desservons aussi les municipalités voisines, dans un rayon de 50 km autour de Québec.', 'secteurs': secteurs_fr,
          'marcheT': f'Le marché locatif {a.replace(nom, "{" + nom + "}")}', 'marche': marche_fr, 'servicesT': 'Ce que nous prenons en charge', 'services': SERV_FR,
          'reglesT': 'Les règles qui s’appliquent', 'regles': regles_fr, 'faqT': 'Questions fréquentes',
          'faq': [[f'Gérez-vous des immeubles {a}?', f'Oui. Lease Lane gère des immeubles locatifs {a}, {situ_fr(x)}, et partout dans un rayon de 50 km autour de Québec.'],
                  [f'Combien de ménages sont locataires {a}?', (f'{nfr(loc)} ménages sur {nfr(tot)}, soit {pfr(pct)}, selon le Recensement de 2021.' if loc else f'{pfr(pct)} des {nfr(tot)} ménages, selon le portrait de l’arrondissement (Ville de Québec, Recensement de 2021).')],
                  ['Comment se passe le changement de gestionnaire?', 'En quatre étapes : lecture de votre contrat actuel, transfert des baux et des dossiers, avis aux locataires avec Cléo actif dès le premier jour, puis premier rapport.'],
                  [f'Combien coûte la gestion d’un immeuble {a}?', 'Le prix dépend du nombre de logements, de l’état de l’immeuble et des services voulus. Demandez une offre : nous répondons avec une proposition et un rendez-vous.']],
          'cta': {'surtitre': f'Un immeuble {a}?', 'titre': 'Parlons de {votre immeuble}.', 'texte': 'Décrivez-le en deux minutes : nous répondons avec une offre et un rendez-vous proposé.', 'bouton': 'Obtenir une offre'}}
    en = {'titre': f'Property management in {{{nom}}}',
          'lead': f'Lease Lane manages rental buildings in {nom}, {situ_en(x)}. Leasing, rent, 24/7 maintenance and TAL follow-up, with Cléo answering your tenants day and night.',
          'ficheT': f'{nom} at a glance', 'fiche': [[nen(pop), 'residents (2021)'], [pen(pct), 'of households rent'], [nen(loc), 'tenant households'] if loc else [nen(tot), 'private households'], [ken(x['distanceKm']), ref_en]],
          'ficheNote': 'Sources: ' + sen[0] + '. Straight-line distance from Québec City Hall.',
          'secteursT': f'Areas near {{{nom}}}', 'secteursD': 'We also serve the neighbouring municipalities, within 50 km of Québec City.', 'secteurs': secteurs_en,
          'marcheT': f'The rental market in {{{nom}}}', 'marche': marche_en, 'servicesT': 'What we take care of', 'services': SERV_EN,
          'reglesT': 'The rules that apply', 'regles': regles_en, 'faqT': 'Frequently asked questions',
          'faq': [[f'Do you manage buildings in {nom}?', f'Yes. Lease Lane manages rental buildings in {nom}, {situ_en(x)}, and anywhere within 50 km of Québec City.'],
                  [f'How many households rent in {nom}?', (f'{nen(loc)} households out of {nen(tot)}, or {pen(pct)}, according to the 2021 Census.' if loc else f'{pen(pct)} of its {nen(tot)} households, according to the borough profile (Ville de Québec, 2021 Census).')],
                  ['How does switching property managers work?', 'In four steps: review of your current contract, transfer of leases and files, notice to tenants with Cléo active from day one, then the first report.'],
                  [f'How much does managing a building in {nom} cost?', 'The price depends on the number of units, the building’s condition and the services you want. Request an offer: we reply with a proposal and a meeting.']],
          'cta': {'surtitre': f'A building in {nom}?', 'titre': 'Let’s talk about {your building}.', 'texte': 'Describe it in two minutes: we reply with an offer and a proposed meeting.', 'bouton': 'Get an offer'}}
    src = [list(sfr)] + [list(s) for s in src_m] + [list(s) for s in src_notes]
    titre_seo = f'Gestion immobilière {a} | Lease Lane'
    if len(titre_seo) > 62: titre_seo = f'Gestion immobilière {a}'
    titre_en = f'Property Management in {nom} | Lease Lane'
    if len(titre_en) > 62: titre_en = f'Property Management in {nom}'
    desc = f'Gestionnaire immobilier {a} ({kfr(x["distanceKm"])} {ref_fr}) : location, loyers, entretien 24/7 et suivi au TAL. {pfr(pct)} des ménages y sont locataires.'
    desc_en = f'Property manager in {nom} ({ken(x["distanceKm"])} {ref_en}): leasing, rent, 24/7 maintenance and TAL follow-up. {pen(pct)} of households rent there.'
    # Descriptions de 160 caractères au plus (affichage complet dans Google).
    if len(desc) > 160: desc = desc.replace(' : location, loyers, entretien 24/7 et suivi au TAL.', ' : location, loyers et entretien 24/7.')
    if len(desc) > 160: desc = desc.replace(' des ménages y sont locataires.', ' de locataires.')
    if len(desc_en) > 160: desc_en = desc_en.replace(': leasing, rent, 24/7 maintenance and TAL follow-up.', ': leasing, rent and 24/7 maintenance.')
    return {'fr': fr, 'en': en, 'src': src}, {'slug': x['slug'], 'path': '/gestion-immobiliere/' + x['slug'], 'page': 'locale', 'requete': 'gestion immobilière ' + nom,
            'titre': titre_seo, 'description': desc, 'fil': nom}, ['/gestion-immobiliere/' + x['slug'], '/en/property-management/' + x['slug'], titre_en, desc_en, 'property management ' + nom, nom]

LOC, ROUTES, EN = {}, [], []
for x in PALIER1:
    d, r, e = page(x)
    LOC[x['slug']] = d; ROUTES.append(r); EN.append(e)

# Page centrale
# La page centrale « Grande région de Québec » a été fusionnée le 12 oct. 2026 avec /quartiers (carte et guides des 90 secteurs, pages-guides.jsx);
# l'ancienne adresse redirige vers /quartiers (next.config.ts).

ENTETE = '/* Généré par scripts/localites/generer.py (site Next.js) à partir de données vérifiées — ne pas modifier à la main. */\n'
def ecrire(p, t):
    if not os.path.exists(p) or open(p, encoding='utf-8').read() != t: open(p, 'w', encoding='utf-8').write(t)
ecrire(os.path.join(PROTO, 'localites-donnees.js'), ENTETE + 'window.LL_LOCALITES=' + json.dumps(LOC, ensure_ascii=False) + ';\n')
ecrire(os.path.join(PROTO, 'localites-routes.js'), ENTETE + 'window.LL_LOCALITES_ROUTES=' + json.dumps(ROUTES, ensure_ascii=False, indent=0) + ';\n')
# langue.js : bloc LOCALITES (jumelles anglaises)
p = os.path.join(PROTO, 'langue.js'); s = open(p, encoding='utf-8').read()
bloc = '    /* LOCALITES:DEBUT (généré par scripts/localites/generer.py) */\n' + ''.join('    ' + json.dumps(e, ensure_ascii=False) + ',\n' for e in EN) + '    /* LOCALITES:FIN */\n'
if 'LOCALITES:DEBUT' in s:
    s = re.sub(r'    /\* LOCALITES:DEBUT.*?LOCALITES:FIN \*/\n', lambda m: bloc, s, flags=re.S)
else:
    k = "    ['/a-propos','/en/about',"
    assert s.count(k) == 1; s = s.replace(k, bloc + k)
ecrire(p, s)
print(f'{len(PALIER1)} pages locales')
for r in ROUTES: print(f"  {r['path']:58} {len(r['titre']):3} car. · {r['titre']}")
