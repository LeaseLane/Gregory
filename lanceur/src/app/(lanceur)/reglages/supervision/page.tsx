import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Icone } from '@/composants/Icones';
import { ONGLETS_REG, SOUS_REG } from '../onglets';
import { tServeur } from '@/lib/i18n/serveur';
import type { T } from '@/lib/i18n/langue';

/* Rapports · Supervision (maquette e67) : chaque interface est vérifiée toutes les 5 min depuis la base (Montréal); l'envoi des SMS et
   des courriels est lu dans la file d'envoi. Les parcours rejoués, la comparaison des captures et la qualité du site s'affichent quand
   leur source est branchée (remplis en démonstration). */
type Service = { code: string; nom: string; detail: string | null; type: string; source: string; cible: number; dispo: number | null; jours: (boolean | null)[]; ms: number | null; derniere: string | null; etat: string };
type D = { services: Service[]; incidents_mois: number; incidents_serie: number[]; incident: { id: string; numero: string; titre: string; service: string; debut: string; impact: string | null; en_attente: number | null; repli: string | null } | null;
  parcours: { nom: string; espace: string; etapes: number; run: { at: string; ok: number; ms: number | null; statut: string; note: string | null } | null }[];
  comparaison: { id: string; espace: string; version: string; reference: string; deploye_le: string; captures: number; identiques: number; pages: number; navigateurs: number; ecarts: { page: string; navigateur: string; pixels: number; titre: string; texte: string }[]; decision: string | null } | null;
  qualite: { at: string; pages: number; liens_brises: number; liens_detail: string | null; fautes: string | null; fautes_detail: string | null; accessibilite: number | null; sans_description: number | null; erreurs_js: number | null; certificat_fin: string | null } | null;
  rapport_destinataires: { ini: string; nom: string }[] };
const ETAT: Record<string, [string, string]> = { en_ligne: ['En ligne', 'ok'], incident: ['Incident en cours', 'ko'], a_verifier: ['À vérifier', 'attention'], inconnu: ['Pas encore vérifié', 'gris'], non_branche: ['Pas encore branché', 'gris'] };
const dec = (x: number | string, locale: string) => (locale.startsWith('en') ? String(x) : String(x).replace('.', ','));
const pc = (x: number | string, locale: string) => (locale.startsWith('en') ? `${dec(x, locale)}%` : `${dec(x, locale)}\u00a0%`);
const s = (ms: number | null, t: T, locale: string) => ms === null ? '—' : t('{n} s', { n: dec(Math.round(ms / 100) / 10, locale) });
const depuis = (iso: string | null, t: T) => { if (!iso) return '—'; const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return m < 60 ? t('il y a {n} min', { n: Math.max(1, m) }) : t('il y a {n} h', { n: Math.round(m / 60) }); };
const heure = (iso: string, locale: string) => { const h = new Date(iso).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }); return locale.startsWith('en') ? h : h.replace(':', ' h '); };
const jour = (iso: string, locale: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });

export default async function Page() {
  const { t, locale } = await tServeur();
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_supervision');
  const X = data as D | null;
  const I = X?.services.filter((x) => x.type === 'interface') ?? [], E = X?.services.filter((x) => x.type === 'service') ?? [];
  const mesures = X?.services.filter((x) => x.dispo !== null) ?? [], dispo = mesures.length ? mesures.reduce((a, x) => a + (x.dispo ?? 0), 0) / mesures.length : null;
  const msI = I.map((x) => x.ms).filter((x): x is number => x !== null).sort((a, b) => a - b), med = msI.length ? msI[Math.floor(msI.length / 2)] : null;
  const P = X?.parcours.filter((p) => p.run) ?? [], normaux = P.filter((p) => p.run!.statut === 'normal').length;
  const enPanne = X?.services.filter((x) => x.etat === 'incident' || x.etat === 'a_verifier') ?? [];
  const tableau = (titre: string, L: Service[]) => <><thead><tr><th>{titre}</th><th>{t('État')}</th><th>{t('Disponibilité 30 j')}</th><th className="droite">{t('Réponse')}</th><th className="droite">{t('Vérifiée')}</th></tr></thead>
    <tbody>{L.map((x) => { const [l, cl] = ETAT[x.etat] ?? ETAT.inconnu; return <tr key={x.code} className={x.etat === 'incident' ? 'ligne-alerte' : ''}>
      <td><b className="fort">{t(x.nom)}</b> <span className="gris texte-13">{x.detail ? t(x.detail) : x.detail}</span></td>
      <td><span className={'etat-service ' + cl}><i />{t(l)}</span></td>
      <td><span className="ligne-ic"><span className="dispo-jours" aria-hidden="true">{x.jours.map((j, k) => <i key={k} className={j === null ? '' : j ? 'ok' : 'ko'} />)}</span><b>{x.dispo !== null ? pc(x.dispo, locale) : '—'}</b></span></td>
      <td className={'droite' + (x.ms !== null && x.ms > x.cible ? ' rouge-txt fort' : '')}>{s(x.ms, t, locale)}</td><td className="droite gris">{x.source === 'aucune' ? '—' : depuis(x.derniere, t)}</td></tr>; })}</tbody></>;
  return (
    <CadreEspace icone="chart" nom="Rapports et réglages" sous={SOUS_REG} actif={6} onglets={ONGLETS_REG}>
      {!X ? <div className="bandeau erreur" role="alert">{error?.code === 'PT403' ? t(error.message) : t('La supervision n’a pas pu être lue.')}</div> : <>
        <div className="kpis graphe-droite" style={{ marginBottom: 24 }}>
          <div className="kpi"><span>{t('Disponibilité 30 jours')}</span><b>{dispo !== null ? pc(Math.round(dispo * 100) / 100, locale) : '—'}</b><span>{t('moyenne des {n} services mesurés', { n: mesures.length })}</span></div>
          <div className="kpi"><span>{t('Parcours critiques')}</span><b>{P.length ? t('{n} sur {total}', { n: normaux, total: P.length }) : '—'}</b><span>{P.length ? `${t('normaux')}${P.length - normaux ? ` · ${P.length - normaux > 1 ? t('{n} ralentis', { n: P.length - normaux }) : t('{n} ralenti', { n: P.length - normaux })}` : ''}` : t('pas encore rejoués')}</span></div>
          <div className="kpi"><span>{X.incident && <i className="point-rouge" />}{t('Incidents ce mois')}</span><b className={X.incident ? 'rouge-txt' : ''}>{X.incidents_mois}</b><span className={X.incident ? 'rouge-txt' : ''}>{X.incident ? t('dont 1 en cours · {titre}', { titre: t(X.incident.titre) }) : t('aucun en cours')}</span></div>
          <div className="kpi"><span>{t('Réponse médiane')}</span><b>{s(med, t, locale)}</b><span>{t('{n} interfaces · cible : 1 s', { n: I.length })}</span></div>
        </div>
        <div className="grille-2-1">
          <section className="carte-l18" aria-label={t('Interfaces et services')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{enPanne.length ? t('Tout est en ligne, sauf {noms}', { noms: enPanne.map((x) => t(x.nom).toLowerCase()).join(', ') }) : t('Tout est en ligne')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t('Vérifiées toutes les 5 min depuis le serveur de base (Montréal) · envois lus dans la file d’envoi')}</p>
            <table className="tableau tab-fixe tab-supervision"><colgroup><col style={{ width: '30%' }} /><col style={{ width: '18%' }} /><col style={{ width: '28%' }} /><col style={{ width: '10%' }} /><col /></colgroup>
              {tableau(t('Interface'), I)}{tableau(t('Service externe'), E)}</table>
          </section>
          <div className="po-colonne">
            {X.incident ? <section className="carte-l18 e2" aria-label={t('Incident en cours')}><div className="echec-tete"><span className="tuile-rouge"><Icone nom="alert" taille={20} couleur="#9B2E28" /></span>
                <div><h2>{t(X.incident.titre)}</h2><p>{t('{numero} · depuis {heure}', { numero: X.incident.numero, heure: heure(X.incident.debut, locale) })}</p></div><span className="puce todo" style={{ marginLeft: 'auto' }}>{t('En cours')}</span></div>
              {X.incident.impact && <p className="texte-13">{t(X.incident.impact)}</p>}
              <ul className="lo-docs">{X.incident.en_attente !== null && <li className="texte-13"><Icone nom="inbox" taille={16} couleur="#3E4A59" />{t('{n} en attente, aucun perdu', { n: X.incident.en_attente })}</li>}
                {X.incident.repli && <li className="texte-13"><Icone nom="mail" taille={16} couleur="#3E4A59" />{t(X.incident.repli)}</li>}</ul>
              <Link className="bouton bouton-principal" href={`/reglages/supervision/incidents/${X.incident.id}`} style={{ width: '100%', marginTop: 12 }}>{t('Ouvrir l’incident')}</Link></section>
              : <section className="carte-l18"><h2 className="titre-carte">{t('Aucun incident en cours')}</h2><p className="gris texte-13">{t('Deux vérifications ratées de suite ouvrent un incident ici.')}</p></section>}
            {X.comparaison ? <section className="carte-l18" aria-label={t('Écart visuel')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{X.comparaison.ecarts.length ? (X.comparaison.ecarts.length > 1 ? t('{n} écarts visuels dans la version {version}', { n: X.comparaison.ecarts.length, version: X.comparaison.version }) : t('{n} écart visuel dans la version {version}', { n: X.comparaison.ecarts.length, version: X.comparaison.version })) : t('Aucun écart dans la version {version}', { version: X.comparaison.version })}</h2>
                <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{t(X.comparaison.espace)} · {t('comparée à {ref}', { ref: X.comparaison.reference })}</p>
                <span className="grille-captures" aria-hidden="true">{Array.from({ length: X.comparaison.captures }, (_, k) => <i key={k} className={k === 1 && X.comparaison!.ecarts.length ? 'ecart' : ''} />)}</span>
                <p className="gris texte-12">{t('{n} captures : {pages} pages × {nav} navigateurs · {id} identiques', { n: X.comparaison.captures, pages: X.comparaison.pages, nav: X.comparaison.navigateurs, id: X.comparaison.identiques })}</p>
                {X.comparaison.ecarts[0] && <p className="cleo-note texte-13"><b>{X.comparaison.ecarts[0].page} · {X.comparaison.ecarts[0].navigateur}</b><br />{X.comparaison.ecarts[0].texte}</p>}
                <Link className="bouton bouton-contour" href="/reglages/supervision/comparaison" style={{ width: '100%' }}>{t('Comparer les captures')}</Link></section>
              : <section className="carte-l18"><h2 className="titre-carte">{t('Comparaison des captures')}</h2><p className="gris texte-13">{t('Pas encore branchée : les captures de chaque version s’afficheront ici.')}</p></section>}
          </div>
        </div>
        <div className="grille-2-1" style={{ marginTop: 24 }}>
          <section className="carte-l18" aria-label={t('Parcours critiques')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{P.length ? (P.length - normaux ? t(P.length - normaux > 1 ? 'Seuls {noms} ralentissent' : 'Seule {noms} ralentit', { noms: P.filter((p) => p.run!.statut !== 'normal').map((p) => t(p.nom).toLowerCase()).join(', ') }) : t('Tous les parcours sont normaux')) : t('Parcours critiques')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{P.length ? t('Rejoués avec des comptes témoins (données fictives) · dernière passe à {heure}', { heure: heure(P[0].run!.at, locale) }) : t('Pas encore rejoués automatiquement')}</p>
            {P.length ? <table className="tableau tab-fixe"><colgroup><col style={{ width: '36%' }} /><col style={{ width: '26%' }} /><col style={{ width: '12%' }} /><col /></colgroup>
              <thead><tr><th>{t('Parcours')}</th><th>{t('Étapes')}</th><th className="droite">{t('Durée')}</th><th>{t('Statut')}</th></tr></thead>
              <tbody>{P.map((p) => <tr key={p.nom} className={p.run!.statut !== 'normal' ? 'ligne-alerte' : ''}><td><b className="fort">{t(p.nom)}</b><span className="sous gris">{t(p.espace)} · {t('{n} étapes', { n: p.etapes })}</span></td>
                <td><span className="etapes-points">{Array.from({ length: p.etapes }, (_, k) => <i key={k} className={k < p.run!.ok ? 'ok' : 'ko'} />)}</span></td>
                <td className="droite fort">{p.run!.statut === 'normal' ? s(p.run!.ms, t, locale) : '—'}</td>
                <td><span className={'etat-service ' + (p.run!.statut === 'normal' ? 'ok' : 'ko')}><i />{p.run!.statut === 'normal' ? t('Normal') : t('Ralenti')}</span>{p.run!.note && <span className="sous gris">{t(p.run!.note)}</span>}</td></tr>)}</tbody></table>
              : <p className="gris texte-13">{t('Les parcours (payer le loyer, déposer une demande, signer un bail…) s’afficheront ici dès que les tests de bout en bout écriront leurs passes.')}</p>}
            <p className="ligne-ic gris texte-13" style={{ margin: '12px 24px 0' }}><Icone nom="shieldc" taille={16} couleur="#58697F" />{t('Comptes témoins : les captures ne montrent jamais un vrai locataire (Loi 25).')}</p>
          </section>
          <div className="po-colonne">
            <section className="carte-l18" aria-label={t('Qualité du site')}>{X.qualite ? <><h2 className="titre-carte" style={{ marginBottom: 2 }}>{X.qualite.liens_brises > 1 ? t('{n} liens brisés à corriger', { n: X.qualite.liens_brises }) : t('{n} lien brisé à corriger', { n: X.qualite.liens_brises })}</h2>
                <p className="gris texte-13" style={{ margin: '0 0 8px' }}>{t('Analyse du {date} · {n} pages FR et EN', { date: jour(X.qualite.at, locale), n: X.qualite.pages })}</p>
                <ul className="lo-docs">
                  <li><span className="a-faire-ic"><Icone nom="globe" taille={18} couleur="#0C2147" /></span><div><strong>{t('Liens brisés')}</strong><span className="gris texte-13">{X.qualite.liens_detail}</span></div><b>{X.qualite.liens_brises}</b></li>
                  {X.qualite.fautes && <li><span className="a-faire-ic"><Icone nom="pencil" taille={18} couleur="#0C2147" /></span><div><strong>{t('Fautes d’orthographe')}</strong><span className="gris texte-13">{X.qualite.fautes_detail}</span></div><b>{X.qualite.fautes}</b></li>}
                  {X.qualite.accessibilite !== null && <li><span className="a-faire-ic"><Icone nom="eye" taille={18} couleur="#0C2147" /></span><div><strong>{t('Accessibilité')}</strong><span className="gris texte-13">{t('{n} pages sans description (SEO)', { n: X.qualite.sans_description })}</span></div><b>{X.qualite.accessibilite}/100</b></li>}
                  {X.qualite.erreurs_js !== null && <li><span className="a-faire-ic"><Icone nom="spark" taille={18} couleur="#0C2147" /></span><div><strong>{t('Erreurs JavaScript')}</strong><span className="gris texte-13">{t('Aucun contenu mixte')}</span></div><b>{X.qualite.erreurs_js}</b></li>}
                  {X.qualite.certificat_fin && <li><span className="a-faire-ic"><Icone nom="lock" taille={18} couleur="#0C2147" /></span><div><strong>{t('Certificat valide jusqu’au {date}', { date: jour(X.qualite.certificat_fin, locale) })}</strong><span className="gris texte-13">{t('Renouvellement automatique')}</span></div></li>}
                </ul></> : <><h2 className="titre-carte">{t('Qualité du site')}</h2><p className="gris texte-13">{t('Pas encore analysée : liens brisés, fautes et accessibilité s’afficheront ici.')}</p></>}
            </section>
            <section className="carte-l18" aria-label={t('Rapport du lundi')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Rapport du lundi')}</h2><p className="gris texte-13" style={{ margin: "0 0 12px" }}>{t('Gabarit EQP-10 prêt · envoi du lundi 7 h pas encore planifié')}</p>
              <p className="ligne-ic" style={{ gap: 16, flexWrap: 'wrap' }}>{X.rapport_destinataires.map((r) => <span key={r.nom} className="ligne-ic texte-13"><span className="ini" style={{ width: 28, height: 28, fontSize: 10 }}>{r.ini}</span>{r.nom}</span>)}</p></section>
          </div>
        </div>
      </>}
    </CadreEspace>
  );
}
