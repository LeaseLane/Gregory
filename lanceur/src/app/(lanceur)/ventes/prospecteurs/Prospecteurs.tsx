'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

export type Prospecteur = { id: string; nom: string; courriel: string | null; tel: string | null; actif: boolean; prospects: number; appels: number; signes: number; relances: number };

export function Prospecteurs({ liste, erreurLecture, peutInviter = false }: { liste: Prospecteur[]; erreurLecture: string | null; peutInviter?: boolean }) {
  const [vue, setVue] = useState<'liste' | 'classement'>('liste'), [ajout, setAjout] = useState(false), [ok, setOk] = useState<string | null>(null);
  if (erreurLecture) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const classement = [...liste].filter((p) => p.appels > 0).sort((a, b) => b.signes / Math.max(1, b.appels) - a.signes / Math.max(1, a.appels) || b.signes - a.signes);
  const taux = (p: Prospecteur) => p.appels ? `${(Math.round((1000 * p.signes) / p.appels) / 10).toString().replace('.', ',')} %` : '—';
  return (
    <section className="studio-liste" aria-label="Prospecteurs">
      <header className="carte-tete studio-tete">
        <div><h2>{vue === 'liste' ? 'Appelants' : 'Classement'}</h2><p>Les personnes qui appellent les propriétaires prospects : prospects assignés, appels sur 30 jours, mandats signés et relances dues.</p></div>
        <div className="ligne-ic" style={{ gap: 12 }}>{peutInviter && <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 18px' }} onClick={() => setAjout(true)}><Icone nom="plus" taille={16} couleur="#fff" />Ajouter un prospecteur</button>}
        <div className="segment" role="tablist">
          {([['liste', 'Appelants'], ['classement', 'Classement']] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={vue === k} className={vue === k ? 'actif' : ''} onClick={() => setVue(k)}>{l}</button>)}
        </div></div>
      </header>
      {ok && <div className="bandeau info" role="status" style={{ margin: '0 24px 16px' }}>{ok}</div>}
      {ajout && <AjoutProspecteur fermer={() => setAjout(false)} fait={(m) => { setAjout(false); setOk(m); }} />}
      {liste.length === 0 ? <p className="appro-vide">Aucun appelant pour l’instant.</p> : vue === 'liste' ? (
        <table className="tableau">
          <thead><tr><th>Appelant</th><th className="droite">Prospects</th><th className="droite">Appels (30 j)</th><th className="droite">Signés</th><th className="droite">Relances dues</th><th>Actif</th></tr></thead>
          <tbody>{liste.map((p) => (
            <tr key={p.id} style={{ cursor: 'default' }}>
              <td><strong className="fort">{p.nom}</strong><span className="sous gris" style={{ display: 'block', fontSize: 13 }}>{[p.courriel, p.tel].filter(Boolean).join(' · ')}</span></td>
              <td className="droite">{p.prospects}</td><td className="droite">{p.appels}</td><td className="droite fort">{p.signes}</td>
              <td className={'droite' + (p.relances ? ' fort' : '')} style={p.relances ? { color: '#9B2E28' } : undefined}>{p.relances}</td>
              <td><span className={'puce ' + (p.actif ? '' : 'neutral')}>{p.actif ? 'Actif' : 'Inactif'}</span></td>
            </tr>))}</tbody>
        </table>
      ) : (
        <table className="tableau">
          <thead><tr><th>Rang</th><th>Appelant</th><th className="droite">Appels</th><th className="droite">Signés</th><th className="droite">Taux de conversion</th></tr></thead>
          <tbody>{classement.length ? classement.map((p, i) => (
            <tr key={p.id} style={{ cursor: 'default' }}><td className="fort">{i + 1}</td><td className="fort">{p.nom}</td><td className="droite">{p.appels}</td><td className="droite">{p.signes}</td><td className="droite fort">{taux(p)}</td></tr>
          )) : <tr><td colSpan={5} className="gris">Aucun appel sur 30 jours.</td></tr>}</tbody>
        </table>
      )}
    </section>
  );
}

// Ajouter un prospecteur = l'inviter dans l'équipe au rôle « Prospection » (invitation valable 72 h; il crée son compte et sa double authentification).
function AjoutProspecteur({ fermer, fait }: { fermer: () => void; fait: (m: string) => void }) {
  const router = useRouter();
  const [f, setF] = useState({ nom: '', courriel: '' }), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  async function ok() {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_inviter_equipe', { p: { ...f, role: 'prospection' } });
    setEnvoi(false);
    if (error) return setErreur(error.message);
    fait(`Invitation envoyée à ${f.courriel} (valable 72 heures). Dès que ${f.nom.split(' ')[0]} crée son compte, il paraît dans cette liste et voit l’onglet « Mes prospects ».`); router.refresh();
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ap-p" style={{ marginTop: 120, width: 'min(480px, 100%)' }} onSubmit={(e) => { e.preventDefault(); ok(); }}>
        <div className="fenetre-tete"><h2 id="ap-p">Ajouter un prospecteur</h2><button type="button" className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        <p className="fenetre-texte">Il reçoit une invitation par courriel pour créer son compte. Il aura accès à Ventes (pipeline des mandats, prospection et « Mes prospects »), sans les autres espaces.</p>
        <label className="fenetre-lib">Nom complet<input className="e70-raison" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="Prénom et nom" /></label>
        <label className="fenetre-lib">Courriel<input type="email" className="e70-raison" value={f.courriel} onChange={(e) => setF({ ...f, courriel: e.target.value })} /></label>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={fermer}>Annuler</button>
          <button className="bouton bouton-principal" disabled={envoi || f.nom.trim().split(/\s+/).length < 2 || !/^\S+@\S+\.\S+$/.test(f.courriel)}>{envoi ? 'Envoi…' : 'Envoyer l’invitation'}</button></div>
      </form>
    </div>
  );
}
