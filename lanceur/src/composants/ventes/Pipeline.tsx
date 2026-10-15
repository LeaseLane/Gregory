'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { Perdu } from '@/composants/ventes/Perdu';
import { argent, initiales, joursDepuis } from '@/lib/ventes';

/* Pipeline (maquettes l05 Mandats et e12 Location) : kanban par étape (glisser-déposer) ou liste; valeur, portes,
   temps dans l'étape et retard sur la cible. « Perdu » ouvre e14; « Converti » passe par la fiche (e15). */
type Etape = { id: string; name: string; category: 'active' | 'won' | 'lost' | 'dormant'; target_days: number | null };
type Deal = { id: string; number: string; title: string; subtitle: string | null; stage_id: string; source: string | null; owner_user_id: string | null; owner: string | null;
  monthly_value_cents: number | null; doors: number | null; loss_reason: string | null; loss_note: string | null; converted_at: string | null; close_date: string | null;
  entered_at: string | null; prochaine: string | null };
export type DonneesPipeline = { pipeline: { code: string; name: string; item_name: string }; peut_ecrire: boolean; etapes: Etape[]; deals: Deal[];
  equipe: { id: string; nom: string }[]; sources: { id: string; name: string }[] };

const MAX = 4;
const court = (n: string | null) => { if (!n) return ''; const [p, f] = n.split(/\s+/); return f ? `${p} ${f[0]}.` : p; };

export function Pipeline({ donnees, raisons, erreurLecture }: { donnees: DonneesPipeline | null; raisons: { code: string; label: string }[]; erreurLecture: string | null }) {
  const router = useRouter();
  const [vue, setVue] = useState<'kanban' | 'liste'>('kanban');
  const [resp, setResp] = useState(''), [source, setSource] = useState('');
  const [tout, setTout] = useState<string[]>([]);
  const [glisse, setGlisse] = useState<string | null>(null), [survol, setSurvol] = useState<string | null>(null);
  const [perdu, setPerdu] = useState<Deal | null>(null);
  const [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  useEffect(() => {
    const sb = supabaseNavigateur();
    const c = sb.channel('deals').on('postgres_changes', { event: '*', schema: 'crm', table: 'deals' }, () => router.refresh()).subscribe();
    return () => { sb.removeChannel(c); };
  }, [router]);

  const deals = useMemo(() => (donnees?.deals ?? []).filter((d) => (!resp || d.owner_user_id === resp) && (!source || d.source === source)), [donnees, resp, source]);
  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const etapes = donnees.etapes;
  const ouverts = deals.filter((d) => etapes.find((e) => e.id === d.stage_id)?.category === 'active');
  const total = (l: Deal[]) => ({ n: l.length, portes: l.reduce((a, d) => a + (d.doors ?? 0), 0), v: l.reduce((a, d) => a + (d.monthly_value_cents ?? 0), 0) });
  const t = total(ouverts);

  async function deplacer(d: Deal, e: Etape) {
    if (d.stage_id === e.id) return;
    if (e.category === 'lost') { setPerdu(d); return; }
    if (e.category === 'won') { setBandeau(`Pour convertir ${d.title}, ouvrez la fiche : la conversion crée le propriétaire et son accès.`); return; }
    setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_deplacer_deal', { p: { deal_id: d.id, stage_id: e.id, read_stage_id: d.stage_id } });
    if (error) setBandeau(error.message); else { setToast(`${d.title} → ${e.name}`); router.refresh(); }
  }
  const etapePerdu = etapes.find((e) => e.category === 'lost');

  const Carte = ({ d, e }: { d: Deal; e: Etape }) => {
    const age = joursDepuis(d.entered_at), retard = e.category === 'active' && e.target_days != null && age > e.target_days;
    return (
      <Link href={`/ventes/deals/${d.id}`} className="deal" draggable={donnees.peut_ecrire} onDragStart={() => setGlisse(d.id)} onDragEnd={() => { setGlisse(null); setSurvol(null); }}>
        <span className="deal-l1"><strong>{d.title}</strong><b>{argent(d.monthly_value_cents)}</b></span>
        <span className="deal-l2" title={d.subtitle ?? undefined}>{[d.doors ? `${d.doors} porte${d.doors > 1 ? 's' : ''}` : null, d.subtitle].filter(Boolean).join(' · ')}</span>
        <span className="deal-l3">
          {d.source && <span className="puce">{d.source}</span>}
          {e.category === 'won' ? <span className="puce final">{d.converted_at ? 'Onboarding lancé' : 'Signé'}</span>
            : e.category === 'lost' ? <span className="deal-etat fort">Raison : {(d.loss_reason ?? '—').toLowerCase()}</span>
            : retard ? <span className="deal-etat rouge"><i />{age} j · cible {e.target_days} j</span>
            : <span className="deal-etat">{d.prochaine ?? (age ? `${age} j dans l’étape` : 'auj.')}</span>}
          {e.category !== 'won' && d.owner && <span className="ini" title={d.owner} style={{ width: 26, height: 26, fontSize: 11 }}>{initiales(d.owner)}</span>}
        </span>
      </Link>
    );
  };

  return (
    <>
      <div className="filtres">
        <div className="segment vue" role="tablist" aria-label="Vue">
          {([['kanban', 'Kanban', 'columns'], ['liste', 'Liste', 'list']] as const).map(([k, l, ic]) => (
            <button key={k} role="tab" aria-selected={vue === k} className={vue === k ? 'actif' : ''} onClick={() => setVue(k)}><Icone nom={ic} taille={20} couleur={vue === k ? '#0C2147' : '#3E4A59'} />{l}</button>))}
        </div>
        <label className="filtre"><span className="sr">Responsable</span><select value={resp} onChange={(e) => setResp(e.target.value)}>
          <option value="">Responsable : tous</option>{donnees.equipe.map((m) => <option key={m.id} value={m.id}>Responsable : {m.nom}</option>)}</select><Icone nom="chevD" taille={18} couleur="#3E4A59" /></label>
        <label className="filtre"><span className="sr">Source</span><select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">Source : toutes</option>{donnees.sources.map((s) => <option key={s.id} value={s.name}>Source : {s.name.toLowerCase()}</option>)}</select><Icone nom="chevD" taille={18} couleur="#3E4A59" /></label>
        <strong className="pipeline-total">{t.n} deal{t.n > 1 ? 's' : ''} ouvert{t.n > 1 ? 's' : ''} · {t.portes} portes · {argent(t.v)} par mois</strong>
      </div>
      {bandeau && <div className="bandeau info" role="status">{bandeau}</div>}

      {vue === 'kanban' ? (
        <div className="kanban">
          {etapes.map((e) => {
            const l = deals.filter((d) => d.stage_id === e.id), s = total(l), voir = tout.includes(e.id) ? l : l.slice(0, MAX);
            return (
              <section key={e.id} className={'colonne' + (survol === e.id ? ' survol' : '')} aria-label={`Étape ${e.name}`}
                onDragOver={(ev) => { if (glisse) { ev.preventDefault(); setSurvol(e.id); } }} onDragLeave={() => setSurvol(null)}
                onDrop={(ev) => { ev.preventDefault(); const d = deals.find((x) => x.id === glisse); setSurvol(null); if (d) deplacer(d, e); }}>
                <header><h2>{e.name}</h2><p>{s.n}{e.category === 'won' ? ' sur 60 jours' : ''} · {s.portes} portes · {argent(s.v)}</p></header>
                {voir.map((d) => <Carte key={d.id} d={d} e={e} />)}
                {l.length > MAX && <button className="lien" onClick={() => setTout((x) => x.includes(e.id) ? x.filter((y) => y !== e.id) : [...x, e.id])}>
                  {tout.includes(e.id) ? 'Afficher moins' : `Afficher ${l.length - MAX} autre${l.length - MAX > 1 ? 's' : ''} deal${l.length - MAX > 1 ? 's' : ''}`}</button>}
                {e.category === 'lost' && <p className="regle"><Icone nom="info" taille={18} couleur="#58697F" />Une raison de perte est obligatoire.</p>}
                {!l.length && e.category !== 'lost' && <p className="colonne-vide">Aucun deal.</p>}
              </section>
            );
          })}
        </div>
      ) : (
        <section className="studio-liste">
          <table className="tableau">
            <thead><tr><th>Deal</th><th>Étape</th><th className="droite">Par mois</th><th className="droite">Portes</th><th>Source</th><th>Responsable</th><th className="droite">Dans l’étape</th></tr></thead>
            <tbody>{deals.map((d) => { const e = etapes.find((x) => x.id === d.stage_id); const age = joursDepuis(d.entered_at); return (
              <tr key={d.id} onClick={() => router.push(`/ventes/deals/${d.id}`)}>
                <td><strong className="fort">{d.title}</strong></td><td>{e?.name}</td><td className="droite fort">{argent(d.monthly_value_cents)}</td><td className="droite">{d.doors ?? '—'}</td>
                <td>{d.source}</td><td>{court(d.owner)}</td>
                <td className={'droite' + (e?.category === 'active' && e.target_days != null && age > e.target_days ? ' rouge fort' : '')}>{age} j</td>
              </tr>); })}</tbody>
          </table>
          {!deals.length && <p className="appro-vide">Aucun deal. Créez-en un ou importez vos prospects.</p>}
        </section>
      )}
      {perdu && etapePerdu && <Perdu deal={perdu} etapePerdu={etapePerdu.id} etapeLue={perdu.stage_id} raisons={raisons} responsable={court(perdu.owner) || null}
        fermer={() => setPerdu(null)} fait={() => { setToast(`${perdu.title} marqué comme perdu.`); setPerdu(null); router.refresh(); }} />}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
