'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';

/* Palette ⌘K (maquette e02) : une saisie, et l'admin répond : actions, fiches, pages, ou une question à Cléo.
   Le terme trouvé est en gras; ↑ ↓ naviguent, Entrée ouvre, Échap ferme. Seules les pages qui existent sont listées. */
const PAGES: [string, string, string][] = [
  ['Opérations', 'À approuver', '/operations/a-approuver'], ['Opérations', 'Inbox', '/operations/inbox'], ['Opérations', 'Mes tâches', '/operations/taches'],
  ['Opérations', 'Agenda', '/operations/agenda'], ['Opérations', 'Appels', '/operations/appels'],
  ['Ventes', 'Mandats propriétaires', '/ventes/mandats'], ['Ventes', 'Location', '/ventes/location'], ['Ventes', 'Leads entrants', '/ventes/leads'],
  ['Ventes', 'Contacts', '/ventes/contacts'], ['Ventes', 'Prospection IA', '/ventes/prospection'], ['Ventes', 'Prospecteurs', '/ventes/prospecteurs'],
  ['Clients', 'Processus', '/clients/processus'], ['Clients', 'Cessions et sous-locations', '/clients/cessions'], ['Clients', 'Solvabilité', '/clients/solvabilite'],
  ['Clients', 'Documents et signatures', '/clients/documents'], ['Maintenance', 'Soumissions', '/maintenance/soumissions'], ['Maintenance', 'Recrutement', '/maintenance/recrutement'],
  ['Juridique', 'Dossiers', '/juridique'], ['Juridique', 'Rappels', '/juridique/rappels'], ['Juridique', 'Mises en demeure', '/juridique/mises-en-demeure'],
  ['Juridique', 'Tribunal (TAL)', '/juridique/tal'], ['Juridique', 'Modèles', '/juridique/modeles'],
  ['Studio', 'Gabarits de courriels', '/studio/gabarits'], ['Cléo et IA', 'Automatisations', '/cleo-ia/automatisations'],
];
type Ligne = { groupe: string; titre: string; droite?: string; lien?: string; ini?: boolean; icone?: string; chemin?: [string, string]; cleo?: string };
const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function Gras({ t, q }: { t: string; q: string }) {
  const i = sansAccents(t).indexOf(sansAccents(q.trim()));
  if (!q.trim() || i < 0) return <>{t}</>;
  return <>{t.slice(0, i)}<b>{t.slice(i, i + q.trim().length)}</b>{t.slice(i + q.trim().length)}</>;
}

export function Palette({ fermer, demanderCleo }: { fermer: () => void; demanderCleo: (q: string) => void }) {
  const router = useRouter();
  const champ = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(''), [res, setRes] = useState<{ actions: Ligne[]; fiches: Ligne[] }>({ actions: [], fiches: [] }), [i, setI] = useState(0);
  useEffect(() => { champ.current?.focus(); }, []);
  useEffect(() => {
    if (q.trim().length < 2) { setRes({ actions: [], fiches: [] }); return; }
    const t = setTimeout(async () => {
      const { data } = await supabaseNavigateur().rpc('lanceur_recherche', { q: q.trim() });
      const d = (data ?? { actions: [], fiches: [] }) as { actions: { titre: string; droite?: string; lien: string }[]; fiches: { titre: string; droite?: string; lien: string; ini?: boolean; icone?: string }[] };
      setRes({ actions: d.actions.map((a) => ({ groupe: 'Actions', titre: a.titre, droite: a.droite, lien: a.lien, icone: a.lien.startsWith('tel:') ? 'phone' : 'check' })),
        fiches: d.fiches.map((f) => ({ groupe: 'Fiches', titre: f.titre, droite: f.droite, lien: f.lien, ini: f.ini, icone: f.icone })) });
    }, 180);
    return () => clearTimeout(t);
  }, [q]);
  const pages: Ligne[] = q.trim() ? PAGES.filter(([e, p]) => sansAccents(`${e} ${p}`).includes(sansAccents(q.trim()))).slice(0, 4).map(([e, p, l]) => ({ groupe: 'Pages', titre: p, chemin: [e, p], lien: l, icone: 'file' })) : [];
  const lignes: Ligne[] = [...res.actions, ...res.fiches, ...pages, ...(q.trim() ? [{ groupe: 'Demander à Cléo', titre: `« ${q.trim()} »`, droite: 'Cléo cite ses sources', cleo: q.trim() }] : [])];
  useEffect(() => { setI(0); }, [q, res]);
  function ouvrir(l: Ligne) {
    if (l.cleo) { demanderCleo(l.cleo); return; }
    if (l.lien?.startsWith('tel:')) { location.href = l.lien; return; }
    if (l.lien) { fermer(); router.push(l.lien); }
  }
  return (
    <div className="palette-fond" onClick={fermer}>
      <div className="palette" role="dialog" aria-label="Demandez à Cléo ou cherchez" onClick={(e) => e.stopPropagation()}>
        <div className="palette-champ">
          <img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 32, height: 32 }} />
          <input ref={champ} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Demandez à Cléo ou cherchez…" aria-label="Recherche"
            onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setI((i + 1) % Math.max(1, lignes.length)); } if (e.key === 'ArrowUp') { e.preventDefault(); setI((i - 1 + lignes.length) % Math.max(1, lignes.length)); }
              if (e.key === 'Enter' && lignes[i]) ouvrir(lignes[i]); }} />
          {q && <button className="fermer" onClick={() => setQ('')} aria-label="Effacer la saisie"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button>}
        </div>
        {!q.trim() ? <p className="palette-vide">Cherchez une personne, un logement, un dossier ou une page, ou posez une question à Cléo.</p> : (
          <div className="palette-res" role="listbox">
            {lignes.map((l, k) => <div key={k}>
              {(k === 0 || lignes[k - 1].groupe !== l.groupe) && <p className="surtitre gris">{l.groupe}</p>}
              <button role="option" aria-selected={k === i} className={'palette-ligne' + (k === i ? ' sel' : '')} onMouseEnter={() => setI(k)} onClick={() => ouvrir(l)}>
                {l.cleo ? <img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 32, height: 32 }} /> : l.ini ? <span className="ini" style={{ width: 32, height: 32, fontSize: 12 }}>{initiales(l.titre)}</span>
                  : <span className="palette-ic"><Icone nom={l.icone ?? 'file'} taille={18} couleur="#0C2147" /></span>}
                <span className="palette-titre">{l.chemin ? <>{l.chemin[0]}<Icone nom="chevron" taille={16} couleur="#8A99AB" /><span><Gras t={l.chemin[1]} q={q} /></span></> : <span><Gras t={l.titre} q={q} /></span>}</span>
                <span className="palette-droite">{l.droite}</span>
                {k === i && <kbd className="touche">Entrée</kbd>}
              </button></div>)}
          </div>)}
        <div className="palette-pied"><kbd className="touche">↑</kbd><kbd className="touche">↓</kbd><span>naviguer</span><kbd className="touche">Entrée</kbd><span>ouvrir</span><kbd className="touche">Échap</kbd><span>fermer</span>
          <span style={{ marginLeft: 'auto' }}>{q.trim() ? `${lignes.length} résultat${lignes.length > 1 ? 's' : ''}` : ''}</span></div>
      </div>
    </div>
  );
}
