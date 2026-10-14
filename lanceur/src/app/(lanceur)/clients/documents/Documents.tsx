'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';

type Signataire = { ord: number; nom: string; role: string; statut: string; ouvert: string | null; signe: string | null };
type Enveloppe = { id: string; kind: string; titre: string; sous: string | null; statut: string; envoyee: string | null; par: string | null; relances: number; prochaine: string | null;
  simule: boolean; termine: string | null; facture: { statut: string; fournisseur: string; id: string | null } | null; signataires: Signataire[] };
export type DonneesDocs = { enveloppes: Enveloppe[]; recus: { id: string; titre: string; type: string | null; le: string; de: string | null }[]; delais: { kind: string; jours: number }[];
  sans_mandat: { id: string; nom: string }[]; peut_ecrire: boolean };

const TYPES: Record<string, string> = { mandat: 'Mandat de gestion', bail: 'Bail', avenant_cession: 'Avenant', avis_renouvellement: 'Avis de renouvellement', autre: 'Autre' };
const CLASSES: Record<string, string> = { assurance: 'Assurances', bail: 'Baux', facture: 'Dépenses', releve: 'Solvabilité', identite: 'Identité' };
const auj = new Date().toDateString();
const quand = (iso: string) => { const x = new Date(iso); return x.toDateString() === auj ? `auj. ${x.getHours()} h${x.getMinutes() ? String(x.getMinutes()).padStart(2, '0') : ''}` : x.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }); };
const jours = (n: number) => `${String(n).replace('.', ',')} j`;
const signes = (e: Enveloppe) => e.signataires.filter((s) => s.statut === 'signed').length;
function statut(e: Enveloppe) {
  return { draft: 'Brouillon', sent: `${signes(e)} sur ${e.signataires.length}`, signed: 'Signée', declined: 'Refusée', cancelled: 'Annulée' }[e.statut] ?? e.statut;
}
function relance(e: Enveloppe) {
  if (e.statut === 'draft') return 'à envoyer';
  if (e.statut !== 'sent') return e.termine ? quand(e.termine) : '—';
  if (!e.signataires.some((s) => s.role === 'locataire' && s.statut !== 'signed')) return 'par eZsign';
  return e.prochaine ? `${quand(e.prochaine)} · ${e.relances} sur 3` : `${e.relances} sur 3`;
}

export function Documents({ donnees, erreurLecture }: { donnees: DonneesDocs | null; erreurLecture: string | null }) {
  const router = useRouter();
  const E = donnees?.enveloppes ?? [];
  const [sel, setSel] = useState<string | null>(E.find((e) => e.statut === 'sent')?.id ?? E[0]?.id ?? null);
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null), [proprio, setProprio] = useState('');
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const D = donnees, e = E.find((x) => x.id === sel) ?? null, maxJ = Math.max(1, ...D.delais.map((x) => x.jours));
  const enAttente = e?.signataires.find((s) => s.statut !== 'signed') ?? null;

  async function fonction(corps: Record<string, unknown>, ok: string) {
    setEnvoi(true); setBandeau(null);
    const r = await fetch('/api/signatures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
    const j = await r.json().catch(() => ({})); setEnvoi(false);
    if (!r.ok) { setBandeau(j.error ?? 'L’action n’a pas pu se faire.'); return; } setToast(ok); router.refresh();
  }
  async function rpc(nom: string, args: Record<string, unknown>, ok: string) {
    setEnvoi(true); setBandeau(null); const { data, error } = await supabaseNavigateur().rpc(nom, args); setEnvoi(false);
    if (error) { setBandeau(error.message); return null; } setToast(ok); router.refresh(); return data;
  }

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="studio">
        <div className="colonne-l18">
          <section className="studio-liste" aria-label="Enveloppes à signer">
            <header className="carte-tete tete-action"><div><h2>Enveloppes à signer</h2><p>{E.filter((x) => x.statut === 'sent').length} en cours · relances automatiques</p></div>
              {D.peut_ecrire && D.sans_mandat.length > 0 && <div className="ligne-champ">
                <select className="e70-raison" value={proprio} onChange={(ev) => setProprio(ev.target.value)} aria-label="Propriétaire sans mandat"><option value="">Mandat pour…</option>{D.sans_mandat.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}</select>
                <button className="bouton bouton-contour" disabled={envoi || !proprio} onClick={async () => { const id = await rpc('lanceur_creer_signature', { p: { kind: 'mandat', owner_id: proprio } }, 'Mandat préparé : vérifiez-le, puis envoyez.'); if (id) { setSel(id as string); setProprio(''); } }}>Préparer</button></div>}
            </header>
            <table className="tableau">
              <colgroup><col style={{ width: '33%' }} /><col style={{ width: '17%' }} /><col style={{ width: '15%' }} /><col style={{ width: '13%' }} /><col /></colgroup>
              <thead><tr><th>Document</th><th>Signataires</th><th>Statut</th><th>Envoyée</th><th className="droite">Relance</th></tr></thead>
              <tbody>{E.map((x) => (
                <tr key={x.id} className={x.id === sel ? 'sel' : ''} onClick={() => setSel(x.id)}>
                  <td><strong className="fort">{TYPES[x.kind] ?? x.titre}</strong><span className="sous gris">{x.sous}</span></td>
                  <td><span className="signataires">{x.signataires.map((s) => <span key={s.ord} className="ini-etat" title={`${s.nom} · ${s.statut === 'signed' ? 'signé' : 'pas encore signé'}`}>
                    <span className="ini" style={{ width: 28, height: 28, fontSize: 11 }}>{initiales(s.nom)}</span>{s.statut === 'signed' ? <span className="okdot"><Icone nom="check" taille={9} couleur="#fff" trait={2.6} /></span> : <i />}</span>)}</span></td>
                  <td className={x.statut === 'draft' || x.statut === 'cancelled' ? 'gris' : 'fort'}>{statut(x)}</td>
                  <td>{x.envoyee ? quand(x.envoyee) : '—'}</td>
                  <td className="droite gris">{relance(x)}</td></tr>))}
                {!E.length && <tr><td colSpan={5} className="gris">Aucun document en attente de signature.</td></tr>}</tbody>
            </table>
          </section>
          <section className="carte-l18" aria-label="Reçus par les portails">
            <header className="carte-tete sans-marge"><h2>Reçus par les portails</h2><p>Échange sécurisé · classés par l’IA · analysés avant ouverture</p></header>
            <ul className="modeles">{D.recus.map((r) => <li key={r.id}><span className="appel-ic"><Icone nom={r.type === 'facture' ? 'receipt' : 'file'} taille={20} couleur="#0C2147" /></span>
              <div><strong>{r.titre}</strong><span>{r.de ? `${r.de} · ` : ''}{quand(r.le)}</span></div>{r.type && <span className="puce">Classé : {CLASSES[r.type] ?? r.type}</span>}</li>)}
              {!D.recus.length && <li className="gris">Aucun document reçu.</li>}</ul>
          </section>
        </div>

        <div className="colonne-l18">
          <section className="carte-l18 e2" aria-label="Suivi de la signature">
            {!e ? <p className="gris" style={{ margin: 0 }}>Choisissez une enveloppe.</p> : <>
              <header className="carte-tete sans-marge"><h2>{TYPES[e.kind] ?? e.titre}{e.sous ? ` · ${e.sous}` : ''}</h2>
                <p>{e.envoyee ? `Envoyée ${quand(e.envoyee).replace('auj.', 'aujourd’hui à')}${e.par ? ` par ${e.par}` : ''}${e.simule ? ' · simulateur' : ''}` : 'Brouillon : rien n’est parti'}</p></header>
              <ul className="signataires-suivi">{e.signataires.map((s, i) => { const avant = e.signataires.slice(0, i).some((p) => p.statut !== 'signed'); return (
                <li key={s.ord}><span className="ini-etat grand"><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(s.nom)}</span>{s.statut === 'signed' ? <span className="okdot"><Icone nom="check" taille={10} couleur="#fff" trait={2.6} /></span> : <i className={e.statut === 'sent' && !avant ? 'actuel' : ''} />}</span>
                  <div><strong>{s.nom}</strong><span className={s.statut === 'signed' ? 'gris' : ''}>{s.statut === 'signed' ? `Signé ${quand(s.signe!)}` : s.statut === 'declined' ? 'A refusé de signer'
                    : e.statut !== 'sent' ? (s.role === 'equipe' ? 'Signera en dernier' : 'Signera en premier') : avant ? `Signera après ${e.signataires[i - 1].nom.split(' ')[0]}` : s.ouvert ? `Ouvert ${quand(s.ouvert)} · pas encore signé` : 'Pas encore ouvert'}</span></div>
                  {e.simule && e.statut === 'sent' && s.statut !== 'signed' && !avant && <button className="lien" disabled={envoi} onClick={() => fonction({ action: 'simuler', id: e.id, ord: s.ord, type: 'signed' }, `${s.nom.split(' ')[0]} a signé (simulateur).`)}>Simuler la signature</button>}</li>); })}</ul>
              {e.facture && <p className="ligne-ic" style={{ marginTop: 16 }}><Icone nom="receipt" taille={18} couleur="#2E5788" />{e.facture.statut === 'created' ? `Facture d’honoraires créée (${e.facture.fournisseur === 'simulateur' ? 'simulateur QuickBooks' : 'QuickBooks'}) · PRO-02 envoyé` : 'QuickBooks non branché : facture à créer à la main · PRO-02 envoyé'}</p>}
              {e.statut === 'sent' && <p className="texte-13" style={{ margin: '20px 0' }}>Relance automatique tous les 2 jours, 3 fois au plus, jamais entre 22 h et 8 h.</p>}
              {D.peut_ecrire && e.statut === 'draft' && <div className="studio-actions sans-marge" style={{ marginTop: 20, gridTemplateColumns: '1fr auto' }}>
                <button className="bouton bouton-principal" disabled={envoi} onClick={() => fonction({ action: 'envoyer', id: e.id }, 'Enveloppe envoyée.')}>Envoyer à signer</button>
                <button className="bouton bouton-contour" disabled={envoi} onClick={() => rpc('lanceur_annuler_signature', { p_id: e.id }, 'Brouillon annulé.')}>Annuler</button></div>}
              {D.peut_ecrire && e.statut === 'sent' && enAttente?.role === 'locataire' && <button className="bouton bouton-contour pleine" disabled={envoi || e.relances >= 3}
                onClick={() => rpc('lanceur_relancer_signature', { p_id: e.id }, `Relance envoyée à ${enAttente.nom.split(' ')[0]}.`)}><Icone nom="send" taille={16} couleur="#0C2147" />Relancer {enAttente.nom.split(' ')[0]} maintenant</button>}
            </>}
          </section>
          <section className="carte-l18" aria-label="Délai de signature">
            <header className="carte-tete sans-marge"><h2>{D.delais.length ? `Les ${(TYPES[D.delais[0].kind] ?? D.delais[0].kind).toLowerCase().replace(/^mandat de gestion$/, 'mandats').replace(/^bail$/, 'baux')} prennent ${jours(D.delais[0].jours)}` : 'Délai de signature'}</h2><p>Délai médian de signature · 90 derniers jours</p></header>
            {D.delais.length ? <ul className="barres">{D.delais.map((x, i) => <li key={x.kind}><span>{TYPES[x.kind] ?? x.kind}</span><i style={{ width: `${(100 * x.jours) / maxJ}%`, background: i ? '#C8D2DE' : undefined }} /><b>{jours(x.jours)}</b></li>)}</ul>
              : <p className="gris" style={{ margin: 0, fontSize: 13 }}>Aucune enveloppe signée depuis 90 jours.</p>}
          </section>
        </div>
      </div>
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
