#!/usr/bin/env python3
"""Joue un test pgTAP par « supabase db query » (qui ne rend que le dernier résultat) : les résultats sont gardés dans une table
temporaire puis levés en exception, ce qui annule aussi la transaction. Usage : python3 scripts/portee/jouer-test.py <test.sql> | supabase db query --linked --project-ref <préprod>"""
import re, sys
s = open(sys.argv[1]).read()
s = re.sub(r"(select plan\(\d+\);)", r"\1 create temp table res(n serial, t text);", s, count=1)
s = re.sub(r"(?m)^select (is|isnt|ok|throws_ok|lives_ok)\(", r"insert into res(t) select \1(", s)
s = s.replace("select * from finish();\nrollback;", "do $$ begin raise exception 'RESULTATS %', (select string_agg(t, ' | ' order by n) from res); end $$;")
print(s)
