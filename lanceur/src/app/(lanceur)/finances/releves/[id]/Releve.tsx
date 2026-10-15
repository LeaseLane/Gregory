'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* e45 · Relevé mensuel tel que reçu par le propriétaire. Adapté au 13 oct. : les loyers sont payés chez lui; le total du relevé est la
   facture d'honoraires (aucun « versé »). En-tête (état d'envoi), revenus et dépenses, honoraires des 6 derniers mois, factures du mois. */
type Ligne = { libelle: string; categorie: string; le: string; montant: number; immeuble: string | null };
type Facture = { honoraires: number; coordination: number; sous_total: number; tps: number; tvq: number; total: number; numero?: string | null };
export type DonneesReleve = { id: string | null; proprietaire: string; logements: number; immeubles: string | null; mois: string; emis: boolean; numero: string | null; emis_le: string | null;
  envoi: { releve: { statut: string; le: string } | null; facture: { statut: string; le: string } | null }; lignes: Ligne[]; facture: Facture; historique: { mois: string; honoraires: number }[];
  parametres: { gestion_pct: number; travaux_seuil: number; travaux_pct: number } | null };
const argent = (n: number, c = false) => `${n.toLocaleString('fr-CA', { minimumFractionDigits: c ? 2 : 0, maximumFractionDigits: c ? 2 : 0 }).replace(/[  ]/g, ' ')} $`;
const jour = (iso: string) => { const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso); return `${d.getDate() === 1 ? '1er' : d.getDate()} ${d.toLocaleDateString('fr-CA', { month: 'short' })}`; };
const moisLib = (iso: string, an = true) => new Date(`${iso.slice(0, 7)}-15T12:00:00`).toLocaleDateString('fr-CA', an ? { month: 'long', year: 'numeric' } : { month: 'short' });

export function Releve({ donnees: D, erreurLecture }: { donnees: DonneesReleve | null; erreurLecture: string | null }) {
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const loyers = D.lignes.filter((l) => l.categorie.startsWith('Loyer')), travaux = D.lignes.filter((l) => l.categorie === 'Entretien');
  const sommeLoyers = loyers.reduce((s, l) => s + l.montant, 0), sommeTravaux = -travaux.reduce((s, l) => s + l.montant, 0), F = D.facture, P = D.parametres;
  const max = Math.max(1, ...D.historique.map((h) => h.honoraires)), dernier = D.historique[D.historique.length - 1];
  async function renvoyer() {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_renvoyer_releve', { p_id: D!.id });
    setEnvoi(false); if (error) return setBandeau(error.message); setOk('Relevé et facture renvoyés au propriétaire.');
  }
  return (
    <>
      <Link className="lien po-retour" href={`/finances/releves?m=${D.mois.slice(0, 7)}`}><Icone nom="arrow" taille={14} couleur="#2E5788" />Relevés de {moisLib(D.mois)}</Link>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="po-fiche inverse">
        <div className="po-colonne">
          <section className="carte-l18 e2 releve-tete" aria-label="Relevé">
            <p className="surtitre ligne-ic">Relevé mensuel · {moisLib(D.mois)} {D.emis ? <span className="puce final">{D.envoi.releve?.statut === 'sent' ? `Envoyé le ${jour(D.envoi.releve.le)}` : `Émis le ${jour(D.emis_le!)}`}</span> : <span className="puce neutral">Aperçu · non émis</span>}</p>
            <div className="tete-action"><div><h2 className="releve-titre">{D.immeubles?.split(' · ')[0] ?? '—'} · {D.proprietaire}</h2>
              <p className="gris texte-13" style={{ margin: 0 }}>{D.logements} logement{D.logements > 1 ? 's' : ''} · du 1er au {new Date(new Date(`${D.mois.slice(0, 7)}-01T12:00:00`).getFullYear(), new Date(`${D.mois.slice(0, 7)}-01T12:00:00`).getMonth() + 1, 0).getDate()} {moisLib(D.mois, false)}{D.numero ? ` · ${D.numero}` : ''}</p></div>
              <div className="droite"><b className="releve-total">{argent(F.total, true)}</b><p className="gris texte-13" style={{ margin: 0 }}>facture d’honoraires {F.numero ?? ''} (TTC)</p></div></div>
            <div className="a-faire-actions" style={{ justifyContent: 'flex-end' }}>
              {D.emis && <button className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi} onClick={renvoyer}><Icone nom="send" taille={16} couleur="#0C2147" />Renvoyer au propriétaire</button>}
              <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} onClick={() => window.print()}><Icone nom="download" taille={16} couleur="#fff" />Télécharger le PDF</button></div>
          </section>
          <section className="carte-l18" aria-label="Revenus et dépenses"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Revenus et dépenses</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{moisLib(D.mois)}</p>
            <table className="tableau"><thead><tr><th>Poste</th><th>Détail</th><th className="droite">Montant</th></tr></thead><tbody>
              <tr><td className="fort">Loyers payés chez vous</td><td>{loyers.length ? (loyers.length === 1 ? loyers[0].immeuble?.replace(/, Québec$/, '') : `${loyers.length} immeubles`) : 'Aucun loyer suivi'} · payés directement au propriétaire</td><td className="droite fort">{argent(sommeLoyers, true)}</td></tr>
              <tr><td className="fort">Entretien</td><td>{travaux.length ? `${travaux.length} facture${travaux.length > 1 ? 's' : ''} · taxes incluses` : 'Aucune facture'}</td><td className="droite">{sommeTravaux ? `−${argent(sommeTravaux, true)}` : '—'}</td></tr>
              <tr><td className="fort">Honoraires de gestion</td><td>{P?.gestion_pct ?? 6} % des loyers payés</td><td className="droite">{argent(F.honoraires, true)}</td></tr>
              <tr><td className="fort">Honoraires sur travaux</td><td>{P ? `${P.travaux_pct} % des factures de plus de ${argent(P.travaux_seuil)}, avant taxes` : '—'}</td><td className="droite">{argent(F.coordination, true)}</td></tr>
              <tr><td className="fort">TPS et TVQ</td><td>Sur les honoraires · 5 % et 9,975 %</td><td className="droite">{argent(F.tps + F.tvq, true)}</td></tr>
              <tr className="releve-somme"><td className="fort">Facture d’honoraires</td><td>{F.numero ?? 'Numérotée à l’émission'} · le 5 du mois suivant</td><td className="droite fort">{argent(F.total, true)}</td></tr></tbody></table>
          </section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18" aria-label="Honoraires des 6 derniers mois"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Honoraires de {moisLib(D.mois, false)} : {argent(dernier?.honoraires ?? 0)}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>Honoraires avant taxes · 6 derniers mois</p>
            <div className="releve-barres" role="img" aria-label="Honoraires des 6 derniers mois">{D.historique.map((h, i) => <div key={h.mois}><i className={i === D.historique.length - 1 ? 'accent' : ''} style={{ height: `${Math.max(2, (100 * h.honoraires) / max)}%` }} title={argent(h.honoraires)} />
              <small>{moisLib(`${h.mois}-01`, false)}</small></div>)}</div>
            <p className="gris texte-12">Moyenne de 6 mois : {argent(D.historique.reduce((s, h) => s + h.honoraires, 0) / Math.max(1, D.historique.length))}</p></section>
          <section className="carte-l18" aria-label="Factures du mois"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Factures de travaux</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>{travaux.length} pièce{travaux.length > 1 ? 's' : ''} du mois</p>
            <ul className="lo-docs">{travaux.map((t, i) => <li key={i}><span className="a-faire-ic"><Icone nom="receipt" taille={18} couleur="#0C2147" /></span><div><strong>{t.libelle}</strong><span className="gris texte-13">{jour(t.le)} · {argent(-t.montant, true)} TTC</span></div></li>)}
              {!travaux.length && <li className="gris texte-13">Aucune facture de travaux ce mois-ci.</li>}</ul></section>
        </div>
      </div>
    </>
  );
}
