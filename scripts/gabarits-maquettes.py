# Écrit la migration des 58 gabarits de courriels (comms.email_templates) à partir des maquettes :
#   PHASE 2 COMPLÈTE/…/penpot-sources/gen/c_loc.py et c_autres.py (mêmes définitions que les planches Penpot).
# Les maquettes contiennent des EXEMPLES (Gabriel Paquet, 1 195 $…). Un gabarit n'est activé qu'une fois
# ses exemples remplacés par des {variables} : voir VARIABLES ci-dessous. Les autres sont importés inactifs
# (visibles dans e54, impossibles à mettre en file).
# Usage : python3 -I scripts/gabarits-maquettes.py "<dossier gen>" > supabase/migrations/<horodatage>_t2_gabarits_<objet>.sql
# Chaque régénération = une NOUVELLE migration (les insertions sont des mises à jour par code); les tests lisent la plus récente.
import importlib.util, json, os, re, sys

GEN = sys.argv[1]
def load(n):
    s = importlib.util.spec_from_file_location(n, os.path.join(GEN, n + '.py')); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m.T
ALL = load('c_loc') + load('c_autres')

ESSENTIELS = {'LOC-02', 'PRO-09', 'EQP-06', 'EQP-08', 'EQP-11'}   # courriels.md § 2 : partent à toute heure
GEST = {'ini': '{initiales_gestionnaire}', 'name': '{gestionnaire}', 'role': 'Gestionnaire · Lease Lane'}

# Gabarits convertis : chaque exemple de la maquette devient une variable; le texte et la structure restent ceux de la maquette.
VARIABLES = {
  'LOC-04': dict(subject='C’est réparé : {probleme} ({numero_demande})', title='C’est réparé : {probleme}',
    intro='{fournisseur} a terminé l’intervention le {date_intervention}.',
    blocks=[['kv', {'rows': [['Intervention', '{travaux}'], ['Durée', '{duree}'], ['Coût pour vous', '{cout_locataire}']]}],
            ['p', {'t': 'Tout fonctionne bien? Votre avis nous aide à choisir les bons fournisseurs.'}]],
    cta={'l': 'Tout est correct', 'href': '{lien_confirmation}', 'link': 'Signaler un problème', 'linkHref': '{lien_probleme}'}),
  'LOC-05': dict(subject='Rappel : loyer {de_mois}', pre='Votre paiement de {montant} n’est pas encore arrivé.',
    title='Votre loyer {de_mois} n’est pas encore arrivé',
    intro='{prenom}, c’est peut-être un oubli : le paiement de {montant} prévu le {echeance} n’apparaît pas encore à votre dossier.',
    blocks=[['kv', {'rows': [['Montant', '{montant}'], ['Échéance', '{echeance}'], ['Logement', '{adresse_logement}']]}],
            ['p', {'t': 'Déjà payé? Ignorez ce message : un virement prend parfois un jour ouvrable.'}]],
    cta={'l': 'Payer maintenant', 'href': '{lien_paiement}', 'link': 'Besoin d’une entente de paiement? Répondez à ce courriel.'}, sign=GEST,
    sms='Lease Lane : votre loyer de {montant} ({mois}) n’est pas encore reçu. Payer : {lien_paiement}. Déjà payé? Ignorez ce message.'),
  'LOC-06': dict(subject='Loyer {de_mois} : {jours_retard} jours de retard', title='Votre loyer {de_mois} a {jours_retard} jours de retard',
    intro='{prenom}, nous n’avons pas reçu le loyer de {montant} dû le {echeance}. Si une difficulté vous empêche de payer, une entente reste possible.',
    blocks=[['meter', {'label': 'Retard', 'value': '{jours_retard} jours', 'r': '{ratio_retard}', 'cap': 'Au-delà de 3 semaines, le propriétaire peut demander la résiliation du bail (art. 1971 C.c.Q.).'}],
            ['kv', {'rows': [['Montant dû', '{montant}'], ['Logement', '{adresse_logement}']]}]],
    cta={'l': 'Payer {montant}', 'href': '{lien_paiement}', 'link': 'Proposer une entente de paiement', 'linkHref': '{lien_entente}'}, sign=GEST),
  'LOC-10': dict(subject='Avis de renouvellement de votre bail : {adresse_logement}', title='Votre bail sera renouvelé le {date_renouvellement}',
    intro='{formule}, votre bail se termine le {date_fin_bail}. Nous vous proposons de le renouveler pour {duree}, aux conditions suivantes.',
    blocks=[['table', {'head': ['Condition', 'Nouveau bail'], 'rows': [['Durée', '{duree}, dès le {date_renouvellement}'], ['Loyer mensuel', '{loyer_ligne}'], ['Autres conditions', '{autres_conditions}']]}],
            ['notice', {'k': 'legal', 'title': 'Vous avez {delai_reponse} pour répondre', 't': 'Vous pouvez accepter, refuser la modification ou quitter le logement. Sans réponse dans ce délai, vous êtes réputé avoir accepté (art. 1945 C.c.Q.).'}]],
    cta={'l': 'Répondre à l’avis', 'href': '{lien_reponse}', 'link': 'Répondez aussi simplement à ce courriel.'}, sign=GEST),
  'LOC-14': dict(pre='Nécessaire pour étudier votre candidature au {adresse_logement}.',
    intro='{prenom}, pour étudier votre candidature, nous devons vérifier votre dossier de crédit auprès d’Ozeille. Nous ne le ferons qu’avec votre accord.',
    cta={'l': 'Donner mon consentement', 'href': '{lien_consentement}', 'link': 'Refuser : la candidature ne pourra pas être étudiée', 'linkHref': '{lien_consentement}'}, sign=GEST),
  'EQP-11': dict(pre='Par {par} à {heure} · {raison}',
    intro='{par} a suspendu les envois automatiques à {heure}. Rien ne part tant qu’une personne ne les réactive pas.',
    blocks=[['kv', {'rows': [['Raison', '{raison}'], ['Durée', '{duree}'], ['Envois retenus', '{envois_retenus}']]}],
            ['bullets', {'items': ['Cléo répond toujours aux messages reçus, sans rien envoyer d’elle-même.', 'Les avis déjà approuvés attendent aussi la reprise.', 'La reprise sera inscrite au journal, avec son auteur et sa raison.']}]],
    cta={'l': 'Voir les automatisations', 'href': '{lien}'}),
}

# Valeurs d'exemple (celles de la maquette) : aperçu dans Studio › Gabarits et « Envoyer un test ».
EXEMPLES = {
  'LOC-04': {'probleme': 'Fuite sous l’évier', 'numero_demande': 'DEM-2026-0161', 'fournisseur': 'Plomberie Capitale', 'date_intervention': 'jeudi 15 octobre à 9 h 40',
             'travaux': 'Remplacement du siphon', 'duree': '35 minutes', 'cout_locataire': 'Aucun', 'lien_confirmation': 'https://app.leaselane.ca/?p=locataire', 'lien_probleme': 'https://app.leaselane.ca/?p=locataire'},
  'LOC-05': {'prenom': 'Gabriel', 'montant': '1 195 $', 'mois': 'octobre', 'de_mois': 'd’octobre', 'echeance': '1er octobre 2026', 'adresse_logement': '640, 3e Avenue — 7',
             'lien_paiement': 'https://app.leaselane.ca/?p=locataire', 'gestionnaire': 'Julie N.', 'initiales_gestionnaire': 'JN'},
  'LOC-06': {'prenom': 'Gabriel', 'montant': '1 195 $', 'de_mois': 'd’octobre', 'jours_retard': '7', 'ratio_retard': '0.333', 'echeance': '1er octobre 2026',
             'adresse_logement': '640, 3e Avenue — 7', 'lien_paiement': 'https://app.leaselane.ca/?p=locataire', 'lien_entente': 'mailto:info@leaselane.ca?subject=Entente%20de%20paiement',
             'gestionnaire': 'Julie N.', 'initiales_gestionnaire': 'JN'},
  'LOC-10': {'formule': 'Monsieur Gagnon', 'adresse_logement': '1180, Cartier — 3', 'date_fin_bail': '31 mars 2027', 'date_renouvellement': '1er avril 2027', 'duree': '12 mois',
             'loyer_ligne': '1 284 $ (actuel : 1 245 $)', 'autres_conditions': 'Inchangées', 'delai_reponse': 'un mois', 'lien_reponse': 'https://app.leaselane.ca/?p=locataire',
             'gestionnaire': 'Julie N.', 'initiales_gestionnaire': 'JN'},
  'EQP-11': {'par': 'Steven Paradis', 'heure': '12 h 10', 'raison': 'Erreur de montant dans LOC-05', 'duree': 'Jusqu’à la réactivation', 'envois_retenus': '23', 'lien': 'https://app.leaselane.ca/'},
}

def lcap(s):
    if 'Commercial' in s: return 'commercial'
    if s.startswith('Interne'): return 'internal'
    if 'légal' in s: return 'legal'
    return 'transactional'
def mode(s):
    return 'auto' if s.startswith('Automatique') else 'after_approval' if s.startswith('Après') else 'manual'
q = lambda s: 'null' if s is None else "'" + str(s).replace("'", "''") + "'"
CHAMPS = ('subject', 'pre', 'label', 'icon', 'eyebrow', 'title', 'intro', 'accent', 'blocks', 'cta', 'sign', 'foot')

print('-- T2 · Les 58 gabarits de la maquette (généré par scripts/gabarits-maquettes.py, ne pas modifier à la main).')
print('-- Actifs : ' + ', '.join(sorted(VARIABLES)) + '. Les autres gardent les exemples de la maquette et restent inactifs.')
for t in sorted(ALL, key=lambda t: t['code']):
    sp = t['spec']; v = VARIABLES.get(t['code'], {})
    c = {k: t[k] for k in CHAMPS if t.get(k) is not None}; c.update({k: x for k, x in v.items() if k != 'sms'})
    if c.get('sign') and t['sign'].get('ini') == 'JN' and t['code'] in VARIABLES: c['sign'] = GEST
    sms = v.get('sms', sp.get('sms'))
    c['spec'] = {k: sp[k] for k in ('trigger', 'send', 'when', 'lcap', 'note', 'files') if sp.get(k)}
    vars_ = sorted(set(re.findall(r'\{([a-z_]+)\}', json.dumps(c, ensure_ascii=False) + (sms or '')))) if v else [x.strip('{}') for x in sp.get('vars', [])]
    if t['code'] in EXEMPLES:
        c['exemple'] = EXEMPLES[t['code']]
        assert set(vars_) <= set(EXEMPLES[t['code']]), (t['code'], set(vars_) - set(EXEMPLES[t['code']]))
    cat = lcap(sp.get('lcap', ''))
    print(f"insert into comms.email_templates (code, audience, name, sms_text, contenu, subject, preheader, variables, trigger_event, send_mode, essential, lcap_category, unsubscribe_required, active) values ("
          f"{q(t['code'])}, {q(t['aud'])}, {q(t['name'].split(' · ', 2)[-1])}, {q(sms)}, {q(json.dumps(c, ensure_ascii=False))}::jsonb, {q(c['subject'])}, {q(c.get('pre'))}, "
          f"array[{', '.join(q(x) for x in vars_)}]::text[], {q(sp.get('trigger'))}, {q(mode(sp.get('send', '')))}, {str(t['code'] in ESSENTIELS).lower()}, {q(cat)}, {str(cat == 'commercial').lower()}, {str(t['code'] in VARIABLES).lower()})")
    print("on conflict (code, locale, version) do update set audience = excluded.audience, name = excluded.name, sms_text = excluded.sms_text, contenu = excluded.contenu, subject = excluded.subject, preheader = excluded.preheader, variables = excluded.variables, trigger_event = excluded.trigger_event, send_mode = excluded.send_mode, essential = excluded.essential, lcap_category = excluded.lcap_category, unsubscribe_required = excluded.unsubscribe_required, active = excluded.active, updated_at = now();")
