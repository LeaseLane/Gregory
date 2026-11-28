import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Icone } from '@/composants/Icones';
import { BarresClassees } from '@/composants/Graphes';
import { ONGLETS_IA } from './onglets';
import { tServeur } from '@/lib/i18n/serveur';

/* Cléo et IA › Cléo (maquette e56) : ce que Cléo règle seule, pourquoi elle passe la main, ses canaux, ses sources et son ton.
   ponytail: la maquette montre des règles de passage à bascule; ces règles ne sont pas des réglages (Cléo décide, la personne reprend) :
   la carte montre les derniers passages réels à la place. Le ton vient de la consigne de Cléo (vouvoiement toujours). */
type D = { total: number; seule: number; precedent: { total: number; seule: number }; raisons: { raison: string; n: number }[];
  passages: { nom: string; resume: string | null; le: string; raison: string }[];
  canaux: { sms: number; courriel: number; voix: number; portail: number; telephone: string | null };
  sources: { articles: number; articles_le: string | null; modeles: number; modeles_le: string | null }; peut_ecrire: boolean };
const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);
const jour = (iso: string | null, locale: string) => (iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'America/Toronto' }) : '—');

export default async function Page() {
  const { t, locale } = await tServeur();
  const nc = (n: number) => (locale.startsWith('en') ? n !== 1 : n > 1) ? t('{n} conversations', { n }) : t('{n} conversation', { n });
  const plur = (n: number) => (locale.startsWith('en') ? n !== 1 : n > 1);
  const supabase = await supabaseServeur();
  const [{ data, error }, { data: envois }] = await Promise.all([supabase.rpc('lanceur_cleo'), supabase.rpc('lanceur_envois_etat')]);
  const C = data as D | null, coupe = !!(envois as { coupe_circuit?: { active: boolean } } | null)?.coupe_circuit?.active;
  const mois = new Date(Date.now() - 30 * 864e5).toLocaleDateString(locale, { month: 'long' });
  return (
    <CadreEspace icone="spark" nom="Cléo et IA" sous="Cléo, automatisations, décisions automatisées et routeur IA" actif={0} onglets={ONGLETS_IA}>
      {!C ? <div className="bandeau erreur" role="alert">{error?.code === 'PT403' ? error.message : t('Les chiffres de Cléo n’ont pas pu être lus.')}</div> : <>
        <div className="grille-2-1">
          <section className="carte-l18" aria-label={t('Ce que Cléo règle')}>
            <h2 className="titre-carte" style={{ marginBottom: 2 }}>{C.total ? t('Cléo règle {n} conversations sur 10 sans intervention', { n: Math.round(pct(C.seule, C.total) / 10) }) : t('Aucune conversation ces 30 derniers jours')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 24px' }}>{t('30 derniers jours · SMS, portails et courriel')}</p>
            <div className="cleo-deux">
              <div><p className="surtitre">{t('Conversations')}</p><p className="cleo-gros"><b>{C.total}</b> {t('en 30 jours')}</p>
                <span className="dg-sur10" aria-hidden="true">{Array.from({ length: 10 }, (_, k) => <i key={k} className={k < Math.round(pct(C.seule, C.total) / 10) ? 'on' : ''} />)}</span>
                <p className="ligne-entre texte-13"><b>{t('{n} % réglées sans intervention', { n: pct(C.seule, C.total) })}</b><span className="gris">{t('{n} % passées à l’équipe', { n: 100 - pct(C.seule, C.total) })}</span></p>
                {C.precedent.total > 0 && <p className="gris texte-13">{t('En {mois} : {n} % réglées sans intervention', { mois, n: pct(C.precedent.seule, C.precedent.total) })}</p>}</div>
              <div><p className="surtitre">{t('Pourquoi Cléo passe la main')} · {C.raisons.reduce((s, r) => s + r.n, 0)}</p>
                {C.raisons.length ? <BarresClassees lignes={C.raisons.map((r) => ({ libelle: t(r.raison), valeur: r.n, texte: String(r.n) }))} /> : <p className="gris texte-13">{t('Aucun passage de main ces 30 derniers jours.')}</p>}
                <p className="gris texte-12" style={{ marginTop: 8 }}>{t('D’après le résumé que Cléo écrit en passant la main.')}</p></div>
            </div>
          </section>
          <section className="carte-l18" aria-label={t('Canaux')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Canaux')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 8px' }}>{t('Cléo répond jour et nuit; une personne prend le relais')}</p>
            <ul className="lo-docs cleo-canaux">{[['phone', 'SMS', `${C.canaux.telephone ?? t('Numéro de l’entreprise')} · ${nc(C.canaux.sms)}`],
              ['home', t('Portails'), `${t('Locataires et propriétaires')} · ${nc(C.canaux.portail)}`],
              ['mail', t('Courriel'), `info@leaselane.ca · ${nc(C.canaux.courriel)}`]].map(([ic, ti, s]) =>
              <li key={ti}><span className="a-faire-ic"><Icone nom={ic} taille={18} couleur="#0C2147" /></span><div><strong>{ti}</strong><span className="gris texte-13">{s}</span></div>
                <span className={'dg-etat' + (coupe ? ' off' : '')} title={coupe ? t('Envois suspendus') : t('Envois actifs')}><i aria-hidden="true" />{coupe ? t('Suspendu') : t('Actif')}</span></li>)}</ul>
            {coupe && <p className="ligne-ic texte-13 rouge-txt"><Icone nom="pause" taille={16} couleur="#9B2E28" />{t('Tous les envois sont suspendus')} · <Link href="/cleo-ia/automatisations">{t('voir')}</Link></p>}
          </section>
        </div>
        <div className="grille-3">
          <section className="carte-l18" aria-label={t('Passages à une personne')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Passage à une personne')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 8px' }}>{t('Cléo résume la conversation et passe la main')}</p>
            {C.passages.length ? <ul className="lo-docs">{C.passages.map((p, k) => <li key={k}><span className="a-faire-ic"><Icone nom={p.raison === 'Urgence' ? 'siren' : p.raison === 'Paiement' ? 'dollar' : p.raison === 'Question juridique' ? 'scale' : 'message'} taille={18} couleur="#0C2147" /></span>
              <div><strong>{p.nom}</strong><span className="gris texte-13">{p.resume ?? t('Sans résumé')}</span></div><span className="gris texte-12">{jour(p.le, locale)}</span></li>)}</ul>
              : <p className="gris texte-13">{t('Aucun passage de main pour l’instant.')}</p>}
            <Link className="lien-fleche" href="/operations/inbox">{t('Ouvrir l’Inbox')}<Icone nom="arrow" taille={16} couleur="#2E5788" /></Link>
          </section>
          <section className="carte-l18" aria-label={t('Base de connaissance')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Base de connaissance')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 8px' }}>{t('Cléo cite toujours le document qui fonde sa réponse')}</p>
            <ul className="lo-docs">
              <li><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>{t('FAQ publique de Lease Lane')}</strong><span className="gris texte-13">{t('Questions du site · version public-faq-v3')}</span></div></li>
              <li><Link href="/studio/site" className="lien-texte lo-lien"><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>{t('Articles du site')}</strong><span className="gris texte-13">{plur(C.sources.articles) ? t('{n} articles publiés · mise à jour le {date}', { n: C.sources.articles, date: jour(C.sources.articles_le, locale) }) : t('{n} article publié · mise à jour le {date}', { n: C.sources.articles, date: jour(C.sources.articles_le, locale) })}</span></div><Icone nom="chevron" taille={18} couleur="#58697F" /></Link></li>
              <li><Link href="/juridique" className="lien-texte lo-lien"><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>{t('Modèles juridiques')}</strong><span className="gris texte-13">{plur(C.sources.modeles) ? t('{n} modèles · révisés par l’avocate avant usage', { n: C.sources.modeles }) : t('{n} modèle · révisés par l’avocate avant usage', { n: C.sources.modeles })}</span></div><Icone nom="chevron" taille={18} couleur="#58697F" /></Link></li>
            </ul>
            <Link className="bouton bouton-contour" href="/studio/site" style={{ width: 'auto', padding: '0 24px', marginTop: 16 }}><Icone nom="plus" taille={18} couleur="#0C2147" />{t('Ajouter un document')}</Link>
          </section>
          <section className="carte-l18" aria-label={t('Ton et signature')}><h2 className="titre-carte" style={{ marginBottom: 2 }}>{t('Ton et signature')}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>{t('Les mêmes pour tous les canaux')}</p>
            <div className="ligne-entre"><div><strong>{t('Vouvoiement')}</strong><span className="gris texte-13" style={{ display: 'block' }}>{t('Avec tous les clients et partenaires')}</span></div><span className="dg-etat neutre"><i aria-hidden="true" />{t('Toujours')}</span></div>
            <p className="fenetre-lib" style={{ marginTop: 16 }}>{t('Signature')}</p><p className="e70-raison cleo-signature">{t('Cléo, assistante de Lease Lane')}</p>
            <p className="surtitre" style={{ marginTop: 8 }}>{t('Aperçu d’une réponse')}</p>
            <p className="cleo-apercu">{t('Bonjour Madame Ménard, votre demande est bien reçue. Julie N. vous répond d’ici 16 h. — Cléo, assistante de Lease Lane')}</p>
          </section>
        </div>
      </>}
    </CadreEspace>
  );
}
