"""Feuilles principales du prototype (finition.css, responsive.css) -> src/styles, avec la retouche nécessaire au compilateur CSS.
   Écrit seulement si le contenu change (dossier synchronisé par iCloud).
   Usage : python3 feuilles.py <dossier du prototype> <racine du projet Next.js>"""
import os, re, sys
P, N = sys.argv[1], sys.argv[2]
for nom in ('finition.css', 'responsive.css'):
    s = open(os.path.join(P, nom), encoding='utf-8').read()
    if nom == 'responsive.css':
        # Accolade orpheline après le bloc du pied de page mobile : le navigateur l'ignore, le compilateur CSS la refuse.
        a = "text-align:center}\n}\n}\n"
        if a in s:
            s = s.replace(a, "text-align:center}\n}\n/* (accolade orpheline du prototype retirée : le navigateur l’ignorait, le compilateur CSS la refuse) */\n", 1)
    # Le HTML du serveur écrit les styles en ligne sans espace (« font-size:11px ») alors que le navigateur du prototype
    # les normalise (« font-size: 11px ») : chaque sélecteur [style*="…: …"] vise désormais les deux écritures.
    def deux(m):
        v = m.group(1)
        if ': ' not in v and '; ' not in v: return m.group(0)
        c = v.replace(': ', ':').replace('; ', ';')
        return ':is([style*="%s"],[style*="%s"])' % (v, c)
    s = re.sub(r'\[style\*="([^"]*)"\]', deux, s)
    p = os.path.join(N, 'src', 'styles', nom)
    if not os.path.exists(p) or open(p, encoding='utf-8').read() != s:
        open(p, 'w', encoding='utf-8').write(s)
        print('styles :', nom, 'mis à jour')
