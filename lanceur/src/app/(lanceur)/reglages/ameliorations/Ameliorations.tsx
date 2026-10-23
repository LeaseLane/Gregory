'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';

export type Amelioration = { id: string; titre: string; source: string; demandeur: string | null; demandes: number; statut: string; recue_le: string; livree_le: string | null; prevue_le: string | null;
  besoin: string | null; besoin_source: string | null; exigences: string[]; inclus: string | null; exclus: string | null; reporte: string | null; reporte_revision: string | null;
  arbitrage: string | null; accord_n: number | null; accord_total: number | null; arbitrage_note: string | null };
const STATUT: Record<string, [string, string]> = { a_cadrer: ['À cadrer', 'neutral'], cadree: ['Cadrée', 'contour'], en_developpement: ['En développement', 'action'], livree: ['Livrée', 'final'] };
const SOURCE: Record<string, string> = { locataires: 'Locataires via Cléo', proprietaires: 'Propriétaires', equipe: 'Équipe', cleo: 'Cléo' };
const DES: Record<string, string> = { locataires: 'des locataires, via Cléo', proprietaires: 'des propriétaires', equipe: 'de l’équipe', cleo: 'de Cléo' };
const ORDRE = ['locataires', 'proprietaires', 'equipe', 'cleo'];
// icône d'une exigence selon ce qu'elle demande (maquette e75 : accord écrit, montant, dates)
const icExigence = (x: string) => /accord|écrit|sign/i.test(x) ? 'pencil' : /\$|total|montant|loyer|prix/i.test(x) ? 'dollar' : /prélèv|date|\ble \d|jour|mois/i.test(x) ? 'calendar' : 'check';
const mois = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { month: 'long' });
const d = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
const sous = (a: Amelioration) => a.statut === 'livree' && a.livree_le ? `Livrée le ${d(a.livree_le)}` : a.statut === 'en_developpement' && a.prevue_le ? `Livraison prévue le ${d(a.prevue_le)}`
  : a.statut === 'cadree' ? `Depuis ${mois(a.recue_le)} · cadrage prêt` : a.demandeur && a.source === 'proprietaires' ? `Demandée aussi par ${a.demandeur}`
  : a.source === 'cleo' ? `Proposée par Cléo le ${d(a.recue_le)}` : `Reçue le ${d(a.recue_le)}`;

export function Ameliorations({ liste, peutEcrire }: { liste: Amelioration[]; peutEcrire: boolean }) {
  const router = useRouter();
  const [filtre, setFiltre] = useState('toutes'), [source, setSource] = useState(''), [sel, setSel] = useState<string | null>(liste.find((a) => a.statut === 'cadree')?.id ?? liste[0]?.id ?? null);
  const [nouvelle, setNouvelle] = useState(false), [f, setF] = useState({ titre: '', source: 'equipe', demandeur: '', besoin: '' }), [envoi, setEnvoi] = useState(false), [erreur, setErreur] = useState<string | null>(null);
  const L = liste.filter((a) => (filtre === 'toutes' || a.statut === filtre) && (!source || a.source === source)).sort((a, b) => b.demandes - a.demandes || ORDRE.indexOf(a.source) - ORDRE.indexOf(b.source) || a.recue_le.localeCompare(b.recue_le)), A = liste.find((a) => a.id === sel) ?? null;
  const total = liste.reduce((s, a) => s + a.demandes, 0), parSource = (s: string) => liste.filter((a) => a.source === s).reduce((x, a) => x + a.demandes, 0);
  const top = [...ORDRE].sort((a, b) => parSource(b) - parSource(a))[0], max = Math.max(1, ...liste.map((a) => a.demandes));
  async function maj(p: Record<string, unknown>) {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_amelioration_maj', { p }); setEnvoi(false);
    if (error) return setErreur(error.message); setNouvelle(false); setF({ titre: '', source: 'equipe', demandeur: '', besoin: '' }); router.refresh();
  }
  return (
    <>
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <div className="grille-2-1">
        <div className="po-colonne">
          <div className="filtres-ligne">
            <div className="lo-segments">{[['toutes', 'Toutes'], ['a_cadrer', 'À cadrer'], ['cadree', 'Cadrées'], ['en_developpement', 'En développement'], ['livree', 'Livrées']].map(([k, l]) =>
              <button key={k} className={filtre === k ? 'actif' : ''} onClick={() => setFiltre(k)}>{l} · {k === 'toutes' ? liste.length : liste.filter((a) => a.statut === k).length}</button>)}</div>
            <select className="filtre" style={{ marginLeft: 'auto' }} value={source} onChange={(e) => setSource(e.target.value)} aria-label="Source"><option value="">Source : toutes</option>{Object.entries(SOURCE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            {peutEcrire && <button className="haut-ibtn" onClick={() => setNouvelle(!nouvelle)} aria-label="Nouvelle demande"><Icone nom="plus" taille={20} couleur="#0C2147" /></button>}
          </div>
          {nouvelle && <section className="carte-l18"><h2 className="titre-carte">Nouvelle demande d’amélioration</h2>
            <div className="po-deux"><div><label className="fenetre-lib" htmlFor="am-t">Titre</label><input id="am-t" className="e70-raison" value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} /></div>
              <div><label className="fenetre-lib" htmlFor="am-s">Source</label><select id="am-s" className="e70-raison" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>{Object.entries(SOURCE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div></div>
            <label className="fenetre-lib" htmlFor="am-b">Besoin, dans les mots de la personne</label><input id="am-b" className="e70-raison" value={f.besoin} onChange={(e) => setF({ ...f, besoin: e.target.value })} />
            <button className="bouton bouton-principal" disabled={envoi || f.titre.trim().length < 4} onClick={() => maj({ action: 'creer', ...f })}>Ajouter</button></section>}
          <section className="carte-l18" aria-label="Demandes"><div className="ligne-entre"><h2 className="titre-carte" style={{ margin: 0 }}>{total ? `${Math.round((10 * parSource(top)) / total)} demandes sur 10 viennent ${DES[top]}` : 'Aucune demande'}</h2>
            <span className="gris texte-13">{total} demandes · triées par nombre</span></div>
            <table className="tableau tab-fixe tab-ameliorations" style={{ marginTop: 12 }}><colgroup><col style={{ width: '42%' }} /><col style={{ width: '23%' }} /><col style={{ width: '13%' }} /><col /></colgroup>
              <thead><tr><th>Demande</th><th>Source</th><th>Demandes</th><th>Statut</th></tr></thead>
              <tbody>{L.map((a) => { const [l, t] = STATUT[a.statut]; return <tr key={a.id} className={'ligne-lien' + (a.id === sel ? ' sel' : '')} onClick={() => setSel(a.id)}>
                <td><b className="fort">{a.titre}</b><span className="sous gris">{sous(a)}</span></td>
                <td><span className="ligne-ic">{a.source === 'locataires' || a.source === 'cleo' ? <img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 22, height: 22 }} /> : a.source === 'equipe' && a.demandeur ? <span className="ini" style={{ width: 24, height: 24, fontSize: 10 }}>{initiales(a.demandeur)}</span>
                  : <span className="pastille-ic"><Icone nom="users" taille={16} couleur="#0C2147" /></span>}
                  {a.source === 'equipe' && a.demandeur ? `Équipe · ${a.demandeur}` : SOURCE[a.source]}</span></td>
                <td><span className="barre-cout"><b>{a.demandes}</b><i style={{ width: `${(60 * a.demandes) / max}px` }} /></span></td>
                <td><span className={'puce ' + t}>{a.statut === 'livree' && <Icone nom="check" taille={12} couleur="#fff" trait={2.6} />}{l}</span></td></tr>; })}
                {!L.length && <tr><td colSpan={4} className="gris">{liste.length ? 'Aucune demande dans ce filtre.' : 'Aucune demande d’amélioration pour l’instant.'}</td></tr>}</tbody></table>
          </section>
        </div>
        {A && <section className="carte-l18 e2" aria-label="Cadrage"><div className="ligne-entre"><h2 className="titre-carte" style={{ margin: 0 }}>{A.titre}</h2><span className={'puce ' + STATUT[A.statut][1]}>{STATUT[A.statut][0]}</span></div>
          <p className="gris texte-13" style={{ margin: '2px 0 16px' }}>{A.demandes} demande{A.demandes > 1 ? 's' : ''} {A.source === 'locataires' ? 'de locataires via Cléo' : DES[A.source]} depuis {mois(A.recue_le)}</p>
          {A.besoin && <><p className="surtitre gris">Besoin</p><blockquote className="citation">« {A.besoin} »{A.besoin_source && <span className="ligne-ic gris texte-12"><img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 16, height: 16 }} />{A.besoin_source}</span>}</blockquote></>}
          {!!A.exigences.length && <><p className="surtitre gris" style={{ marginTop: 16 }}>Exigences</p><ul className="exigences">{A.exigences.map((x) => <li key={x} className="texte-13"><Icone nom={icExigence(x)} taille={16} couleur="#2C5A99" />{x}</li>)}</ul></>}
          {(A.inclus || A.exclus || A.reporte) && <><p className="surtitre gris" style={{ marginTop: 16 }}>Portée</p>
            <dl className="portee">{A.inclus && <><dt><i><Icone nom="check" taille={16} couleur="#0C2147" trait={2} /></i>Inclus</dt><dd>{A.inclus}</dd></>}{A.exclus && <><dt><i><Icone nom="ban" taille={16} couleur="#0C2147" trait={2} /></i>Exclus</dt><dd>{A.exclus}</dd></>}
              {A.reporte && <><dt><i><Icone nom="clock" taille={16} couleur="#0C2147" trait={2} /></i>Reporté</dt><dd>{A.reporte}{A.reporte_revision && <span className="revision"><Icone nom="clock" taille={14} couleur="#2C5A99" trait={2} />{A.reporte_revision}</span>}</dd></>}</dl></>}
          {A.arbitrage && <><p className="surtitre gris" style={{ marginTop: 16 }}>Arbitrage</p><p className="texte-13" style={{ margin: '0 0 8px' }}>{A.arbitrage}</p>
            {A.accord_total ? <><span className="carres-accord" aria-hidden="true">{Array.from({ length: A.accord_total }, (_, k) => <i key={k} className={k < (A.accord_n ?? 0) ? 'oui' : ''} />)}</span>
              <p className="texte-13" style={{ margin: '8px 0 0' }}><b>{A.accord_n} propriétaires sur {A.accord_total} ont déjà dit oui</b></p>{A.arbitrage_note && <p className="gris texte-12" style={{ margin: '2px 0 0' }}>{A.arbitrage_note}</p>}</> : null}</>}
          {peutEcrire && A.statut !== 'livree' && <button className="bouton bouton-principal" style={{ width: '100%', marginTop: 20 }} disabled={envoi}
            onClick={() => maj({ action: 'statut', id: A.id, statut: A.statut === 'a_cadrer' ? 'cadree' : A.statut === 'cadree' ? 'en_developpement' : 'livree' })}>
            <Icone nom="calendar" taille={18} couleur="#fff" />{A.statut === 'a_cadrer' ? 'Marquer comme cadrée' : A.statut === 'cadree' ? 'Planifier le développement' : 'Marquer comme livrée'}</button>}
        </section>}
      </div>
    </>
  );
}
