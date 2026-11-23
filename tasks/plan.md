# Plan : Phase 2 du portail (branche phase2-frank)
Source : spec/SPEC-phase2.md, spec/capability-map.md. Approuvée par Octa le 2026-11-23 (modules désactivés par défaut, activés par client).
Ordre : T1 modules-clients → T2 carte-vacance, T3 veille-taux → T4 capex → T5 donnees-publiques. Chaque tâche : test pgTAP d'abord, migration en préprod, écran, typecheck, capture. Rien sur main ni en prod.
Risques : sens de « avis de 60 jours » inconnu (hors version); valeurs CapEx non validées; API Banque du Canada (échec → dernière valeur datée).
