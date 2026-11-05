"""Liens « # » de la maquette de Steven → vraies adresses (Grégory, 2026-11-05 : « quand on clique ici ou là, ça ne nous envoie pas »).

Utilisé par importer.py à chaque import. Lancé seul, corrige les pages déjà dans public/refonte/ :
    python3 lease-lane-site/scripts/refonte/liens_morts.py
FR et EN restent « # » : branchements.js les branche (page jumelle selon le hreflang).
"""
import re
import sys
from pathlib import Path

APP = 'https://app.leaselane.ca'
# (mot-clé dans le texte du lien, adresse); le premier qui correspond gagne. Texte comparé sans accents ni casse.
CIBLES = [
    ('connexion proprietaire', f'{APP}/espace/connexion?p=proprietaire'),
    ('connexion locataire', f'{APP}/espace/connexion?p=locataire'),
    ('se connecter', f'{APP}/?p=travailleur'),                      # « Déjà inscrit? » (inscrire-mon-entreprise)
    ('nouvelle demande de travaux', f'{APP}/locataire/demandes/nouvelle'),
    ('paiement du loyer', f'{APP}/locataire/paiements'),
    ('documents', f'{APP}/locataire/documents'),
    ('cession de bail', '/blogue/cession-de-bail-loi-31'),        # « Ce que prévoit la Loi 31, puis votre demande »
    ('endossement du bail', f'{APP}/locataire/demandes'),
    ('ajout d', f'{APP}/locataire/demandes'),
    ('avis de depart', f'{APP}/locataire/demandes'),
]
SANS = str.maketrans('àâäéèêëîïôöùûüç’', 'aaaeeeeiioouuuc\'')
LIEN = re.compile(r'<a\b([^>]*?)\bhref="#"([^>]*)>(.*?)</a>', re.S)


def relier(t, restants=None):
    def un(m):
        texte = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', m[3])).strip()
        cle = texte.lower().translate(SANS)
        if texte in ('FR', 'EN'):
            return m[0]
        for mot, adresse in CIBLES:
            if mot in cle:
                return f'<a{m[1]}href="{adresse}"{m[2]}>{m[3]}</a>'
        if restants is not None:
            restants.add(texte[:60])
        return m[0]
    return LIEN.sub(un, t)


if __name__ == '__main__':
    dossier = Path(__file__).resolve().parents[2] / 'public' / 'refonte'
    restants, n = set(), 0
    for f in sorted(dossier.glob('*.html')):
        avant = f.read_text(encoding='utf-8')
        apres = relier(avant, restants)
        if apres != avant:
            f.write_text(apres, encoding='utf-8'); n += 1
    print(f'{n} pages corrigées')
    if restants:
        print('Liens « # » sans destination (laissés tels quels) :', ' | '.join(sorted(restants)))
        sys.exit(1)
