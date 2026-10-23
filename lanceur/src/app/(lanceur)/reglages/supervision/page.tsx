import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Icone } from '@/composants/Icones';
import { ONGLETS_REG, SOUS_REG } from '../onglets';

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
const s = (ms: number | null) => ms === null ? '—' : `${String(Math.round(ms / 100) / 10).replace('.', ',')} s`;
const depuis = (iso: string | null) => { if (!iso) return '—'; const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return m < 60 ? `il y a ${Math.max(1, m)} min` : `il y a ${Math.round(m / 60)} h`; };
const heure = (iso: string) => new Date(iso).toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).replace(':', ' h ');
const jour = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });

export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_supervision');
  const X = data as D | null;
  const I = X?.services.filter((x) => x.type === 'interface') ?? [], E = X?.services.filter((x) => x.type === 'service') ?? [];
  const mesures = X?.services.filter((x) => x.dispo !== null) ?? [], dispo = mesures.length ? mesures.reduce((a, x) => a + (x.dispo ?? 0), 0) / mesures.length : null;
  const msI = I.map((x) => x.ms).filter((x): x is number => x !== null).sort((a, b) => a - b), med = msI.length ? msI[Math.floor(msI.length / 2)] : null;
  const P = X?.parcours.filter((p) => p.run) ?? [], normaux = P.filter((p) => p.run!.statut === 'normal').length;
  const enPanne = X?.services.filter((x) => x.etat === 'incident' || x.etat === 'a_verifier') ?? [];
  const tableau = (titre: string, L: Service[]) => <><thead><tr><th>{titre}</th><th>État</th><th>Disponibilité 30 j</th><th className="droite">Réponse</th><th className="droite">Vérifiée</th></tr></thead>
    <tbody>{L.map((x) => { const [l, t] = ETAT[x.etat] ?? ETAT.inconnu; return <tr key={x.code} className={x.etat === 'incident' ? 'ligne-alerte' : ''}>
      <td><b className="fort">{x.nom}</b> <span className="gris texte-13">{x.detail}</span></td>
      <td><span className={'etat-service ' + t}><i />{l}</span></td>
      <td><span className="ligne-ic"><span className="dispo-jours" aria-hidden="true">{x.jours.map((j, k) => <i key={k} className={j === null ? '' : j ? 'ok' : 'ko'} />)}</span><b>{x.dispo !== null ? `${String(x.dispo).replace('.', ',')} %` : '—'}</b></span></td>
      <td className={'droite' + (x.ms !== null && x.ms > x.cible ? ' rouge-txt fort' : '')}>{s(x.ms)}</td><td className="droite gris">{x.source === 'aucune' ? '—' : depuis(x.derniere)}</td></tr>; })}</tbody></>;
  return (
    <CadreEspace icone="chart" nom="Rapports et réglages" sous={SOUS_REG} actif={6} onglets={ONGLETS_REG}>
      {!X ? <div className="bandeau erreur" role="alert">{error?.code === 'PT403' ? error.message : 'La supervision n’a pas pu être lue.'}</div> : <>
        <div className="kpis graphe-droite" style={{ marginBottom: 24 }}>
          <div className="kpi"><span>Disponibilité 30 jours</span><b>{dispo !== null ? `${String(Math.round(dispo * 100) / 100).replace('.', ',')} %` : '—'}</b><span>moyenne des {mesures.length} services mesurés</span></div>
          <div className="kpi"><span>Parcours critiques</span><b>{P.length ? `${normaux} sur ${P.length}` : '—'}</b><span>{P.length ? `normaux${P.length - normaux ? ` · ${P.length - normaux} ralenti${P.length - normaux > 1 ? 's' : ''}` : ''}` : 'pas encore rejoués'}</span></div>
          <div className="kpi"><span>{X.incident && <i className="point-rouge" />}Incidents ce mois</span><b className={X.incident ? 'rouge-txt' : ''}>{X.incidents_mois}</b><span className={X.incident ? 'rouge-txt' : ''}>{X.incident ? `dont 1 en cours · ${X.incident.titre}` : 'aucun en cours'}</span></div>
          <div className="kpi"><span>Réponse médiane</span><b>{s(med)}</b><span>{I.length} interfaces · cible : 1 s</span></div>
        </div>
        <div className="grille-2-1">
          <section className="carte-l18" aria-label="Interfaces et services"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{enPanne.length ? `Tout est en ligne, sauf ${enPanne.map((x) => x.nom.toLowerCase()).join(', ')}` : 'Tout est en ligne'}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>Vérifiées toutes les 5 min depuis le serveur de base (Montréal) · envois lus dans la file d’envoi</p>
            <table className="tableau tab-fixe tab-supervision"><colgroup><col style={{ width: '30%' }} /><col style={{ width: '18%' }} /><col style={{ width: '28%' }} /><col style={{ width: '10%' }} /><col /></colgroup>
              {tableau('Interface', I)}{tableau('Service externe', E)}</table>
          </section>
          <div className="po-colonne">
            {X.incident ? <section className="carte-l18 e2" aria-label="Incident en cours"><div className="echec-tete"><span className="tuile-rouge"><Icone nom="alert" taille={20} couleur="#9B2E28" /></span>
                <div><h2>{X.incident.titre}</h2><p>{X.incident.numero} · depuis {heure(X.incident.debut)}</p></div><span className="puce todo" style={{ marginLeft: 'auto' }}>En cours</span></div>
              {X.incident.impact && <p className="texte-13">{X.incident.impact}</p>}
              <ul className="lo-docs">{X.incident.en_attente !== null && <li className="texte-13"><Icone nom="inbox" taille={16} couleur="#3E4A59" />{X.incident.en_attente} en attente, aucun perdu</li>}
                {X.incident.repli && <li className="texte-13"><Icone nom="mail" taille={16} couleur="#3E4A59" />{X.incident.repli}</li>}</ul>
              <Link className="bouton bouton-principal" href={`/reglages/supervision/incidents/${X.incident.id}`} style={{ width: '100%', marginTop: 12 }}>Ouvrir l’incident</Link></section>
              : <section className="carte-l18"><h2 className="titre-carte">Aucun incident en cours</h2><p className="gris texte-13">Deux vérifications ratées de suite ouvrent un incident ici.</p></section>}
            {X.comparaison ? <section className="carte-l18" aria-label="Écart visuel"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{X.comparaison.ecarts.length ? `${X.comparaison.ecarts.length} écart${X.comparaison.ecarts.length > 1 ? 's' : ''} visuel${X.comparaison.ecarts.length > 1 ? 's' : ''} dans la version ${X.comparaison.version}` : `Aucun écart dans la version ${X.comparaison.version}`}</h2>
                <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{X.comparaison.espace} · comparée à {X.comparaison.reference}</p>
                <span className="grille-captures" aria-hidden="true">{Array.from({ length: X.comparaison.captures }, (_, k) => <i key={k} className={k === 1 && X.comparaison!.ecarts.length ? 'ecart' : ''} />)}</span>
                <p className="gris texte-12">{X.comparaison.captures} captures : {X.comparaison.pages} pages × {X.comparaison.navigateurs} navigateurs · {X.comparaison.identiques} identiques</p>
                {X.comparaison.ecarts[0] && <p className="cleo-note texte-13"><b>{X.comparaison.ecarts[0].page} · {X.comparaison.ecarts[0].navigateur}</b><br />{X.comparaison.ecarts[0].texte}</p>}
                <Link className="bouton bouton-contour" href="/reglages/supervision/comparaison" style={{ width: '100%' }}>Comparer les captures</Link></section>
              : <section className="carte-l18"><h2 className="titre-carte">Comparaison des captures</h2><p className="gris texte-13">Pas encore branchée : les captures de chaque version s’afficheront ici.</p></section>}
          </div>
        </div>
        <div className="grille-2-1" style={{ marginTop: 24 }}>
          <section className="carte-l18" aria-label="Parcours critiques"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{P.length ? (P.length - normaux ? `Seul${P.length - normaux > 1 ? 's' : 'e'} ${P.filter((p) => p.run!.statut !== 'normal').map((p) => p.nom.toLowerCase()).join(', ')} ralenti${P.length - normaux > 1 ? 'ssent' : 't'}` : 'Tous les parcours sont normaux') : 'Parcours critiques'}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{P.length ? `Rejoués avec des comptes témoins (données fictives) · dernière passe à ${heure(P[0].run!.at)}` : 'Pas encore rejoués automatiquement'}</p>
            {P.length ? <table className="tableau tab-fixe"><colgroup><col style={{ width: '36%' }} /><col style={{ width: '26%' }} /><col style={{ width: '12%' }} /><col /></colgroup>
              <thead><tr><th>Parcours</th><th>Étapes</th><th className="droite">Durée</th><th>Statut</th></tr></thead>
              <tbody>{P.map((p) => <tr key={p.nom} className={p.run!.statut !== 'normal' ? 'ligne-alerte' : ''}><td><b className="fort">{p.nom}</b><span className="sous gris">{p.espace} · {p.etapes} étapes</span></td>
                <td><span className="etapes-points">{Array.from({ length: p.etapes }, (_, k) => <i key={k} className={k < p.run!.ok ? 'ok' : 'ko'} />)}</span></td>
                <td className="droite fort">{p.run!.statut === 'normal' ? s(p.run!.ms) : '—'}</td>
                <td><span className={'etat-service ' + (p.run!.statut === 'normal' ? 'ok' : 'ko')}><i />{p.run!.statut === 'normal' ? 'Normal' : 'Ralenti'}</span>{p.run!.note && <span className="sous gris">{p.run!.note}</span>}</td></tr>)}</tbody></table>
              : <p className="gris texte-13">Les parcours (payer le loyer, déposer une demande, signer un bail…) s’afficheront ici dès que les tests de bout en bout écriront leurs passes.</p>}
            <p className="ligne-ic gris texte-13" style={{ margin: '12px 24px 0' }}><Icone nom="shieldc" taille={16} couleur="#58697F" />Comptes témoins : les captures ne montrent jamais un vrai locataire (Loi 25).</p>
          </section>
          <div className="po-colonne">
            <section className="carte-l18" aria-label="Qualité du site">{X.qualite ? <><h2 className="titre-carte" style={{ marginBottom: 2 }}>{X.qualite.liens_brises} lien{X.qualite.liens_brises > 1 ? 's' : ''} brisé{X.qualite.liens_brises > 1 ? 's' : ''} à corriger</h2>
                <p className="gris texte-13" style={{ margin: '0 0 8px' }}>Analyse du {jour(X.qualite.at)} · {X.qualite.pages} pages FR et EN</p>
                <ul className="lo-docs">
                  <li><span className="a-faire-ic"><Icone nom="globe" taille={18} couleur="#0C2147" /></span><div><strong>Liens brisés</strong><span className="gris texte-13">{X.qualite.liens_detail}</span></div><b>{X.qualite.liens_brises}</b></li>
                  {X.qualite.fautes && <li><span className="a-faire-ic"><Icone nom="pencil" taille={18} couleur="#0C2147" /></span><div><strong>Fautes d’orthographe</strong><span className="gris texte-13">{X.qualite.fautes_detail}</span></div><b>{X.qualite.fautes}</b></li>}
                  {X.qualite.accessibilite !== null && <li><span className="a-faire-ic"><Icone nom="eye" taille={18} couleur="#0C2147" /></span><div><strong>Accessibilité</strong><span className="gris texte-13">{X.qualite.sans_description} pages sans description (SEO)</span></div><b>{X.qualite.accessibilite}/100</b></li>}
                  {X.qualite.erreurs_js !== null && <li><span className="a-faire-ic"><Icone nom="spark" taille={18} couleur="#0C2147" /></span><div><strong>Erreurs JavaScript</strong><span className="gris texte-13">Aucun contenu mixte</span></div><b>{X.qualite.erreurs_js}</b></li>}
                  {X.qualite.certificat_fin && <li><span className="a-faire-ic"><Icone nom="lock" taille={18} couleur="#0C2147" /></span><div><strong>Certificat valide jusqu’au {jour(X.qualite.certificat_fin)}</strong><span className="gris texte-13">Renouvellement automatique</span></div></li>}
                </ul></> : <><h2 className="titre-carte">Qualité du site</h2><p className="gris texte-13">Pas encore analysée : liens brisés, fautes et accessibilité s’afficheront ici.</p></>}
            </section>
            <section className="carte-l18" aria-label="Rapport du lundi"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Rapport du lundi</h2><p className="gris texte-13" style={{ margin: "0 0 12px" }}>Gabarit EQP-10 prêt · envoi du lundi 7 h pas encore planifié</p>
              <p className="ligne-ic" style={{ gap: 16, flexWrap: 'wrap' }}>{X.rapport_destinataires.map((r) => <span key={r.nom} className="ligne-ic texte-13"><span className="ini" style={{ width: 28, height: 28, fontSize: 10 }}>{r.ini}</span>{r.nom}</span>)}</p></section>
          </div>
        </div>
      </>}
    </CadreEspace>
  );
}
