'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';

/* e22 · Fiche locataire : dossier de recouvrement ouvert en tête; paiements des 12 derniers mois (un carré par mois); demandes d'entretien;
   bail; documents et avis; consentements LCAP. Chaque ouverture est inscrite au journal (lecture sensible). */
export type DonneesLocataire = { id: string; nom: string; courriel: string | null; telephone: string | null; langue: string | null; anonymise: boolean; portail: boolean; depuis: string | null;
  dossier: { id: string; numero: string; etape: string } | null;
  bail: { id: string; logement: string; type: string | null; secteur: string | null; loyer: number; debut: string; fin: string | null; mode: string; fenetre: string | null } | null;
  paiements: { mois: string; retard: number | null; paye: boolean | null }[]; impaye: { montant: number; jours: number } | null;
  demandes: { id: string; numero: string; titre: string; statut: string; recue: string; rdv: { qui: string | null; quand: string | null; fait: string | null } | null }[];
  documents: { id: string; titre: string; categorie: string | null; le: string }[]; avis: { id: string; type: string; statut: string; le: string; dossier: string }[];
  consentements: { canal: string; but: string; base: string; le: string; retire: string | null }[] };
const argent = (n: number) => `${n.toLocaleString('fr-CA', { maximumFractionDigits: 2 }).replace(/[  ]/g, ' ')} $`;
const date = (iso: string, an = true) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('fr-CA', an ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
const ETAPE: Record<string, string> = { ouvert: 'Recouvrement en cours', mise_en_demeure: 'Mise en demeure envoyée', tal: 'Au TAL' };
const STATUT: Record<string, string> = { new: 'Reçue', open: 'Ouverte', assigned: 'Assignée', in_progress: 'En cours', scheduled: 'Planifiée', completed: 'Terminée', closed: 'Fermée' };

export function FicheLocataire({ donnees: D, erreurLecture }: { donnees: DonneesLocataire | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [edit, setEdit] = useState(false), [envoi, setEnvoi] = useState(false);
  const [f, setF] = useState({ nom: D?.nom ?? '', courriel: D?.courriel ?? '', telephone: D?.telephone ?? '', langue: D?.langue ?? 'fr' });
  if (!D) return <><Link className="lien po-retour" href="/clients/locataires"><Icone nom="arrow" taille={14} couleur="#2E5788" />Locataires</Link><div className="bandeau erreur" role="alert">{bandeau}</div></>;
  async function enregistrer() {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_locataire_maj', { p: { id: D!.id, ...f } });
    setEnvoi(false); if (error) return setBandeau(error.message); setEdit(false); setOk('Fiche mise à jour.'); router.refresh();
  }
  async function inviter() {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_inviter_portail', { p: { tenant_id: D!.id } });
    setEnvoi(false); if (error) return setBandeau(error.message); setOk('Invitation au portail envoyée.');
  }
  const B = D.bail, champ = (k: keyof typeof f, l: string, type = 'text') => <div><label className="fenetre-lib" htmlFor={`fl-${k}`}>{l}</label><input id={`fl-${k}`} className="e70-raison" type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>;
  return (
    <>
      <Link className="lien po-retour" href="/clients/locataires"><Icone nom="arrow" taille={14} couleur="#2E5788" />Locataires</Link>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <section className="carte-l18 fiche-tete" aria-label="Locataire">
        <span className="ini" style={{ width: 56, height: 56, fontSize: 18 }}>{initiales(D.nom)}</span>
        <div><div className="ligne-ic"><h2 className="releve-titre" style={{ margin: 0 }}>{D.nom}</h2>{D.dossier && <span className="puce todo">{ETAPE[D.dossier.etape] ?? 'Dossier ouvert'}</span>}{D.anonymise && <span className="puce neutral">Anonymisé</span>}</div>
          <p className="gris texte-13" style={{ margin: '4px 0 0' }}>{[B?.logement, D.depuis && `locataire depuis ${new Date(`${D.depuis}T12:00:00`).getFullYear()}`, D.courriel, D.telephone].filter(Boolean).join(' · ')}</p>
          <p className="ligne-ic texte-13" style={{ margin: '6px 0 0' }}><i className={`point-etat ${D.portail ? 'ok' : 'off'}`} />{D.portail ? 'Portail actif' : 'Sans portail'}<span className="gris">· consultation inscrite au journal</span></p></div>
        <div className="fiche-actions">
          {!D.portail && !D.anonymise && D.courriel && <button className="bouton bouton-contour" disabled={envoi} onClick={inviter}><Icone nom="send" taille={16} couleur="#0C2147" />Inviter au portail</button>}
          {!D.anonymise && <button className="bouton bouton-contour" onClick={() => setEdit(true)}><Icone nom="pencil" taille={16} couleur="#0C2147" />Modifier</button>}
          {D.dossier && <Link className="bouton bouton-contour" href={`/juridique?d=${D.dossier.id}`}><Icone nom="flag" taille={16} couleur="#0C2147" />Ouvrir le dossier {D.dossier.numero}</Link>}
          {D.telephone && <a className="bouton bouton-principal" href={`tel:${D.telephone}`}><Icone nom="phone" taille={16} couleur="#fff" />Appeler</a>}</div>
      </section>
      <div className="grille-2-1" style={{ marginTop: 24 }}>
        <div className="po-colonne">
          <section className="carte-l18" aria-label="Paiements"><div className="tete-action"><div><h2 className="titre-carte" style={{ marginBottom: 2 }}>Paiements · 12 derniers mois</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>{B?.mode ?? '—'} · payés chez le propriétaire</p></div>
            {D.impaye && <div className="droite"><b style={{ fontSize: 22, color: '#9B2E28' }}>{argent(D.impaye.montant)}</b><p className="gris texte-13" style={{ margin: 0 }}>impayé depuis {D.impaye.jours} j</p></div>}</div>
            <div className="mois-carres">{D.paiements.map((m) => { const c = m.paye === null ? 'vide' : !m.paye ? 'refus' : (m.retard ?? 0) > 5 ? 'retard' : 'ok';
              return <div key={m.mois} title={m.paye === null ? 'Aucun loyer' : !m.paye ? `Impayé · ${m.retard} j` : m.retard ? `Payé avec ${m.retard} j de retard` : 'Payé à temps'}><i className={c} /><small>{new Date(`${m.mois}-15T12:00:00`).toLocaleDateString('fr-CA', { month: 'narrow' })}</small></div>; })}</div>
            <ul className="legende"><li><i className="ok" />À temps</li><li><i className="retard" />En retard</li><li><i className="refus" />Impayé</li></ul></section>
          <section className="carte-l18" aria-label="Demandes d’entretien"><h2 className="titre-carte">Demandes d’entretien</h2>
            <ul className="lo-docs">{D.demandes.map((d) => <li key={d.id}><span className="a-faire-ic"><Icone nom="wrench" taille={18} couleur="#0C2147" /></span>
              <div><span className="tete-action"><strong>{d.titre}</strong><span className="puce neutral">{STATUT[d.statut] ?? d.statut}</span></span>
                <span className="gris texte-13">{d.numero} · reçue le {date(d.recue, false)}{d.rdv?.qui ? ` · ${d.rdv.qui}` : ''}{d.rdv?.fait ? ` · fait le ${date(d.rdv.fait, false)}` : d.rdv?.quand ? ` · rendez-vous le ${date(d.rdv.quand, false)}` : ''}</span></div></li>)}
              {!D.demandes.length && <li className="gris texte-13">Aucune demande dans les 12 derniers mois.</li>}</ul></section>
        </div>
        <div className="po-colonne">
          <section className="carte-l18 e2" aria-label="Bail"><h2 className="titre-carte">Bail</h2>
            {B ? <dl className="fiche-dl"><div><dt>Logement</dt><dd>{B.logement}{B.type ? ` · ${B.type}` : ''}</dd></div><div><dt>Loyer</dt><dd>{argent(B.loyer)} / mois</dd></div>
              <div><dt>Période</dt><dd>{date(B.debut)} au {B.fin ? date(B.fin) : 'indéterminée'}</dd></div><div><dt>Paiement</dt><dd>{B.mode}</dd></div>
              {B.fenetre && <div><dt>Avis de modification</dt><dd>{(([a, b]) => b ? `du ${date(a)} au ${date(b)}` : B.fenetre)(B.fenetre.replace(/[\[\]()]/g, '').split(','))}</dd></div>}</dl> : <p className="gris" style={{ margin: 0 }}>Aucun bail actif.</p>}</section>
          <section className="carte-l18" aria-label="Documents"><h2 className="titre-carte">Documents</h2>
            <ul className="lo-docs">{D.avis.map((a) => <li key={a.id}><span className="a-faire-ic"><Icone nom="alert" taille={18} couleur="#9B2E28" /></span><div><strong>{a.type}</strong><span className="gris texte-13">{a.dossier} · {date(a.le, false)}</span></div></li>)}
              {D.documents.map((d) => <li key={d.id}><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>{d.titre}</strong><span className="gris texte-13">{d.categorie ? `${d.categorie} · ` : ''}{date(d.le, false)}</span></div></li>)}
              {!D.documents.length && !D.avis.length && <li className="gris texte-13">Aucun document.</li>}</ul></section>
          <section className="carte-l18" aria-label="Consentements"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Consentements LCAP</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Les messages liés au bail partent sans consentement.</p>
            <ul className="lo-docs">{D.consentements.map((c, k) => <li key={k}><span className="a-faire-ic"><Icone nom={c.canal === 'sms' ? 'message' : 'mail'} taille={18} couleur="#0C2147" /></span>
              <div><strong>{c.canal === 'sms' ? 'SMS' : 'Courriel'} · {c.base === 'express' ? 'exprès' : 'tacite'}</strong><span className="gris texte-13">{c.retire ? `Retiré le ${date(c.retire, false)}` : `Depuis le ${date(c.le)}`}</span></div></li>)}
              {!D.consentements.length && <li className="gris texte-13">Aucun consentement commercial.</li>}</ul></section>
        </div>
      </div>
      {edit && <div className="voile tiroir-voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEdit(false)}>
        <form className="tiroir" role="dialog" aria-modal="true" aria-labelledby="fl-t" onSubmit={(e) => { e.preventDefault(); enregistrer(); }}>
          <header className="tiroir-tete"><h2 id="fl-t">Modifier le locataire</h2><button type="button" className="haut-ibtn" onClick={() => setEdit(false)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="tiroir-corps">{champ('nom', 'Nom')}{champ('courriel', 'Courriel', 'email')}{champ('telephone', 'Téléphone', 'tel')}
            <label className="fenetre-lib" htmlFor="fl-l">Langue</label><select id="fl-l" className="e70-raison" value={f.langue} onChange={(e) => setF({ ...f, langue: e.target.value })}><option value="fr">Français</option><option value="en">English</option></select></div>
          <footer className="tiroir-pied a-faire-actions"><button type="button" className="bouton bouton-contour" onClick={() => setEdit(false)}>Annuler</button><button className="bouton bouton-principal" disabled={envoi || f.nom.trim().length < 2}>Enregistrer</button></footer>
        </form></div>}
    </>
  );
}
