"""Étape 1 de la prospection par les données : les immeubles locatifs d'une municipalité, tirés du rôle d'évaluation foncière
en format ouvert (MAMH, Données Québec, CC-BY 4.0). Le fichier ne contient pas le nom du propriétaire (retiré par le MAMH) :
il donne l'adresse, les lots (pour le Registre foncier), le nombre de logements, le statut du propriétaire
(1 personne physique, 2 personne morale) et la date d'inscription de chaque propriétaire.

usage : python3 -I scripts/prospection/role.py RL23027_2026.xml [RL25213_2026.xml …] --min 12 > immeubles.csv
        python3 -I scripts/prospection/role.py Roles_Donnees_Ouvertes_2026.zip --index indexRole2026.csv --min 12 > immeubles.csv   (tout le Québec, lu dans l'archive)
Index des fichiers : https://donneesouvertes.affmunqc.net/role/indexRole2026.csv
"""
import csv, sys, zipfile, xml.etree.ElementTree as ET

NOMS = {'23027': 'Québec', '25213': 'Lévis'}   # ponytail: ajouter les codes géographiques au besoin (indexRole2026.csv)


def texte(e, chemin):
    x = e.find(chemin)
    return x.text.strip() if x is not None and x.text else ''


def adresse(e):
    a = e.find('RL0101/RL0101x')
    if a is None:
        return ''
    no = texte(a, 'RL0101Ax') + ('-' + texte(a, 'RL0101Cx') if texte(a, 'RL0101Cx') else '')
    return ' '.join(x for x in (no, texte(a, 'RL0101Ex'), texte(a, 'RL0101Gx'), texte(a, 'RL0101Hx')) if x)


def unites(fichier):
    """Une ligne par unité d'évaluation (lecture en flux : le fichier de Québec fait 270 Mo)."""
    muni = ''
    for _, e in ET.iterparse(fichier, events=('end',)):
        if e.tag == 'RLM01A':
            muni = (e.text or '').strip()
        if e.tag != 'RLUEx':
            continue
        proprios = e.findall('RL0201/RL0201x')
        statuts = {texte(p, 'RL0201Hx') for p in proprios}
        dates = sorted(texte(p, 'RL0201Gx') for p in proprios if texte(p, 'RL0201Gx'))
        m = e.find('RL0104')
        yield {
            'municipalite': NOMS.get(muni.lstrip('0'), NOMS.get(muni, muni)),   # le XML écrit 08053, l'index 8053
            'matricule': '-'.join(x for x in (texte(m, 'RL0104' + c) for c in 'ABCDEFGH') if x) if m is not None else '',   # D à H : bâtiment, local
            'adresse': adresse(e),
            'lots': ' '.join(texte(l, 'RL0103Ax') for l in e.findall('RL0103/RL0103x')),
            'cubf': texte(e, 'RL0105A'),
            'logements': int(texte(e, 'RL0311A') or 0),
            'statut': 'morale' if statuts == {'2'} else 'physique' if statuts == {'1'} else 'mixte' if statuts else '',
            'proprietaires': len(proprios),
            'inscrit_le': dates[-1] if dates else '',
            'annee': texte(e, 'RL0307A'),
            'etages': texte(e, 'RL0306A'),
            'valeur': texte(e, 'RL0405A') or texte(e, 'RL0404A'),
        }
        e.clear()


def sources(args):
    """Les fichiers XML donnés, ou ceux d'une archive .zip (lus sans extraction : 5,6 Go décompressés pour tout le Québec)."""
    for a in args:
        if a.endswith('.xml'):
            yield a
        elif a.endswith('.zip'):
            z = zipfile.ZipFile(a)
            for n in sorted(z.namelist()):
                if n.endswith('.xml'):
                    with z.open(n) as f:
                        yield f


if __name__ == '__main__':
    args = sys.argv[1:]
    minimum = int(args[args.index('--min') + 1]) if '--min' in args else 12
    if '--index' in args:   # code géographique → nom de la municipalité
        NOMS.update({l['code géographique']: l['nom du territoire'] for l in csv.DictReader(open(args[args.index('--index') + 1], encoding='utf-8-sig'))})
    w = None
    for f in sources(args):
        for u in unites(f):
            if u['logements'] < minimum:
                continue
            if w is None:
                w = csv.DictWriter(sys.stdout, fieldnames=list(u))
                w.writeheader()
            w.writerow(u)
