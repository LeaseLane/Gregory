#!/usr/bin/env python3
"""Portée « client → immeuble » de l'administration (phase 1 du plan du 12 nov. 2026, décision D01).

Le sélecteur de Lanceur envoie l'en-tête « x-ll-portee: <owner_id>[:<building_id>] ». En base, des vues « portee.* » ne
rendent que les lignes de cette portée, et chaque fonction de LECTURE (stable) lit ces vues au lieu des tables. Ce script
écrit la migration : les vues, puis les fonctions de lecture réécrites (« from public.x » → « from portee.x »).

À relancer quand une colonne est ajoutée à une table de la portée ou qu'une fonction de lecture est modifiée :
  supabase db query --linked "<requêtes ci-dessous>" > tables.json / fonctions.json
  python3 scripts/portee/generer.py tables.json fonctions.json > supabase/migrations/<horodatage>_portee.sql
Le test supabase/tests/portee_test.sql échoue si une fonction de lecture lit encore une table de la portée directement.
"""
import json, re, sys

# Tables hors portée : le pipeline de vente n'appartient à aucun client tant que le mandat n'est pas signé.
HORS = {'crm.contacts', 'crm.deals', 'crm.assignments'}
LIGNES = [('crm.probleme_document', 'd', 'public.documents', 'text'), ('crm.titre_demande', 'sr', 'public.service_requests', 'text')]
ORDRE = ['building_id', 'unit_id', 'lease_id', 'owner_id', 'tenant_id']   # du plus précis au plus large
P = '(select crm.portee_proprio())'

def vue(t):   # public.payments → portee.payments ; fin.owner_statements → portee.fin_owner_statements
    s, n = t.split('.')
    return 'portee.' + (n if s == 'public' else f'{s}_{n}')

def condition(cols):
    test = {'building_id': 't.building_id in (select id from portee.buildings)', 'unit_id': 't.unit_id in (select id from portee.units)',
            'lease_id': 't.lease_id in (select id from portee.leases)', 'owner_id': f't.owner_id = {P}', 'tenant_id': 't.tenant_id in (select id from portee.tenants)'}
    cas = ' '.join(f'when t.{c} is not null then {test[c]}' for c in ORDRE if c in cols)
    return f'{P} is null or case {cas} else true end'   # aucune attache : la ligne n'appartient à aucun client, elle reste visible

def main(f_tables, f_fonctions):
    tables = {f"{x['s']}.{x['t']}": x['cols'].split(',') for x in json.load(open(f_tables))}
    for h in HORS: tables.pop(h, None)
    base = ['public.owners', 'public.buildings', 'public.units', 'public.leases', 'public.tenants']
    out = ["""-- GÉNÉRÉ par scripts/portee/generer.py : ne pas modifier à la main (relancer le script).
-- Phase 1 du plan du portail (rencontre du 12 nov. 2026, D01) : l'administration se lit par client (propriétaire), puis par immeuble.
-- Le sélecteur de Lanceur envoie « x-ll-portee: <owner_id>[:<building_id>] »; sans cet en-tête, rien ne change (tout est visible).
-- La portée ne s'applique qu'aux LECTURES (transaction en lecture seule de PostgREST pour une fonction stable) : une écriture voit toujours
-- toutes les lignes, pour que ses contrôles (doublons, existence) restent justes. Elle ne donne aucun droit : elle ne fait que restreindre.
create schema if not exists portee;
revoke all on schema portee from public, anon, authenticated;

create or replace function crm.portee_brute() returns text language sql stable set search_path = '' as $$
  select case when current_setting('transaction_read_only', true) = 'on' then
    nullif(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-ll-portee', ''), '') end;
$$;
create or replace function crm.portee_proprio() returns uuid language sql stable set search_path = '' as $$
  select case when split_part(crm.portee_brute(), ':', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then split_part(crm.portee_brute(), ':', 1)::uuid end;
$$;
create or replace function crm.portee_immeuble() returns uuid language sql stable set search_path = '' as $$
  select case when crm.portee_proprio() is not null and split_part(crm.portee_brute(), ':', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then split_part(crm.portee_brute(), ':', 2)::uuid end;
$$;

-- Vues de base : le propriétaire, ses immeubles (ou le seul immeuble choisi), leurs logements, leurs baux, leurs locataires.
create or replace view portee.owners as select t.* from public.owners t where """ + P + """ is null or t.id = """ + P + """;
create or replace view portee.buildings as select t.* from public.buildings t where """ + P + """ is null
  or (t.owner_id = """ + P + """ and ((select crm.portee_immeuble()) is null or t.id = (select crm.portee_immeuble())));
create or replace view portee.units as select t.* from public.units t where """ + P + """ is null or t.building_id in (select id from portee.buildings);
create or replace view portee.leases as select t.* from public.leases t where """ + P + """ is null or t.unit_id in (select id from portee.units);
create or replace view portee.tenants as select t.* from public.tenants t where """ + P + """ is null
  or t.id in (select l.tenant_id from portee.leases l) or t.id in (select lt.tenant_id from public.lease_tenants lt where lt.lease_id in (select id from portee.leases));
"""]
    for t in sorted(tables):
        if t in base: continue
        out.append(f"create or replace view {vue(t)} as select t.* from {t} t where {condition(tables[t])};")
    out.append("revoke all on all tables in schema portee from public, anon, authenticated;\n")

    # Aides qui reçoivent une LIGNE entière d'une table de la portée : la ligne d'une vue n'a pas le même type, il leur faut un relais.
    # (Liste : pg_proc dont un argument est le type composite d'une table de la portée, fonctions stables seulement.)
    for fonction, arg, table, retour in LIGNES:
        out.append(f"create or replace function {fonction}({arg} {vue(table)}) returns {retour} language sql stable set search_path = '' as $$ select {fonction}(row({arg}.*)::{table}) $$;")
    noms = set(tables) | set(base)
    rx = re.compile(r'\b(from|join)(\s+)((?:public|crm|fin|jur|maint|comms)\.[a-z_0-9]+)\b', re.I)
    n = 0
    out.append("-- Fonctions de lecture : mêmes définitions, lues à travers les vues de la portée.\nset check_function_bodies = off;")
    for f in json.load(open(f_fonctions)):
        if f['v'] == 'v': continue
        neuf = rx.sub(lambda m: f"{m.group(1)}{m.group(2)}{vue(m.group(3).lower())}" if m.group(3).lower() in noms else m.group(0), f['def'])
        if neuf == f['def']: continue
        n += 1
        out.append(neuf.rstrip() + ';')
    out.append(f"-- {n} fonctions de lecture réécrites.")
    print('\n'.join(out))
    print(f'{n} fonctions, {len(tables) - len([b for b in base if b in tables]) + len(base)} vues', file=sys.stderr)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
