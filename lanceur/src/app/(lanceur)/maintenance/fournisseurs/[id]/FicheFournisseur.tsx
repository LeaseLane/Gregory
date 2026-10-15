'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { Courbe } from '@/composants/Graphes';
import type { Carte } from '../../bons/Bons';
import { ETAPES } from '../../onglets';
import { FournisseurTiroir, type FournEdit } from '../FournisseurTiroir';
import { etatAssurance } from '../Fournisseurs';

/* e35 · Fiche fournisseur : qui il est, ce qu'il a fait pour nous en 12 mois, ses documents vérifiés, ce qu'en disent les locataires.
   Travaux par mois = micro-colonnes; délai de réponse = micro-courbe; note = jauge sur 5. Une assurance échue avec des travaux prévus est en rouge. */
export type DonneesFournisseur = FournEdit & { etat_assurance: string; verification: string | null; verifie_le: string | null; verifie_par: string | null; motif_refus: string | null; portail: boolean;
  indicateurs: { travaux_12: number; urgences_12: number; serie: number[]; reponse: number | null; reponse_serie: (number | null)[]; cout_moyen: number | null; ecart_catalogue: number | null; note: number | null; avis: number; avis_trimestre: number };
  travaux: (Carte & { reponse: number | null; evaluation: { etoiles: number; par: string } | null })[]; total_12: number;
  documents: { id: string; titre: string; type: string | null; le: string; valide: string | null }[]; evaluations: { etoiles: number; commentaire: string; le: string; par: string; logement: string | null }[]; peut_ecrire: boolean };
const argent = (n: number) => `${Math.round(n).toLocaleString('fr-CA').replace(/[  ]/g, ' ')} $`;
const dl = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

export function FicheFournisseur({ donnees: D, erreurLecture }: { donnees: DonneesFournisseur | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [refus, setRefus] = useState<string | null>(null);
  if (!D) return <><Link className="lien po-retour" href="/maintenance/fournisseurs"><Icone nom="arrow" taille={14} couleur="#2E5788" />Fournisseurs</Link><div className="bandeau erreur" role="alert">{bandeau}</div></>;
  const I = D.indicateurs, maxS = Math.max(1, ...I.serie), [ic, lib, cl] = etatAssurance({ etat_assurance: D.etat_assurance, assurance: D.assurance, prochain: D.travaux.find((t) => t.rendez_vous && new Date(t.rendez_vous) > new Date())?.rendez_vous ?? null });
  const sp = D.specialites.filter(Boolean) as string[];
  async function verifier(statut: 'verified' | 'rejected') {
    setBandeau(null); const { error } = await supabaseNavigateur().rpc('lanceur_fournisseur_verifier', { p: { id: D!.id, statut, motif: refus } });
    if (error) return setBandeau(error.message); setRefus(null); setOk(statut === 'verified' ? 'Fournisseur vérifié.' : 'Fournisseur refusé.'); router.refresh();
  }
  return (
    <>
      <Link className="lien po-retour" href="/maintenance/fournisseurs"><Icone nom="arrow" taille={14} couleur="#2E5788" />Fournisseurs</Link>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <div className="po-colonne">
          <section className="carte-l18 e2 tete-action" aria-label="Fournisseur" style={{ alignItems: 'flex-start' }}>
            <div><p className="surtitre" style={{ margin: 0 }}>{D.verification === 'verified' ? 'Fournisseur vérifié' : D.verification === 'rejected' ? 'Fournisseur refusé' : 'Fournisseur à vérifier'}{sp.length ? ` · ${sp.join(', ').toLowerCase()}` : ''}{D.actif ? '' : ' · désactivé'}</p>
              <h2 className="releve-titre" style={{ margin: '4px 0' }}>{D.nom}</h2>
              <p className="gris" style={{ margin: 0 }}>{[D.rbq && `RBQ ${D.rbq}`, D.zones?.length && D.zones.join(' et '), [D.contact, D.telephone].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</p></div>
            <div className="fiche-actions">{D.peut_ecrire && <FournisseurTiroir fournisseur={D} />}
              {D.telephone && <a className="haut-ibtn" href={`tel:${D.telephone}`} aria-label={`Appeler ${D.contact}`}><Icone nom="phone" taille={18} couleur="#0C2147" /></a>}
              {D.peut_ecrire && D.actif && <Link className="bouton bouton-principal" href={`/maintenance/bons?nouveau=1&fournisseur=${D.id}`}><Icone nom="send" taille={16} couleur="#fff" />Demander une soumission</Link>}</div>
          </section>
          <div className="kpis kpis-serres">
            <div className="kpi"><span>Travaux en 12 mois</span><b>{I.travaux_12}</b><span>{I.urgences_12} urgence{I.urgences_12 > 1 ? 's' : ''} · {I.travaux_12 - I.urgences_12} planifiés</span>
              <span className="mini-barres">{I.serie.map((n, k) => <i key={k} className={k === I.serie.length - 1 ? 'accent' : ''} style={{ height: `${Math.max(6, (100 * n) / maxS)}%` }} />)}</span></div>
            <div className="kpi"><span>Première réponse</span><b>{I.reponse != null ? `${String(I.reponse).replace('.', ',')} h` : '—'}</b><span>médiane · 90 jours</span><Courbe valeurs={I.reponse_serie.filter((x): x is number => x != null).map(Number)} largeur={120} /></div>
            <div className="kpi"><span>Coût moyen</span><b>{I.cout_moyen != null ? argent(I.cout_moyen) : '—'}</b><span>{I.ecart_catalogue != null ? `${I.ecart_catalogue < 0 ? 'sous' : 'au-dessus du'} catalogue de ${Math.abs(I.ecart_catalogue)} %` : 'sans référence du catalogue'}</span></div>
            <div className="kpi"><span>Note des locataires</span><b>{I.note != null ? String(I.note).replace('.', ',') : '—'}</b><span>{I.avis} avis · {I.avis_trimestre} ce trimestre</span>{I.note != null && <span className="jauge"><i style={{ width: `${(100 * I.note) / 5}%` }} /></span>}</div>
          </div>
          <section className="carte-l18" aria-label="Historique des travaux"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Historique des travaux</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{I.travaux_12} travaux en 12 mois · {argent(D.total_12)}</p>
            <table className="tableau tab-fixe"><colgroup><col style={{ width: '12%' }} /><col style={{ width: '40%' }} /><col style={{ width: '12%' }} /><col style={{ width: '10%' }} /><col /></colgroup>
              <thead><tr><th>Date</th><th>Travaux</th><th className="droite">Coût</th><th className="droite">Réponse</th><th>Évaluation</th></tr></thead>
              <tbody>{D.travaux.map((t) => <tr key={t.id} className="ligne-lien" onClick={() => router.push(`/maintenance/bons/${t.id}`)}><td className="gris">{new Date(t.rendez_vous ?? t.cree).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}</td>
                <td><Link className="fort" href={`/maintenance/bons/${t.id}`} onClick={(e) => e.stopPropagation()}>{t.titre}</Link><span className="sous gris">{t.logement}</span></td>
                <td className="droite fort">{t.cout != null ? argent(t.cout) : '—'}</td><td className="droite">{t.reponse != null ? `${String(t.reponse).replace('.', ',')} h` : '—'}</td>
                <td>{t.evaluation ? <span className="ligne-ic"><Icone nom="star" taille={14} couleur="#0C2147" /><b>{t.evaluation.etoiles} sur 5</b><span className="gris texte-13">· {t.evaluation.par}</span></span>
                  : <span className="puce neutral">{ETAPES[t.etape]}</span>}</td></tr>)}
                {!D.travaux.length && <tr><td colSpan={5} className="gris">Aucun travail.</td></tr>}</tbody></table></section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18" aria-label="Documents"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Documents</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{D.verifie_le ? `Vérifiés le ${dl(D.verifie_le)}${D.verifie_par ? ` par ${D.verifie_par}` : ''}` : D.motif_refus ? `Refusé : ${D.motif_refus}` : 'Pas encore vérifiés'}</p>
            <ul className="lo-docs">
              <li><span className="a-faire-ic"><Icone nom="shield" taille={18} couleur="#0C2147" /></span><div><strong>Attestation d’assurance</strong><span className={`texte-13 ${cl || 'gris'}`}>{D.assurance ? `Au ${dl(D.assurance)}` : 'À recevoir'}</span></div><span className="ligne-ic">{ic}</span></li>
              <li><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>{D.rbq ? `Licence RBQ ${D.rbq}` : 'Licence RBQ'}</strong>
                <span className="gris texte-13">{D.rbq ? (D.rbq_expiration ? `Valide jusqu’au ${dl(D.rbq_expiration)}` : 'Échéance à saisir') : D.rbq_requise ? 'Requise · manquante' : 'Non requise pour ses travaux'}</span></div></li>
              {D.documents.map((d) => <li key={d.id}><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>{d.titre}</strong><span className="gris texte-13">Ajouté le {dl(d.le)}</span></div>
                {d.valide === 'valide' && <Icone nom="check" taille={16} couleur="#12694F" />}</li>)}</ul>
            {D.peut_ecrire && <div className="fiche-actions" style={{ marginTop: 12 }}>{refus == null ? <>
              {D.verification !== 'verified' && <button className="bouton bouton-principal" onClick={() => verifier('verified')}><Icone nom="check" taille={16} couleur="#fff" />Marquer vérifié</button>}
              {D.verification !== 'rejected' && <button className="bouton bouton-contour" onClick={() => setRefus('')}>Refuser</button>}</>
              : <><input className="e70-raison" value={refus} onChange={(e) => setRefus(e.target.value)} placeholder="Motif du refus" aria-label="Motif du refus" />
                <button className="bouton bouton-principal" disabled={refus.trim().length < 5} onClick={() => verifier('rejected')}>Refuser</button><button className="lien" onClick={() => setRefus(null)}>Annuler</button></>}</div>}
          </section>
          <section className="carte-l18" aria-label="Évaluations des locataires"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Évaluations des locataires</h2>
            <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{I.note != null ? `${String(I.note).replace('.', ',')} sur 5 · ${I.avis} avis · les plus récents` : 'Aucun avis'}</p>
            {D.evaluations.map((e, i) => <blockquote key={i} className="citation"><p>« {e.commentaire} »</p><span className="ligne-ic gris texte-12"><Icone nom="star" taille={12} couleur="#0C2147" />{e.etoiles} · {e.par}{e.logement ? ` · ${e.logement}` : ''}</span></blockquote>)}
            {!D.evaluations.length && <p className="gris texte-13">Aucun commentaire écrit.</p>}</section>
        </div>
      </div>
    </>
  );
}
