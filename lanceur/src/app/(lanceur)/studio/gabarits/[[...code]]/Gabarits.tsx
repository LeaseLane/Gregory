'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { useT } from '@/composants/Langue';

export type Gabarit = {
  code: string; name: string; audience: string; subject: string; sms_text: string | null; contenu: Record<string, unknown>;
  trigger_event: string | null; send_mode: 'auto' | 'after_approval' | 'manual'; active: boolean; essential: boolean;
  lcap_category: string; variables: string[]; locale: string;
};
const BASE = '/studio/gabarits';
const ENVOI: Record<Gabarit['send_mode'], string> = { auto: 'Automatique', after_approval: 'Après approbation', manual: 'Manuel' };
const theme = (g: Gabarit) => String((g.contenu as { label?: string }).label ?? 'Autre');
const quand = (g: Gabarit) => String(((g.contenu as { spec?: { when?: string } }).spec ?? {}).when ?? '');

// Le courriel réel (600 px) réduit à la largeur de la carte, comme la miniature de la maquette.
function Miniature({ titre, html }: { titre: string; html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.6);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new ResizeObserver(([e]) => setK(e.contentRect.width / 664));
    o.observe(el); return () => o.disconnect();
  }, []);
  return <div ref={ref} className="miniature" style={{ height: 520 * k }}><iframe title={titre} srcDoc={html} sandbox="" style={{ transform: `scale(${k})` }} /></div>;
}

export function Gabarits({ liste, selection, apercu, prod, erreurLecture }: {
  liste: Gabarit[]; selection: string | null; apercu: { sujet: string; html: string; sms: string | null } | null; prod: boolean; erreurLecture: string | null;
}) {
  const router = useRouter();
  const { t } = useT();
  const [type, setType] = useState<'courriels' | 'sms'>('courriels');
  const [publicCible, setPublic] = useState('');
  const [themeChoisi, setTheme] = useState('');
  const [q, setQ] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [bandeau, setBandeau] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  useEffect(() => { if (!toast) return; const minuteur = setTimeout(() => setToast(null), 6000); return () => clearTimeout(minuteur); }, [toast]);
  useEffect(() => { setBandeau(null); }, [selection]);

  const publics = useMemo(() => [...new Set(liste.map((g) => g.audience))].sort(), [liste]);
  const themes = useMemo(() => [...new Set(liste.map(theme))].sort((a, b) => a.localeCompare(b, 'fr')), [liste]);
  const nbSms = liste.filter((g) => g.sms_text).length;
  const filtres = liste.filter((g) => (type === 'courriels' || g.sms_text) && (!publicCible || g.audience === publicCible) && (!themeChoisi || theme(g) === themeChoisi)
    && (!q || `${g.code} ${g.name} ${g.trigger_event ?? ''}`.toLowerCase().includes(q.toLowerCase())));
  const g = liste.find((x) => x.code === selection) ?? null;
  const total = type === 'courriels' ? liste.length : nbSms;
  const resume = [filtres.length > 1 ? t('{n} gabarits sur {total}', { n: filtres.length, total }) : t('{n} gabarit sur {total}', { n: filtres.length, total }), themeChoisi && t('thème « {theme} »', { theme: t(themeChoisi) }), publicCible && t(publicCible).toLowerCase(),
    t('{n} actifs, les autres attendent leurs variables', { n: liste.filter((x) => x.active).length })].filter(Boolean).join(' · ');

  async function tester() {
    if (!g) return;
    setEnvoi(true); setBandeau(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_envoyer_test', { p_code: g.code });
    setEnvoi(false);
    if (error) { setBandeau(error.message); return; }
    const d = data as { recipient: string };
    setToast(prod ? t('Test de {code} mis en file pour {dest}', { code: g.code, dest: d.recipient }) : t('Test de {code} mis en file pour {dest} · envoi simulé en préproduction', { code: g.code, dest: d.recipient }));
  }

  if (erreurLecture) return <div className="bandeau erreur" role="alert">{erreurLecture} <button className="lien" onClick={() => router.refresh()}>{t('Réessayer')}</button></div>;
  return (
    <>
      <div className="filtres">
        <div className="segment" role="tablist" aria-label={t('Type de gabarit')}>
          {([['courriels', 'Courriels', liste.length], ['sms', 'SMS', nbSms]] as const).map(([k, l, n]) => (
            <button key={k} role="tab" aria-selected={type === k} className={type === k ? 'actif' : ''} onClick={() => setType(k)}>{t(l)}<span className="compte">{n}</span></button>
          ))}
        </div>
        <label className="filtre"><span className="sr">{t('Public')}</span>
          <select value={publicCible} onChange={(e) => setPublic(e.target.value)}>
            <option value="">{t('Public : tous')}</option>
            {publics.map((p) => <option key={p} value={p}>{t('Public : {nom}', { nom: t(p).toLowerCase() })}</option>)}
          </select><Icone nom="chevD" taille={18} couleur="#3E4A59" />
        </label>
        <label className="filtre"><span className="sr">{t('Thème')}</span>
          <select value={themeChoisi} onChange={(e) => setTheme(e.target.value)}>
            <option value="">{t('Thème : tous')}</option>
            {themes.map((th) => <option key={th} value={th}>{t('Thème : {nom}', { nom: t(th).toLowerCase() })}</option>)}
          </select><Icone nom="chevD" taille={18} couleur="#3E4A59" />
        </label>
        <label className="chercher"><Icone nom="search" taille={20} couleur="#58697F" />
          <input type="search" placeholder={t('Chercher un gabarit')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('Chercher un gabarit')} />
        </label>
      </div>

      <div className="studio">
        <section className="studio-liste" aria-label={t('Gabarits de messages')}>
          <header className="carte-tete studio-tete">
            <div><h2>{t('Gabarits de messages')}</h2><p>{resume}</p></div>
            <span className="lien inactif" title={t('Les planches de la maquette restent la référence')}>{t('Voir le catalogue des courriels')} <Icone nom="arrow" taille={18} /></span>
          </header>
          <table className="tableau">
            <colgroup><col style={{ width: 88 }} /><col style={{ width: 212 }} /><col style={{ width: 116 }} /><col /><col style={{ width: 156 }} /><col style={{ width: 80 }} /></colgroup>
            <thead><tr><th>{t('Code')}</th><th>{t('Nom')}</th><th>{t('Public')}</th><th>{t('Déclencheur')}</th><th>{t('Envoi')}</th><th className="droite">{t('Langues')}</th></tr></thead>
            <tbody>
              {filtres.map((x) => (
                <tr key={x.code} className={x.code === selection ? 'sel' : ''} onClick={() => router.push(`${BASE}/${x.code}`)}>
                  <td><Link href={`${BASE}/${x.code}`} className="fort">{x.code}</Link></td>
                  <td className="fort">{t(x.name)}</td>
                  <td>{t(x.audience)}</td>
                  <td>{x.trigger_event && t(x.trigger_event)}</td>
                  <td>{x.active ? <span className={'puce' + (x.send_mode === 'auto' ? ' neutral' : '')}>{t(ENVOI[x.send_mode])}</span> : <span className="puce inactive" title={t('Exemples de la maquette à convertir en variables')}>{t('À convertir')}</span>}</td>
                  <td className="droite gris">{x.locale.toUpperCase()}</td>
                </tr>
              ))}
              {filtres.length === 0 && <tr><td colSpan={6} className="gris">{t('Aucun gabarit ne correspond.')}</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="studio-apercu" aria-label={t('Aperçu du gabarit')}>
          {g && apercu ? (
            <>
              <header className="carte-tete"><h2>{g.code} · {t(g.name)}</h2><p>{[t(g.audience), t(ENVOI[g.send_mode]).toLowerCase(), quand(g) && t(quand(g))].filter(Boolean).join(' · ')}</p></header>
              <div className="apercu-courriel">
                <div className="apercu-objet"><strong>{apercu.sujet}</strong><span>{g.active ? t('exemple') : t('maquette')}</span></div>
                <Miniature titre={t('Aperçu de {code}', { code: g.code })} html={apercu.html} />
              </div>
              <div className="apercu-sms">
                <div className="apercu-sms-tete"><Icone nom="message" taille={18} couleur="#0C2147" /><strong>{t('Version SMS')}</strong>{apercu.sms && <span>{t('{n} caractères', { n: apercu.sms.length })}</span>}</div>
                {apercu.sms ? <p className="bulle">{apercu.sms}</p> : <p className="gris">{t('Ce gabarit n’a pas de version SMS.')}</p>}
              </div>
              {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
              <div className="studio-actions">
                <button className="bouton bouton-principal" disabled title={t('Arrive avec sa tranche')}><Icone nom="pencil" taille={20} couleur="#fff" />{t('Modifier le gabarit')}</button>
                <button className="bouton bouton-contour" onClick={tester} disabled={envoi || !g.active} title={g.active ? t('Envoie ce gabarit à votre adresse, avec les valeurs d’exemple') : t('Gabarit inactif : ses exemples doivent d’abord devenir des variables')}>
                  <Icone nom="send" taille={20} />{envoi ? t('Envoi…') : t('Envoyer un test')}
                </button>
              </div>
            </>
          ) : <p className="appro-vide">{t('Aucun gabarit.')}</p>}
        </section>
      </div>
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
