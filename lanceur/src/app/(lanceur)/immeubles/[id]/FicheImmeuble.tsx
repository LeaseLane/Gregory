'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { Courbe } from '@/composants/Graphes';
import { argent, dateCourte } from '../onglets';
import { LogementTiroir, type LogementEdit } from '../LogementTiroir';

/* e27 · Fiche immeuble : identité, chiffres clés, logements en deux demi-tableaux, historique d'entretien (en cours d'abord), documents, revenu des loyers sur 12 mois.
   Le retard se dit en mots; le rouge reste à l'urgence. */
type Log = { id: string; numero: string; type: string | null; loyer: number | null; superficie: number | null; etage: number | null; statut: string; etat: string; locataire: string | null; tenant_id: string | null; fin: string | null; depart: boolean; retard: number | null; photos: number };
export type DonneesImmeuble = { id: string; adresse: string; quartier: string | null; annee: number | null; renovation: number | null; etages: number | null; chauffage: string | null; stationnement: string | null;
  depuis: string; nb_logements: number; proprietaire: { id: string; nom: string } | null; responsable: { nom: string; initiales: string } | null; logements: Log[];
  entretien: { total: number; annee: number; en_cours: number; derniers: { id: string; titre: string; fournisseur: string | null; statut: string; le: string; montant: number | null; soumissions: number; accord: boolean }[] };
  documents: { id: string; titre: string; type: string | null; le: string; valide: string | null }[]; revenu: { mois: string; paye: number; du: number }[] };
const moisLong = (m: string) => new Date(`${m}-15T12:00:00`).toLocaleDateString('fr-CA', { month: 'long' });

export function FicheImmeuble({ donnees: D, erreurLecture }: { donnees: DonneesImmeuble | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [edit, setEdit] = useState(false), [envoi, setEnvoi] = useState(false), [logement, setLogement] = useState<LogementEdit | false>(false);
  const [f, setF] = useState({ adresse: D?.adresse ?? '', quartier: D?.quartier ?? '', annee: D?.annee?.toString() ?? '', etages: D?.etages?.toString() ?? '', chauffage: D?.chauffage ?? '', stationnement: D?.stationnement ?? '' });
  if (!D) return <><Link className="lien po-retour" href="/immeubles"><Icone nom="arrow" taille={14} couleur="#2E5788" />Immeubles</Link><div className="bandeau erreur" role="alert">{bandeau}</div></>;
  const L = D.logements, occ = L.filter((u) => u.etat !== 'vacant').length, loyers = L.filter((u) => u.locataire).reduce((s, u) => s + Number(u.loyer ?? 0), 0);
  const dernier = D.revenu[D.revenu.length - 1], total12 = D.revenu.reduce((s, r) => s + Number(r.paye), 0);
  const aLouer = L.filter((u) => u.etat !== 'loue'), moitie = Math.ceil(L.length / 2);
  async function enregistrer() {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_immeuble_maj', { p: { id: D!.id, ...f } });
    setEnvoi(false); if (error) return setBandeau(error.message); setEdit(false); setOk('Fiche mise à jour.'); router.refresh();
  }
  const statut = (u: Log) => u.retard ? <span className="puce todo">Retard · {u.retard} j</span> : u.etat === 'vacant' ? <span className="puce action">À louer</span> : u.etat === 'preavis' ? <span className="puce">À louer</span> : <span className="puce neutral">Loué</span>;
  const demi = (part: Log[]) => <table className="tableau tab-fixe"><colgroup><col style={{ width: '30%' }} /><col style={{ width: '36%' }} /><col style={{ width: '16%' }} /><col /></colgroup>
    <thead><tr><th>Logement</th><th>Locataire</th><th className="droite">Loyer</th><th>Statut</th></tr></thead>
    <tbody>{part.map((u) => <tr key={u.id} className="ligne-lien" onClick={() => setLogement(u)}><td><span className="no-logement">{u.numero}</span>{u.type ?? '—'}</td>
      <td>{u.tenant_id ? <Link className="fort" href={`/clients/locataires/${u.tenant_id}`} onClick={(e) => e.stopPropagation()}>{u.locataire}</Link> : <span className="gris">Libre</span>}
        <span className="sous gris">{u.depart && u.fin ? `Part le ${dateCourte(u.fin)}` : u.fin ? `Fin : ${dateCourte(u.fin, true)}` : '—'}</span></td>
      <td className="droite fort">{argent(u.loyer)}</td><td>{statut(u)}</td></tr>)}</tbody></table>;
  const champ = (k: keyof typeof f, l: string, num = false) => <div><label className="fenetre-lib" htmlFor={`fi-${k}`}>{l}</label><input id={`fi-${k}`} className="e70-raison" inputMode={num ? 'numeric' : undefined} value={f[k]} onChange={(e) => setF({ ...f, [k]: num ? e.target.value.replace(/\D/g, '') : e.target.value })} /></div>;
  return (
    <>
      <Link className="lien po-retour" href="/immeubles"><Icone nom="arrow" taille={14} couleur="#2E5788" />Immeubles</Link>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <div className="po-colonne">
          <section className="carte-l18 e2 imm-tete" aria-label="Immeuble">
            <div className="imm-photo"><Icone nom="building" taille={48} couleur="#2E5788" /><span className="medias"><Icone nom="camera" taille={16} couleur="#0C2147" />{L.reduce((s, u) => s + u.photos, 0)} photos</span></div>
            <div><div className="tete-action"><p className="surtitre" style={{ margin: 0 }}>Immeuble géré depuis {new Date(D.depuis).getFullYear()}</p>
              <button className="haut-ibtn" onClick={() => setEdit(true)} aria-label="Modifier la fiche"><Icone nom="pencil" taille={18} couleur="#0C2147" /></button></div>
              <h2 className="releve-titre" style={{ margin: '4px 0' }}>{D.adresse}</h2>
              <p className="gris texte-13" style={{ margin: 0 }}>{[D.quartier, `${L.length} logement${L.length > 1 ? 's' : ''}`, D.annee && `construit en ${D.annee}`].filter(Boolean).join(' · ')}
                {D.proprietaire && <> · propriétaire <Link href={`/clients/proprietaires/${D.proprietaire.id}`}>{D.proprietaire.nom}</Link></>}</p>
              <div className="imm-chiffres">
                <div><p className="surtitre">Occupation</p><span className="ligne-ic"><b>{L.length ? Math.round((100 * occ) / L.length) : 0} %</b><span className="jauge" style={{ width: 72, flex: 'none' }}><i style={{ width: `${L.length ? (100 * occ) / L.length : 0}%` }} /></span></span></div>
                <div><p className="surtitre">Loyers</p><b>{argent(loyers)}</b> <span className="gris texte-13">par mois</span></div>
                <div><p className="surtitre">Responsable</p>{D.responsable ? <span className="ligne-ic"><span className="ini" style={{ width: 28, height: 28, fontSize: 11 }}>{D.responsable.initiales}</span><b style={{ fontSize: 14 }}>{D.responsable.nom}</b></span> : <span className="gris">—</span>}</div>
              </div></div>
          </section>
          <section className="carte-l18" aria-label="Logements">
            <div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Logements</h2>
              <p className="gris texte-13" style={{ margin: 0 }}>{occ} loué{occ > 1 ? 's' : ''}{aLouer.length ? ` · ${aLouer.length} à louer` : ''} · {argent(loyers)} par mois</p></div>
              <span className="ligne-ic"><button className="lien" onClick={() => setLogement({ numero: '', type: null, loyer: null, superficie: null, etage: null, statut: 'occupied' })}>Ajouter un logement</button>
                <Link className="lien" href={`/immeubles/logements?immeuble=${D.id}`}>Voir dans Logements</Link></span></div>
            {L.length ? <div className="demi-tableaux" style={{ marginTop: 12 }}>{demi(L.slice(0, moitie))}{L.length > 1 && demi(L.slice(moitie))}</div> : <p className="gris">Aucun logement saisi.</p>}
          </section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18" aria-label="Historique d’entretien">
            <div className="tete-action"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Historique d’entretien</h2>{D.entretien.total > 0 && <Link className="lien" href={`/maintenance/bons?immeuble=${D.id}`}>Voir les {D.entretien.total}</Link>}</div>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{D.entretien.total} travaux · {argent(D.entretien.annee)} en {new Date().getFullYear()}{D.entretien.en_cours ? ` · ${D.entretien.en_cours} en cours` : ''}</p>
            <ul className="lo-docs">{D.entretien.derniers.map((w) => { const enCours = ['open', 'assigned', 'in_progress'].includes(w.statut);
              return <li key={w.id}><span className="a-faire-ic"><Icone nom={enCours ? 'layers' : 'wrench'} taille={18} couleur="#0C2147" /></span>
                <div><span className="tete-action"><Link className="fort" href={`/maintenance/bons/${w.id}`}>{w.titre}</Link>{w.montant != null && <b>{argent(w.montant)}</b>}</span>
                  <span className="gris texte-13">{[w.fournisseur, w.accord ? 'accord attendu' : enCours && w.soumissions ? `soumissions · ${w.soumissions}` : enCours ? 'en cours' : dateCourte(w.le)].filter(Boolean).join(' · ')}</span></div></li>; })}
              {!D.entretien.derniers.length && <li className="gris texte-13">Aucun travail.</li>}</ul>
          </section>
          <section className="carte-l18" aria-label="Documents">
            <p className="ligne-ic" style={{ margin: '0 0 8px' }}><strong>Documents</strong><span className="gris texte-13">{D.documents.length} document{D.documents.length > 1 ? 's' : ''}</span></p>
            <ul className="lo-docs">{D.documents.slice(0, 3).map((d) => <li key={d.id}><span className="a-faire-ic"><Icone nom={d.type === 'assurance' ? 'shield' : 'file'} taille={18} couleur="#0C2147" /></span>
              <div><strong>{d.titre}</strong><span className="gris texte-13">Ajouté le {dateCourte(d.le, true)}</span></div>{d.valide === 'valide' && <Icone nom="check" taille={18} couleur="#12694F" />}</li>)}
              {!D.documents.length && <li className="gris texte-13">Aucun document. Le propriétaire les dépose dans son portail.</li>}</ul>
          </section>
          <section className="kpi" aria-label="Revenu des loyers"><span>Revenu des loyers · 12 mois</span><b>{argent(total12)}</b>
            <span>{dernier ? `${moisLong(dernier.mois).replace(/^./, (c) => c.toUpperCase())} : ${argent(dernier.paye)}${Number(dernier.du) > 0 ? ` · ${argent(dernier.du)} en retard` : ''}` : '—'}</span>
            <Courbe valeurs={D.revenu.map((r) => Number(r.paye))} largeur={300} hauteur={48} /></section>
        </div>
      </div>
      {logement && <LogementTiroir buildingId={D.id} logement={logement} fermer={() => setLogement(false)} />}
      {edit && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEdit(false)}>
        <form className="tiroir" role="dialog" aria-modal="true" aria-labelledby="fi-t" onSubmit={(e) => { e.preventDefault(); enregistrer(); }}>
          <header className="tiroir-tete"><h2 id="fi-t">Modifier l’immeuble</h2><button type="button" className="haut-ibtn" onClick={() => setEdit(false)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">{champ('adresse', 'Adresse')}<div className="po-deux" style={{ marginTop: 12 }}>{champ('quartier', 'Quartier')}{champ('annee', 'Année de construction', true)}{champ('etages', 'Étages', true)}{champ('chauffage', 'Chauffage')}</div>
            <div style={{ marginTop: 12 }}>{champ('stationnement', 'Stationnement')}</div></div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setEdit(false)}>Annuler</button><button className="bouton bouton-principal" disabled={envoi || f.adresse.trim().length < 5}>Enregistrer</button></footer>
        </form></div>}
    </>
  );
}
