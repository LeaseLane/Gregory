'use client';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { Perdu } from '@/composants/ventes/Perdu';
import { argent, initiales, joursDepuis } from '@/lib/ventes';
import { useT } from '@/composants/Langue';

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
  const { t, locale } = useT();
  const portes = (n: number) => t(n > 1 ? '{n} portes' : '{n} porte', { n });
  const [vue, setVue] = useState<'kanban' | 'liste'>('kanban');
  const [resp, setResp] = useState(''), [source, setSource] = useState('');
  const [tout, setTout] = useState<string[]>([]);
  const [glisse, setGlisse] = useState<string | null>(null), [survol, setSurvol] = useState<string | null>(null);
  const [perdu, setPerdu] = useState<Deal | null>(null);
  const [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const h = setTimeout(() => setToast(null), 6000); return () => clearTimeout(h); }, [toast]);
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
  const tot = total(ouverts);

  async function deplacer(d: Deal, e: Etape) {
    if (d.stage_id === e.id) return;
    if (e.category === 'lost') { setPerdu(d); return; }
    if (e.category === 'won') { setBandeau(t('Pour convertir {titre}, ouvrez la fiche : la conversion crée le propriétaire et son accès.', { titre: d.title })); return; }
    setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_deplacer_deal', { p: { deal_id: d.id, stage_id: e.id, read_stage_id: d.stage_id } });
    if (error) setBandeau(error.message); else { setToast(`${d.title} → ${t(e.name)}`); router.refresh(); }
  }
  const etapePerdu = etapes.find((e) => e.category === 'lost');

  const Carte = ({ d, e }: { d: Deal; e: Etape }) => {
    const age = joursDepuis(d.entered_at), retard = e.category === 'active' && e.target_days != null && age > e.target_days, grave = retard && age > (e.target_days ?? 0) * 1.5; /* ambre : un peu en retard; rouge : plus de 1,5 fois la cible */
    return (
      <Link href={`/ventes/deals/${d.id}`} className="deal" draggable={donnees.peut_ecrire} onDragStart={() => setGlisse(d.id)} onDragEnd={() => { setGlisse(null); setSurvol(null); }}>
        <span className="deal-l1"><strong>{d.title}</strong><b>{argent(d.monthly_value_cents, locale)}</b></span>
        <span className="deal-l2" title={d.subtitle ?? undefined}>{[d.doors ? portes(d.doors) : null, ...(d.subtitle ?? '').split(' · ').filter((x) => x && !(d.doors && x.trim().toLowerCase() === portes(d.doors)))].filter(Boolean).join(' · ')}</span>
        <span className="deal-l3">
          {d.source && <span className="puce">{t(d.source)}</span>}
          {e.category === 'won' ? <span className="puce final">{d.converted_at ? t('Onboarding lancé') : t('Signé')}</span>
            : e.category === 'lost' ? <span className="deal-etat fort">{t('Raison : {raison}', { raison: (d.loss_reason ? t(d.loss_reason) : '—').toLowerCase() })}</span>
            : retard ? <span className={`deal-etat ${grave ? 'rouge' : 'ambre'}`}><i />{t('{age} j · cible {cible} j', { age, cible: e.target_days })}</span>
            : <span className="deal-etat">{d.prochaine ?? (age ? t('{age} j dans l’étape', { age }) : t('auj.'))}</span>}
          {e.category !== 'won' && d.owner && <span className="ini" title={d.owner} style={{ width: 26, height: 26, fontSize: 11 }}>{initiales(d.owner)}</span>}
        </span>
      </Link>
    );
  };

  return (
    <>
      <div className="filtres">
        <div className="segment vue" role="tablist" aria-label={t('Vue')}>
          {([['kanban', t('Kanban'), 'columns'], ['liste', t('Liste'), 'list']] as const).map(([k, l, ic]) => (
            <button key={k} role="tab" aria-selected={vue === k} className={vue === k ? 'actif' : ''} onClick={() => setVue(k)}><Icone nom={ic} taille={20} couleur={vue === k ? '#0C2147' : '#3E4A59'} />{l}</button>))}
        </div>
        <label className="filtre"><span className="sr">{t('Responsable')}</span><select value={resp} onChange={(e) => setResp(e.target.value)}>
          <option value="">{t('Responsable : tous')}</option>{donnees.equipe.map((m) => <option key={m.id} value={m.id}>{t('Responsable : {nom}', { nom: m.nom })}</option>)}</select><Icone nom="chevD" taille={18} couleur="#3E4A59" /></label>
        <label className="filtre"><span className="sr">{t('Source')}</span><select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">{t('Source : toutes')}</option>{donnees.sources.map((s) => <option key={s.id} value={s.name}>{t('Source : {nom}', { nom: t(s.name).toLowerCase() })}</option>)}</select><Icone nom="chevD" taille={18} couleur="#3E4A59" /></label>
        <strong className="pipeline-total">{t(tot.n > 1 ? '{n} deals ouverts' : '{n} deal ouvert', { n: tot.n })} {tot.portes > 0 && <> · {portes(tot.portes)}</>} · {t('{montant} par mois', { montant: argent(tot.v, locale) })}</strong>
      </div>
      {bandeau && <div className="bandeau info" role="status">{bandeau}</div>}
      {/* Bande « Étapes du pipeline » retirée (Steven, 27 nov. 2026) : le kanban montre déjà chaque étape. */}

      {vue === 'kanban' ? (
        <div className="kanban">
          {etapes.map((e) => {
            const l = deals.filter((d) => d.stage_id === e.id), s = total(l), voir = tout.includes(e.id) ? l : l.slice(0, MAX);
            return (
              <section key={e.id} className={'colonne' + (survol === e.id ? ' survol' : '')} aria-label={t('Étape {nom}', { nom: t(e.name) })}
                onDragOver={(ev) => { if (glisse) { ev.preventDefault(); setSurvol(e.id); } }} onDragLeave={() => setSurvol(null)}
                onDrop={(ev) => { ev.preventDefault(); const d = deals.find((x) => x.id === glisse); setSurvol(null); if (d) deplacer(d, e); }}>
                <header><h2>{t(e.name)}</h2><p>{s.n}{e.category === 'won' ? ` ${t('sur 60 jours')}` : ''}{s.portes > 0 && <> · {portes(s.portes)}</>} · {argent(s.v, locale)}</p></header>
                {voir.map((d) => <Carte key={d.id} d={d} e={e} />)}
                {l.length > MAX && <button className="lien" onClick={() => setTout((x) => x.includes(e.id) ? x.filter((y) => y !== e.id) : [...x, e.id])}>
                  {tout.includes(e.id) ? t('Afficher moins') : t(l.length - MAX > 1 ? 'Afficher {n} autres deals' : 'Afficher {n} autre deal', { n: l.length - MAX })}</button>}
                {e.category === 'lost' && <p className="regle"><Icone nom="info" taille={18} couleur="#58697F" />{t('Une raison de perte est obligatoire.')}</p>}
                {!l.length && e.category !== 'lost' && <p className="colonne-vide">{t('Aucun deal.')}</p>}
              </section>
            );
          })}
        </div>
      ) : (
        <section className="studio-liste">
          <table className="tableau">
            <thead><tr><th>{t('Deal')}</th><th>{t('Étape')}</th><th className="droite">{t('Par mois')}</th><th className="droite">{t('Portes')}</th><th>{t('Source')}</th><th>{t('Responsable')}</th><th className="droite">{t('Dans l’étape')}</th></tr></thead>
            <tbody>{deals.map((d) => { const e = etapes.find((x) => x.id === d.stage_id); const age = joursDepuis(d.entered_at); return (
              <tr key={d.id} onClick={() => router.push(`/ventes/deals/${d.id}`)}>
                <td><strong className="fort">{d.title}</strong></td><td>{e ? t(e.name) : null}</td><td className="droite fort">{argent(d.monthly_value_cents, locale)}</td><td className="droite">{d.doors ?? '—'}</td>
                <td>{d.source ? t(d.source) : null}</td><td>{court(d.owner)}</td>
                <td className={'droite' + (e?.category === 'active' && e.target_days != null && age > e.target_days ? ' rouge fort' : '')}>{t('{n} j', { n: age })}</td>
              </tr>); })}</tbody>
          </table>
          {!deals.length && <p className="appro-vide">{t('Aucun deal. Créez-en un ou importez vos prospects.')}</p>}
        </section>
      )}
      {perdu && etapePerdu && <Perdu deal={perdu} etapePerdu={etapePerdu.id} etapeLue={perdu.stage_id} raisons={raisons} responsable={court(perdu.owner) || null}
        fermer={() => setPerdu(null)} fait={() => { setToast(t('{titre} marqué comme perdu.', { titre: perdu.title })); setPerdu(null); router.refresh(); }} />}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
