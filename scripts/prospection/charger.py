"""Écrit la migration qui charge (ou met à jour) crm.immeubles_role à partir du CSV de role.py. Les champs saisis par l'équipe
(propriétaire, NEQ, groupe, écarté, note) ne sont jamais écrasés : une nouvelle année du rôle ne fait que rafraîchir les données publiques.

usage : python3 -I scripts/prospection/charger.py immeubles.csv 2026 > supabase/migrations/<horodatage>_prospection_role_donnees.sql
"""
import csv, sys

q = lambda v: 'null' if v in ('', None) else "'" + str(v).replace("'", "''") + "'"
n = lambda v: v if v not in ('', None) else 'null'
lignes = list(csv.DictReader(open(sys.argv[1], encoding='utf-8')))
millesime = int(sys.argv[2])
print(f'-- Rôle d\'évaluation foncière {millesime} en format ouvert (MAMH, CC-BY 4.0) : {len(lignes)} immeubles de '
      f'{min(int(l["logements"]) for l in lignes)} logements et plus (généré par scripts/prospection/charger.py, ne pas modifier à la main).')
for i in range(0, len(lignes), 500):
    print('insert into crm.immeubles_role (millesime, municipalite, matricule, adresse, lots, cubf, logements, statut, proprietaires, inscrit_le, annee, valeur) values')
    print(',\n'.join(f"({millesime}, {q(l['municipalite'])}, {q(l['matricule'])}, {q(l['adresse'])}, {q(l['lots'])}, {q(l['cubf'])}, {l['logements']}, {q(l['statut'])}, "
                     f"{n(l['proprietaires'])}, {q(l['inscrit_le'])}, {n(l['annee'])}, {n(l['valeur'])})" for l in lignes[i:i + 500]))
    print('on conflict (municipalite, matricule) do update set millesime = excluded.millesime, adresse = excluded.adresse, lots = excluded.lots, cubf = excluded.cubf, '
          'logements = excluded.logements, statut = excluded.statut, proprietaires = excluded.proprietaires, inscrit_le = excluded.inscrit_le, annee = excluded.annee, valeur = excluded.valeur;')
