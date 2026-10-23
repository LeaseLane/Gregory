import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Icone } from '@/composants/Icones';
import { BarresClassees } from '@/composants/Graphes';
import { ONGLETS_IA } from './onglets';

/* Cléo et IA › Cléo (maquette e56) : ce que Cléo règle seule, pourquoi elle passe la main, ses canaux, ses sources et son ton.
   ponytail: la maquette montre des règles de passage à bascule; ces règles ne sont pas des réglages (Cléo décide, la personne reprend) :
   la carte montre les derniers passages réels à la place. Le ton vient de la consigne de Cléo (vouvoiement toujours). */
type D = { total: number; seule: number; precedent: { total: number; seule: number }; raisons: { raison: string; n: number }[];
  passages: { nom: string; resume: string | null; le: string; raison: string }[];
  canaux: { sms: number; courriel: number; voix: number; portail: number; telephone: string | null };
  sources: { articles: number; articles_le: string | null; modeles: number; modeles_le: string | null }; peut_ecrire: boolean };
const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);
const jour = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', timeZone: 'America/Toronto' }) : '—');

export default async function Page() {
  const supabase = await supabaseServeur();
  const [{ data, error }, { data: envois }] = await Promise.all([supabase.rpc('lanceur_cleo'), supabase.rpc('lanceur_envois_etat')]);
  const C = data as D | null, coupe = !!(envois as { coupe_circuit?: { active: boolean } } | null)?.coupe_circuit?.active;
  const mois = new Date(Date.now() - 30 * 864e5).toLocaleDateString('fr-CA', { month: 'long' });
  return (
    <CadreEspace icone="spark" nom="Cléo et IA" sous="Cléo, automatisations, décisions automatisées et routeur IA" actif={0} onglets={ONGLETS_IA}>
      {!C ? <div className="bandeau erreur" role="alert">{error?.code === 'PT403' ? error.message : 'Les chiffres de Cléo n’ont pas pu être lus.'}</div> : <>
        <div className="grille-2-1">
          <section className="carte-l18" aria-label="Ce que Cléo règle">
            <h2 className="titre-carte" style={{ marginBottom: 2 }}>{C.total ? `Cléo règle ${Math.round(pct(C.seule, C.total) / 10)} conversations sur 10 sans intervention` : 'Aucune conversation ces 30 derniers jours'}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 24px' }}>30 derniers jours · SMS, portails et courriel</p>
            <div className="cleo-deux">
              <div><p className="surtitre">Conversations</p><p className="cleo-gros"><b>{C.total}</b> en 30 jours</p>
                <span className="cleo-split" aria-hidden="true"><i style={{ width: `${pct(C.seule, C.total)}%` }} /><i /></span>
                <p className="ligne-entre texte-13"><b>{pct(C.seule, C.total)} % réglées sans intervention</b><span className="gris">{100 - pct(C.seule, C.total)} % passées à l’équipe</span></p>
                {C.precedent.total > 0 && <p className="gris texte-13">En {mois} : {pct(C.precedent.seule, C.precedent.total)} % réglées sans intervention</p>}</div>
              <div><p className="surtitre">Pourquoi Cléo passe la main · {C.raisons.reduce((s, r) => s + r.n, 0)}</p>
                {C.raisons.length ? <BarresClassees lignes={C.raisons.map((r) => ({ libelle: r.raison, valeur: r.n, texte: String(r.n) }))} /> : <p className="gris texte-13">Aucun passage de main ces 30 derniers jours.</p>}
                <p className="gris texte-12" style={{ marginTop: 8 }}>D’après le résumé que Cléo écrit en passant la main.</p></div>
            </div>
          </section>
          <section className="carte-l18" aria-label="Canaux"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Canaux</h2>
            <p className="gris texte-13" style={{ margin: '0 0 8px' }}>Cléo répond jour et nuit; une personne prend le relais</p>
            <ul className="lo-docs cleo-canaux">{[['phone', 'SMS', `${C.canaux.telephone ?? 'Numéro de l’entreprise'} · ${C.canaux.sms} conversation${C.canaux.sms > 1 ? 's' : ''}`],
              ['home', 'Portails', `Locataires et propriétaires · ${C.canaux.portail} conversation${C.canaux.portail > 1 ? 's' : ''}`],
              ['mail', 'Courriel', `info@leaselane.ca · ${C.canaux.courriel} conversation${C.canaux.courriel > 1 ? 's' : ''}`]].map(([ic, t, s]) =>
              <li key={t}><span className="a-faire-ic"><Icone nom={ic} taille={18} couleur="#0C2147" /></span><div><strong>{t}</strong><span className="gris texte-13">{s}</span></div>
                <span className={'interrupteur' + (coupe ? '' : ' on')} role="img" aria-label={coupe ? 'Envois suspendus' : 'Envois actifs'} /></li>)}</ul>
            {coupe && <p className="ligne-ic texte-13 rouge-txt"><Icone nom="pause" taille={16} couleur="#9B2E28" />Tous les envois sont suspendus · <Link href="/cleo-ia/automatisations">voir</Link></p>}
          </section>
        </div>
        <div className="grille-3">
          <section className="carte-l18" aria-label="Passages à une personne"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Passage à une personne</h2>
            <p className="gris texte-13" style={{ margin: '0 0 8px' }}>Cléo résume la conversation et passe la main</p>
            {C.passages.length ? <ul className="lo-docs">{C.passages.map((p, k) => <li key={k}><span className="a-faire-ic"><Icone nom={p.raison === 'Urgence' ? 'siren' : p.raison === 'Paiement' ? 'dollar' : p.raison === 'Question juridique' ? 'scale' : 'message'} taille={18} couleur="#0C2147" /></span>
              <div><strong>{p.nom}</strong><span className="gris texte-13">{p.resume ?? 'Sans résumé'}</span></div><span className="gris texte-12">{jour(p.le)}</span></li>)}</ul>
              : <p className="gris texte-13">Aucun passage de main pour l’instant.</p>}
            <Link className="lien-fleche" href="/operations/inbox">Ouvrir l’Inbox<Icone nom="arrow" taille={16} couleur="#2E5788" /></Link>
          </section>
          <section className="carte-l18" aria-label="Base de connaissance"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Base de connaissance</h2>
            <p className="gris texte-13" style={{ margin: '0 0 8px' }}>Cléo cite toujours le document qui fonde sa réponse</p>
            <ul className="lo-docs">
              <li><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>FAQ publique de Lease Lane</strong><span className="gris texte-13">Questions du site · version public-faq-v3</span></div></li>
              <li><Link href="/studio/site" className="lien-texte lo-lien"><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>Articles du site</strong><span className="gris texte-13">{C.sources.articles} article{C.sources.articles > 1 ? 's' : ''} publiés · mise à jour le {jour(C.sources.articles_le)}</span></div><Icone nom="chevron" taille={18} couleur="#58697F" /></Link></li>
              <li><Link href="/juridique" className="lien-texte lo-lien"><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><strong>Modèles juridiques</strong><span className="gris texte-13">{C.sources.modeles} modèle{C.sources.modeles > 1 ? 's' : ''} · révisés par l’avocate avant usage</span></div><Icone nom="chevron" taille={18} couleur="#58697F" /></Link></li>
            </ul>
            <Link className="bouton bouton-contour" href="/studio/site" style={{ width: 'auto', padding: '0 24px', marginTop: 16 }}><Icone nom="plus" taille={18} couleur="#0C2147" />Ajouter un document</Link>
          </section>
          <section className="carte-l18" aria-label="Ton et signature"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Ton et signature</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>Les mêmes pour tous les canaux</p>
            <div className="ligne-entre"><div><strong>Vouvoiement</strong><span className="gris texte-13" style={{ display: 'block' }}>Avec tous les clients et partenaires</span></div><span className="interrupteur on" role="img" aria-label="Toujours" /></div>
            <p className="fenetre-lib" style={{ marginTop: 16 }}>Signature</p><p className="e70-raison cleo-signature">Cléo, assistante de Lease Lane</p>
            <p className="surtitre" style={{ marginTop: 8 }}>Aperçu d’une réponse</p>
            <p className="cleo-apercu">Bonjour Madame Ménard, votre demande est bien reçue. Julie N. vous répond d’ici 16 h. — Cléo, assistante de Lease Lane</p>
          </section>
        </div>
      </>}
    </CadreEspace>
  );
}
