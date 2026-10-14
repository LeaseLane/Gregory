'use client';
import { useState } from 'react';

export type Prospecteur = { id: string; nom: string; courriel: string | null; tel: string | null; actif: boolean; prospects: number; appels: number; signes: number; relances: number };

export function Prospecteurs({ liste, erreurLecture }: { liste: Prospecteur[]; erreurLecture: string | null }) {
  const [vue, setVue] = useState<'liste' | 'classement'>('liste');
  if (erreurLecture) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const classement = [...liste].filter((p) => p.appels > 0).sort((a, b) => b.signes / Math.max(1, b.appels) - a.signes / Math.max(1, a.appels) || b.signes - a.signes);
  const taux = (p: Prospecteur) => p.appels ? `${(Math.round((1000 * p.signes) / p.appels) / 10).toString().replace('.', ',')} %` : '—';
  return (
    <section className="studio-liste" aria-label="Prospecteurs">
      <header className="carte-tete studio-tete">
        <div><h2>{vue === 'liste' ? 'Appelants' : 'Classement'}</h2><p>Les personnes qui appellent les propriétaires prospects : prospects assignés, appels sur 30 jours, mandats signés et relances dues.</p></div>
        <div className="segment" role="tablist">
          {([['liste', 'Appelants'], ['classement', 'Classement']] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={vue === k} className={vue === k ? 'actif' : ''} onClick={() => setVue(k)}>{l}</button>)}
        </div>
      </header>
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
