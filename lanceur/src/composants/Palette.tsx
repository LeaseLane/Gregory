'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { voitPage, entreeEspace, type Droits } from '@/lib/espaces';
import { useT } from '@/composants/Langue';

/* Palette ⌘K (maquette e02) : une saisie, et l'admin répond : actions, fiches, pages, ou une question à Cléo.
   Le terme trouvé est en gras; ↑ ↓ naviguent, Entrée ouvre, Échap ferme. Seules les pages qui existent sont listées. */
const ESPACES: [string, string, string][] = [['Accueil', '/', 'home'], ['Opérations', '/operations', 'inbox'], ['Ventes', '/ventes/mandats', 'trend'], ['Clients', '/clients/proprietaires', 'users'], ['Immeubles', '/immeubles', 'building'], ['Maintenance', '/maintenance/bons', 'wrench'],
  ['Finances', '/finances/vue', 'dollar'], ['Juridique', '/juridique', 'scale'], ['Studio', '/studio/site', 'globe'], ['Cléo et IA', '/cleo-ia', 'spark'], ['Réglages', '/reglages', 'chart']];
const PAGES: [string, string, string][] = [
  ['Opérations', 'À approuver', '/operations/a-approuver'], ['Opérations', 'Inbox', '/operations/inbox'], ['Opérations', 'Mes tâches', '/operations/taches'],
  ['Opérations', 'Agenda', '/operations/agenda'], ['Opérations', 'Appels', '/operations/appels'],
  ['Ventes', 'Mandats propriétaires', '/ventes/mandats'], ['Ventes', 'Location', '/ventes/location'], ['Ventes', 'Leads entrants', '/ventes/leads'],
  ['Ventes', 'Contacts', '/ventes/contacts'], ['Ventes', 'Prospection IA', '/ventes/prospection'], ['Ventes', 'Prospecteurs', '/ventes/prospecteurs'],
  ['Clients', 'Processus', '/clients/processus'], ['Clients', 'Cessions et sous-locations', '/clients/cessions'], ['Clients', 'Documents et signatures', '/clients/documents'], ['Maintenance', 'Soumissions', '/maintenance/soumissions'], ['Maintenance', 'Recrutement', '/maintenance/recrutement'],
  ['Juridique', 'Dossiers', '/juridique'], ['Juridique', 'Rappels', '/juridique/rappels'], ['Juridique', 'Mises en demeure', '/juridique/mises-en-demeure'],
  ['Juridique', 'Tribunal (TAL)', '/juridique/tal'], ['Juridique', 'Modèles', '/juridique/modeles'],
  ['Studio', 'Gabarits de courriels', '/studio/gabarits'], ['Cléo et IA', 'Automatisations', '/cleo-ia/automatisations'],
];
type Ligne = { groupe: string; titre: string; droite?: string; lien?: string; ini?: boolean; icone?: string; chemin?: [string, string]; cleo?: string };
const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function Gras({ s, q }: { s: string; q: string }) {
  const i = sansAccents(s).indexOf(sansAccents(q.trim()));
  if (!q.trim() || i < 0) return <>{s}</>;
  return <>{s.slice(0, i)}<b>{s.slice(i, i + q.trim().length)}</b>{s.slice(i + q.trim().length)}</>;
}

export function Palette({ fermer, demanderCleo, droits }: { fermer: () => void; demanderCleo: (q: string) => void; droits: Droits | null }) {
  // Seulement les pages du rôle (même règle que les onglets); sans droits connus, la liste reste entière (la page refusera).
  const { t } = useT();
  const permise = (lien: string) => !droits || voitPage(droits, lien);
  const router = useRouter();
  const champ = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(''), [res, setRes] = useState<{ actions: Ligne[]; fiches: Ligne[] }>({ actions: [], fiches: [] }), [i, setI] = useState(0);
  useEffect(() => { champ.current?.focus(); }, []);
  useEffect(() => {
    if (q.trim().length < 2) { setRes({ actions: [], fiches: [] }); return; }
    const tm = setTimeout(async () => {
      const { data } = await supabaseNavigateur().rpc('lanceur_recherche', { q: q.trim() });
      const d = (data ?? { actions: [], fiches: [] }) as { actions: { titre: string; droite?: string; lien: string }[]; fiches: { titre: string; droite?: string; lien: string; ini?: boolean; icone?: string }[] };
      setRes({ actions: d.actions.map((a) => ({ groupe: t('Actions'), titre: a.titre, droite: a.droite, lien: a.lien, icone: a.lien.startsWith('tel:') ? 'phone' : 'check' })),
        fiches: d.fiches.map((f) => ({ groupe: t('Fiches'), titre: f.titre, droite: f.droite, lien: f.lien, ini: f.ini, icone: f.icone })) });
    }, 180);
    return () => clearTimeout(tm);
  }, [q]);
  const pages: Ligne[] = q.trim() ? PAGES.filter(([e, p, l]) => permise(l) && sansAccents(`${t(e)} ${t(p)}`).includes(sansAccents(q.trim()))).slice(0, 4).map(([e, p, l]) => ({ groupe: t('Pages'), titre: t(p), chemin: [t(e), t(p)] as [string, string], lien: l, icone: 'file' })) : ESPACES.map(([e, l, ic]): [string, string, string] => [e, droits ? entreeEspace(droits, { racine: '/' + l.split('/')[1], href: l }) : l, ic]).filter(([, l]) => permise(l)).map(([e, l, ic]) => ({ groupe: t('Aller à'), titre: t(e), lien: l, icone: ic }));
  const lignes: Ligne[] = [...res.actions, ...res.fiches, ...pages, ...(q.trim() ? [{ groupe: t('Demander à Cléo'), titre: `« ${q.trim()} »`, droite: t('Cléo cite ses sources'), cleo: q.trim() }] : [])];
  useEffect(() => { setI(0); }, [q, res]);
  function ouvrir(l: Ligne) {
    if (l.cleo) { demanderCleo(l.cleo); return; }
    if (l.lien?.startsWith('tel:')) { location.href = l.lien; return; }
    if (l.lien) { fermer(); router.push(l.lien); }
  }
  return (
    <div className="palette-fond" onClick={fermer}>
      <div className="palette" role="dialog" aria-label={t('Demandez à Cléo ou cherchez')} onClick={(e) => e.stopPropagation()}>
        <div className="palette-champ">
          <img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 32, height: 32 }} />
          <input ref={champ} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Demandez à Cléo ou cherchez…')} aria-label={t('Recherche')}
            onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setI((i + 1) % Math.max(1, lignes.length)); } if (e.key === 'ArrowUp') { e.preventDefault(); setI((i - 1 + lignes.length) % Math.max(1, lignes.length)); }
              if (e.key === 'Enter' && lignes[i]) ouvrir(lignes[i]); }} />
          {q && <button className="fermer" onClick={() => setQ('')} aria-label={t('Effacer la saisie')}><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button>}
        </div>
        {!q.trim() && <p className="palette-vide">{t('Cherchez une personne, un logement, un dossier ou une page, ou posez une question à Cléo.')}</p>}
        {lignes.length > 0 && (
          <div className="palette-res" role="listbox">
            {lignes.map((l, k) => <div key={k}>
              {(k === 0 || lignes[k - 1].groupe !== l.groupe) && <p className="surtitre gris">{l.groupe}</p>}
              <button role="option" aria-selected={k === i} className={'palette-ligne' + (k === i ? ' sel' : '')} onMouseEnter={() => setI(k)} onClick={() => ouvrir(l)}>
                {l.cleo ? <img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 32, height: 32 }} /> : l.ini ? <span className="ini" style={{ width: 32, height: 32, fontSize: 12 }}>{initiales(l.titre)}</span>
                  : <span className="palette-ic"><Icone nom={l.icone ?? 'file'} taille={18} couleur="#0C2147" /></span>}
                <span className="palette-titre">{l.chemin ? <>{l.chemin[0]}<Icone nom="chevron" taille={16} couleur="#8A99AB" /><span><Gras s={l.chemin[1]} q={q} /></span></> : <span><Gras s={l.titre} q={q} /></span>}</span>
                <span className="palette-droite">{l.droite}</span>
                {k === i && <kbd className="touche">{t('Entrée|clavier')}</kbd>}
              </button></div>)}
          </div>)}
        <div className="palette-pied"><kbd className="touche">↑</kbd><kbd className="touche">↓</kbd><span>{t('naviguer')}</span><kbd className="touche">{t('Entrée|clavier')}</kbd><span>{t('ouvrir')}</span><kbd className="touche">{t('Échap')}</kbd><span>{t('fermer')}</span>
          <span style={{ marginLeft: 'auto' }}>{q.trim() ? (lignes.length > 1 ? t('{n} résultats', { n: lignes.length }) : t('{n} résultat', { n: lignes.length })) : ''}</span></div>
      </div>
    </div>
  );
}
