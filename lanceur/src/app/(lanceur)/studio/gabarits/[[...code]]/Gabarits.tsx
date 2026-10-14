'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

export type Gabarit = {
  code: string; name: string; audience: string; subject: string; sms_text: string | null; contenu: Record<string, unknown>;
  trigger_event: string | null; send_mode: 'auto' | 'after_approval' | 'manual'; active: boolean; essential: boolean;
  lcap_category: string; variables: string[]; locale: string;
};
const BASE = '/studio/gabarits';
const ENVOI: Record<Gabarit['send_mode'], string> = { auto: 'Automatique', after_approval: 'Après approbation', manual: 'Manuel' };
const theme = (g: Gabarit) => String((g.contenu as { label?: string }).label ?? 'Autre');
const quand = (g: Gabarit) => String(((g.contenu as { spec?: { when?: string } }).spec ?? {}).when ?? '');

export function Gabarits({ liste, selection, apercu, prod, erreurLecture }: {
  liste: Gabarit[]; selection: string | null; apercu: { html: string; sms: string | null } | null; prod: boolean; erreurLecture: string | null;
}) {
  const router = useRouter();
  const [type, setType] = useState<'courriels' | 'sms'>('courriels');
  const [publicCible, setPublic] = useState('');
  const [themeChoisi, setTheme] = useState('');
  const [q, setQ] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [bandeau, setBandeau] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { setBandeau(null); }, [selection]);

  const publics = useMemo(() => [...new Set(liste.map((g) => g.audience))].sort(), [liste]);
  const themes = useMemo(() => [...new Set(liste.map(theme))].sort((a, b) => a.localeCompare(b, 'fr')), [liste]);
  const nbSms = liste.filter((g) => g.sms_text).length;
  const filtres = liste.filter((g) => (type === 'courriels' || g.sms_text) && (!publicCible || g.audience === publicCible) && (!themeChoisi || theme(g) === themeChoisi)
    && (!q || `${g.code} ${g.name} ${g.trigger_event ?? ''}`.toLowerCase().includes(q.toLowerCase())));
  const g = liste.find((x) => x.code === selection) ?? null;
  const total = type === 'courriels' ? liste.length : nbSms;
  const resume = [`${filtres.length} gabarit${filtres.length > 1 ? 's' : ''} sur ${total}`, themeChoisi && `thème « ${themeChoisi} »`, publicCible && publicCible.toLowerCase(),
    `${liste.filter((x) => x.active).length} actifs, les autres attendent leurs variables`].filter(Boolean).join(' · ');

  async function tester() {
    if (!g) return;
    setEnvoi(true); setBandeau(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_envoyer_test', { p_code: g.code });
    setEnvoi(false);
    if (error) { setBandeau(error.message); return; }
    const d = data as { recipient: string };
    setToast(`Test de ${g.code} mis en file pour ${d.recipient}${prod ? '' : ' · envoi simulé en préproduction'}`);
  }

  if (erreurLecture) return <div className="bandeau erreur" role="alert">{erreurLecture} <button className="lien" onClick={() => router.refresh()}>Réessayer</button></div>;
  return (
    <>
      <div className="filtres">
        <div className="segment" role="tablist" aria-label="Type de gabarit">
          {([['courriels', 'Courriels', liste.length], ['sms', 'SMS', nbSms]] as const).map(([k, l, n]) => (
            <button key={k} role="tab" aria-selected={type === k} className={type === k ? 'actif' : ''} onClick={() => setType(k)}>{l}<span className="compte">{n}</span></button>
          ))}
        </div>
        <label className="filtre"><span className="sr">Public</span>
          <select value={publicCible} onChange={(e) => setPublic(e.target.value)}>
            <option value="">Public : tous</option>
            {publics.map((p) => <option key={p} value={p}>Public : {p.toLowerCase()}</option>)}
          </select><Icone nom="chevD" taille={18} couleur="#3E4A59" />
        </label>
        <label className="filtre"><span className="sr">Thème</span>
          <select value={themeChoisi} onChange={(e) => setTheme(e.target.value)}>
            <option value="">Thème : tous</option>
            {themes.map((t) => <option key={t} value={t}>Thème : {t.toLowerCase()}</option>)}
          </select><Icone nom="chevD" taille={18} couleur="#3E4A59" />
        </label>
        <label className="chercher"><Icone nom="search" taille={20} couleur="#58697F" />
          <input type="search" placeholder="Chercher un gabarit" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Chercher un gabarit" />
        </label>
      </div>

      <div className="studio">
        <section className="studio-liste" aria-label="Gabarits de messages">
          <header className="carte-tete studio-tete">
            <div><h2>Gabarits de messages</h2><p>{resume}</p></div>
            <span className="lien inactif" title="Les planches de la maquette restent la référence">Voir le catalogue des courriels <Icone nom="arrow" taille={18} /></span>
          </header>
          <table className="tableau">
            <thead><tr><th>Code</th><th>Nom</th><th>Public</th><th>Déclencheur</th><th>Envoi</th><th className="droite">Langues</th></tr></thead>
            <tbody>
              {filtres.map((x) => (
                <tr key={x.code} className={x.code === selection ? 'sel' : ''} onClick={() => router.push(`${BASE}/${x.code}`)}>
                  <td><Link href={`${BASE}/${x.code}`} className="fort">{x.code}</Link></td>
                  <td className="fort">{x.name}</td>
                  <td>{x.audience}</td>
                  <td>{x.trigger_event}</td>
                  <td>{x.active ? <span className={'puce' + (x.send_mode === 'auto' ? ' neutral' : '')}>{ENVOI[x.send_mode]}</span> : <span className="puce inactive" title="Exemples de la maquette à convertir en variables">À convertir</span>}</td>
                  <td className="droite gris">{x.locale.toUpperCase()}</td>
                </tr>
              ))}
              {filtres.length === 0 && <tr><td colSpan={6} className="gris">Aucun gabarit ne correspond.</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="studio-apercu" aria-label="Aperçu du gabarit">
          {g && apercu ? (
            <>
              <header className="carte-tete"><h2>{g.code} · {g.name}</h2><p>{[g.audience, ENVOI[g.send_mode].toLowerCase(), quand(g)].filter(Boolean).join(' · ')}</p></header>
              <div className="apercu-courriel">
                <div className="apercu-objet"><strong>{g.subject}</strong><span>{g.active ? 'exemple' : 'maquette'}</span></div>
                <iframe title={`Aperçu de ${g.code}`} srcDoc={apercu.html} sandbox="" />
              </div>
              <div className="apercu-sms">
                <div className="apercu-sms-tete"><Icone nom="message" taille={18} couleur="#0C2147" /><strong>Version SMS</strong>{apercu.sms && <span>{apercu.sms.length} caractères</span>}</div>
                {apercu.sms ? <p className="bulle">{apercu.sms}</p> : <p className="gris">Ce gabarit n’a pas de version SMS.</p>}
              </div>
              {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
              <div className="studio-actions">
                <button className="bouton bouton-principal" disabled title="Arrive avec sa tranche"><Icone nom="pencil" taille={20} couleur="#fff" />Modifier le gabarit</button>
                <button className="bouton bouton-contour" onClick={tester} disabled={envoi || !g.active} title={g.active ? 'Envoie ce gabarit à votre adresse, avec les valeurs d’exemple' : 'Gabarit inactif : ses exemples doivent d’abord devenir des variables'}>
                  <Icone nom="send" taille={20} />{envoi ? 'Envoi…' : 'Envoyer un test'}
                </button>
              </div>
            </>
          ) : <p className="appro-vide">Aucun gabarit.</p>}
        </section>
      </div>
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
