'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ProgressBar, StepChart, useWidth } from '@/composants/dataviz';
import { useT } from '@/composants/Langue';
import type { VueAccueil } from './AccueilCommun';
import { CHOIX_VUE_INDICATEURS, VUE_INDICATEURS, ChoixVue, useVue } from './AccueilVues';

/* « Mes indicateurs » + graphique « Mon loyer depuis … » : une seule carte, trois présentations à l'essai (TEMPORAIRE, voir AccueilVues.tsx).
   A « Une carte, une rangée » : 4 chiffres en rangée (avec mini-jauge / rangée de cases), puis l'escalier du loyer (≈ 160 px).
   B « Graphique en tête » : l'escalier du loyer en vedette (≈ 220 px), les 4 chiffres en légende sur une ligne dessous.
   C « Deux colonnes » : les 4 chiffres en liste à gauche, l'escalier à droite (se replie en une colonne sur écran étroit).
   Mêmes textes et mêmes données que l'ancien Stats / GrapheLoyer (AccueilCommun.tsx). La mise en page suit la largeur de la carte (@container ind). */

type Fig = { id: string; label: string; val: string; sous: string; sous2?: string; micro: ReactNode; sw?: string };

const REPONSE_REPERE_MIN = 60;   // PROVISOIRE : repère de la barre « Délai de réponse » (aucune promesse de réponse dans les données)
function figures(v: VueAccueil): Fig[] {
  const s = v.stats, { t } = v;
  return [
    { id: 'paye', label: t('Payé en {annee}', { annee: s.annee }), val: s.paye, sous: s.payeSous,  sw: 'var(--dv-s7)',   // = le marine de la ligne du loyer (accent unique du bloc)
      micro: <ProgressBar value={s.paye$} max={s.prevu$} label={t('Payé en {annee}', { annee: s.annee })} valueText={`${s.paye} / ${s.prevu}`} size="sm" /> },
    { id: 'ponct', label: t('Ponctualité'), val: s.ponctN, sous: t('Loyers payés à temps'), sw: 'var(--dv-good)',
      micro: (() => { const ok = s.ponct.filter(Boolean).length, total = s.ponct.length || 12;   // même barre linéaire que « Payé » et « Demandes réglées »
        return <ProgressBar value={ok} max={total} tone="good" label={t('Ponctualité')} valueText={`${ok} / ${total}`} size="sm" />; })() },
    { id: 'reponse', label: t('Délai de réponse'), val: s.reponse, sous: t('Réponse de l’équipe'),   // repère de 1 h PROVISOIRE (à remplacer par la promesse de réponse de l'équipe, à confirmer par Steven)
      micro: s.reponseMin == null ? null : <ProgressBar value={Math.min(s.reponseMin, REPONSE_REPERE_MIN)} max={REPONSE_REPERE_MIN} tone="good" label={t('Délai de réponse')} valueText={`${s.reponse} / 1 h`} size="sm" /> },
    { id: 'reglees', label: t('Demandes réglées'), val: s.reglees, sous: t('en moyenne · promesse 48 h'),
      micro: s.regleesPct == null ? null : <ProgressBar value={s.regleesPct} max={100} tone="good" label={t('Demandes réglées')} valueText={`${s.reglees} / 48 h`} size="sm" /> },
  ];
}

/* Loyer en marches depuis le premier bail : la ligne marine (accent unique du bloc), le marché en repère gris étiqueté, « Aujourd’hui » en repère vertical.
   Chaque hausse est annotée sur sa marche (« +40 $ · +2,9 % »), calculée à partir des loyers eux-mêmes; au téléphone, le montant seul. */
function Escalier({ v, h, court }: { v: VueAccueil; h: number; court?: boolean }) {
  const { D, t } = v, bail = D.bail, { locale } = useT();
  const pct = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1, signDisplay: 'always' });
  const notes = D.loyers.map((l, i) => {
    const avant = i > 0 ? D.loyers[i - 1].loyer : null; if (avant == null || avant === l.loyer) return null;
    const d = l.loyer - avant, signe = d > 0 ? '+' : '−', mt = `${signe}${v.argent(Math.abs(d))}`;
    return court || !avant ? mt : `${mt} · ${pct.format(d / avant).replace(/[\u00a0\u202f]/g, ' ')}`;
  });
  return (
    <StepChart
      labels={D.loyers.map((l) => String(new Date(l.debut).getFullYear()))} titles={D.loyers.map((l) => v.jourLong(l.debut))}
      xs={D.loyers.map((l) => new Date(l.debut).getTime())} xEnd={bail?.fin ? new Date(bail.fin).getTime() : v.maintenant + 180 * 864e5}
      series={[{ id: 'loyer', name: t('Loyer'), values: D.loyers.map((l) => l.loyer) }]} format={(n) => v.argent(n)}
      target={D.marche ? { value: D.marche, label: t('Marché') } : undefined} marks={[{ x: v.maintenant, label: t('Aujourd’hui') }]}
      annotations={notes} ticks={3} targetLabel={court ? 'below' : 'auto'} className="ind-escalier"
      label={t('Loyer comparé au marché')} height={h} tableColumn={t('Loyer')} />
  );
}

/* Tête du bloc : titre + logement à gauche; à droite, les deux faits clés en grands chiffres (loyer actuel, écart au marché). */
function GrapheTete({ v }: { v: VueAccueil }) {
  const { D, t } = v, bail = D.bail, sous = !!(D.marche && bail && bail.loyer <= D.marche);
  return (
    <div className="ind-gtete">
      <div className="ind-gt-titre">
        <h3 className="titre-carte">{t('Mon loyer depuis {annee}', { annee: new Date(D.loyers[0].debut).getFullYear() })}</h3>
        <p className="gris texte-13">{D.logement ?? (D.marche ? t('Comparé au marché') : t('Historique de vos baux'))}</p>
      </div>
      {bail && <dl className="ind-gt-chiffres">
        <div className="ind-gt-fig"><dt>{t('Loyer actuel')}</dt><dd><b className="acc-val ind-val ind-gt-val">{v.argent(bail.loyer)}</b><span>{t('/ mois')}</span></dd></div>
        {D.marche ? <div className="ind-gt-fig"><dt>{sous ? t('Sous le marché') : t('Au-dessus du marché')}</dt><dd><b className="acc-val ind-val ind-gt-val">{v.argent(Math.abs(D.marche - bail.loyer))}</b><span>{t('/ mois · marché {marche}', { marche: v.argent(D.marche) })}</span></dd></div> : null}
      </dl>}
    </div>
  );
}

export function Indicateurs({ v }: { v: VueAccueil }) {
  const { t } = useT(), [vueLue, choisir] = useVue('ll-indicateurs-vue', VUE_INDICATEURS), [ref, w] = useWidth<HTMLElement>();
  const vue = CHOIX_VUE_INDICATEURS ? vueLue : VUE_INDICATEURS;   // vue A retenue : un ancien choix gardé dans le navigateur n'est plus lu
  const listeRef = useRef<HTMLDListElement>(null), [hl, setHl] = useState(0);
  useEffect(() => {
    const e = listeRef.current; if (!e) return;
    const ro = new ResizeObserver(() => setHl(Math.round(e.getBoundingClientRect().height))); ro.observe(e); setHl(Math.round(e.getBoundingClientRect().height));
    return () => ro.disconnect();
  }, [vue]);
  const figs = figures(v), avecGraphe = v.D.loyers.length > 0, etroit = w > 0 && w < 600;
  const noms = { a: t('Une carte, une rangée'), b: t('Graphique en tête'), c: t('Deux colonnes') };
  const tete = (
    <div className="ind-tete">
      <div className="acc-section-tete"><h2 id="acc-ind-t">{t('Mes indicateurs')}</h2><p>{t('Vos chiffres clés, mis à jour chaque jour')}</p></div>
      {CHOIX_VUE_INDICATEURS && <ChoixVue vue={vue} choisir={choisir} noms={noms} classe="ind-choix" />}
    </div>
  );

  return (
    <section ref={ref} className={`carte-l18 acc-surface ind ind-${vue}`} aria-labelledby="acc-ind-t">
      {tete}
      {vue === 'a' && <>
        <dl className="ind-a-rang">
          {figs.map((f) => (
            <div key={f.id} className="ind-fig">
              <dt>{f.label}</dt>
              <dd className="acc-val ind-val">{f.val}</dd>
              <dd className="acc-sous">{f.sous}</dd>
              {f.micro && <dd className={`ind-micro ind-micro-${f.id}`}>{f.micro}</dd>}
              {f.sous2 && <dd className="acc-sous">{f.sous2}</dd>}
            </div>
          ))}
        </dl>
        {/* graphique « Mon loyer depuis 2024 » retiré de la vue A (Steven, 27 nov. 2026 : « delete » sur l'en-tête puis sur le graphique) */}
      </>}

      {vue === 'b' && <>
        {avecGraphe && <div className="ind-graphe ind-graphe-b"><GrapheTete v={v} /><Escalier v={v} h={etroit ? 176 : 220} court={etroit} /></div>}
        <dl className="ind-b-legende">
          {figs.map((f) => (
            <div key={f.id} className="ind-leg">
              <dt>{f.label}</dt>
              <dd className="ind-leg-val">{f.sw ? <i className="ind-sw" style={{ background: f.sw }} aria-hidden="true" /> : null}<b className="acc-val ind-val">{f.val}</b></dd>
              <dd className="acc-sous">{f.sous2 ? `${f.sous} · ${f.sous2}` : f.sous}</dd>
            </div>
          ))}
        </dl>
      </>}

      {vue === 'c' && (
        <div className={`ind-c-corps${avecGraphe ? '' : ' ind-c-seul'}`}>
          <dl ref={listeRef} className="ind-c-liste">
            {figs.map((f) => (
              <div key={f.id} className="ind-c-ligne">
                <dt>{f.label}</dt>
                <dd className="acc-val ind-val">{f.val}</dd>
                {f.micro && <dd className={`ind-micro ind-micro-${f.id}`}>{f.micro}</dd>}
                <dd className="acc-sous">{f.sous2 ? `${f.sous} · ${f.sous2}` : f.sous}</dd>
              </div>
            ))}
          </dl>
          {avecGraphe && <div className="ind-graphe ind-c-graphe"><GrapheTete v={v} /><Escalier v={v} h={w > 0 && w < 700 ? 170 : Math.min(360, Math.max(190, hl - 58))} /></div>}
        </div>
      )}
    </section>
  );
}
