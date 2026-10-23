'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { adresse } from '@/lib/format';

/* e07 · Assigner la demande (fenêtre de 640 px) : fournisseur (le mieux placé en tête, recommandé), plage d'intervention
   (premier créneau qui laisse 24 h d'avis, sauf urgence), avis au locataire. Crée le bon de travail assigné et planifié. */
type Four = { id: string; nom: string; note: number | null; avis: number; disponibilite: string | null; specialites: (string | null)[] };
type Ctx = { numero: string; titre: string; urgent: boolean; urgence: string; logement: string; locataire: { nom: string; telephone: boolean } | null; budget: number; creneau: string; fournisseurs: Four[]; peut_ecrire: boolean };
const DISPO: Record<string, string> = { maintenant: 'disponible maintenant', aujourdhui: 'disponible aujourd’hui', semaine: 'disponible cette semaine', indisponible: 'indisponible' };
const local = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const plage = (a: Date, b: Date) => `${a.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}, entre ${a.getHours()} h et ${b.getHours()} h`;

export function AssignerDemande({ demande, fermer }: { demande: string; fermer: () => void }) {
  const router = useRouter();
  const [c, setC] = useState<Ctx | null>(null), [erreur, setErreur] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  const [four, setFour] = useState(''), [debut, setDebut] = useState(''), [aviser, setAviser] = useState(true), [changer, setChanger] = useState(false), [modifier, setModifier] = useState(false);
  useEffect(() => {
    supabaseNavigateur().rpc('lanceur_assigner_contexte', { p_demande: demande }).then(({ data, error }) => {
      if (error) return setErreur(error.message);
      const x = data as Ctx; setC(x); setFour(x.fournisseurs[0]?.id ?? ''); setDebut(local(new Date(x.creneau)));
    });
    const t = (e: KeyboardEvent) => e.key === 'Escape' && fermer();
    window.addEventListener('keydown', t); return () => window.removeEventListener('keydown', t);
  }, [demande, fermer]);
  const a = debut ? new Date(debut) : null, b = a ? new Date(a.getTime() + 2 * 3600e3) : null;
  const choisi = c?.fournisseurs.find((f) => f.id === four);
  async function assigner() {
    if (!a || !b) return;
    setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_assigner_demande', { p: { demande, worker_id: four, debut: a.toISOString(), fin: b.toISOString(), aviser, budget: c?.budget } });
    setEnvoi(false); if (error) return setErreur(error.message);
    fermer(); router.push(`/maintenance/bons/${(data as { id: string }).id}`);
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="fenetre fenetre-640" role="dialog" aria-modal="true" aria-labelledby="as-t">
        <div className="fenetre-tete"><h2 id="as-t">{c ? `Assigner la demande ${c.numero}?` : 'Assigner la demande'}</h2>
          <button className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        {!c ? !erreur && <p className="gris">Chargement…</p> : <>
          <p className="fenetre-texte">{c.titre} au {adresse(c.logement)}, classée « {c.urgence} ». Le fournisseur choisi reçoit le bon de travail et confirme la plage.</p>
          <p className="fenetre-lib">Fournisseur <span>obligatoire</span></p>
          {c.fournisseurs.length ? <div className="choix-liste" role="radiogroup" aria-label="Fournisseur">{c.fournisseurs.slice(0, changer ? 4 : 2).map((f, i) =>
            <button type="button" key={f.id} role="radio" aria-checked={four === f.id} className={'choix' + (four === f.id ? ' choisi' : '')} onClick={() => setFour(f.id)}>
              <i className="radio" aria-hidden="true" /><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{f.nom.split(/\s+/).map((m) => m[0]).slice(0, 2).join('').toUpperCase()}</span>
              <span className="choix-texte"><strong>{f.nom}</strong><span className="ligne-ic gris texte-13"><Icone nom="star" taille={14} couleur="#0C2147" />
                {[f.note ? `${String(f.note).replace('.', ',')} · ${f.avis} avis` : 'aucun avis', DISPO[f.disponibilite ?? ''] ?? null].filter(Boolean).join(' · ')}</span></span>
              {i === 0 && <span className="choix-reco"><img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 20, height: 20 }} />Recommandé par Cléo</span>}
            </button>)}</div> : <p className="bandeau">Aucun fournisseur conforme (assurance et licence RBQ valides).</p>}
          {c.fournisseurs.length > 2 && !changer && <button className="lien" style={{ marginTop: 8 }} onClick={() => setChanger(true)}>Voir {c.fournisseurs.length - 2} autre{c.fournisseurs.length > 3 ? 's' : ''} fournisseur{c.fournisseurs.length > 3 ? 's' : ''}</button>}
          <p className="fenetre-lib" style={{ marginTop: 24 }}>Plage d’intervention</p>
          {modifier ? <div className="champ-ic"><Icone nom="calendar" taille={20} couleur="#58697F" />
            <input type="datetime-local" className="e70-raison" value={debut} step={3600} onChange={(e) => setDebut(e.target.value)} aria-label="Début de la plage" autoFocus onBlur={() => setModifier(false)} /></div>
            : <button type="button" className="e70-raison champ-texte" onClick={() => setModifier(true)} aria-label="Changer la plage"><span>{a && b ? plage(a, b).charAt(0).toUpperCase() + plage(a, b).slice(1) : '—'}</span><Icone nom="calendar" taille={20} couleur="#58697F" /></button>}
          <p className="gris texte-12" style={{ margin: '8px 0 0' }}>{c.urgent ? 'Urgence : l’avis de 24 h ne s’applique pas.' : `Premier créneau${choisi ? ` de ${choisi.nom}` : ''} qui laisse 24 h d’avis au locataire.`}</p>
          <label className="case-ligne" style={{ marginTop: 24 }}>
            <input type="checkbox" checked={aviser} onChange={(e) => setAviser(e.target.checked)} disabled={!c.locataire} />
            <span><strong>Aviser le locataire 24 h à l’avance (art. 1931 C.c.Q.)</strong>
              <span className="gris texte-13" style={{ display: 'block' }}>{c.locataire ? `Avis dans le portail de ${c.locataire.nom}${c.locataire.telephone ? ', et SMS quand l’avis d’entrée (LOC-03) est actif' : ''}` : 'Logement sans locataire actif'}</span></span>
          </label>
          <div className="fenetre-actions" style={{ marginTop: 24, justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="ligne-ic gris texte-12"><Icone nom="history" taille={14} couleur="#58697F" />Inscrit au journal</span>
            <span style={{ display: 'flex', gap: 12 }}><button className="bouton bouton-contour" onClick={fermer}>Annuler</button>
              <button className="bouton bouton-principal" disabled={envoi || !four || !a || !c.peut_ecrire} onClick={assigner}>{envoi ? 'Assignation…' : `Assigner à ${choisi?.nom ?? '…'}`}</button></span>
          </div>
        </>}
      </div>
    </div>
  );
}
