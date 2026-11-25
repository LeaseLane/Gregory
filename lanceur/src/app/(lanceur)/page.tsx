import { redirect } from 'next/navigation';
import { lireAccueil, type Tuile } from '@/lib/accueil';
import { lireMoi } from '@/lib/moi';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { tServeur } from '@/lib/i18n/serveur';
import type { T } from '@/lib/i18n/langue';

/* Accueil · 10 espaces (maquette l00 : 5 × 2, état en direct, « reprendre où vous étiez », astuce ⌘K). */
function Micro({ viz }: { viz: Tuile['viz'] }) {
  if (!viz) return null;
  if (viz.type === 'meter') return <span className="jauge" aria-hidden="true"><i style={{ width: `${Math.max(6, viz.ratio * 100)}%` }} /></span>;
  return <span className="unites" aria-hidden="true">{Array.from({ length: viz.n }, (_, i) => <i key={i} className={i < viz.k ? 'rouge' : ''} />)}</span>;
}

// Un espace qui a déjà une page s'ouvre au clic; les autres restent des tuiles d'état.
function Carte({ href, label, children }: { href?: string; label: string; children: React.ReactNode }) {
  return href
    ? <Link href={href} className="espace lien-espace" aria-label={label}>{children}</Link>
    : <article className="espace" tabIndex={0} aria-label={label}>{children}</article>;
}

function Tuile_({ x, urgente, t }: { x: Tuile; urgente?: boolean; t: T }) {
  return (
    <Carte href={x.href} label={`${t(x.nom)} : ${x.valeur} ${x.libelle}`}>
      <span className="espace-ic"><Icone nom={x.icone} taille={urgente ? 24 : 20} couleur="#0C2147" /></span>
      <span className="espace-fl"><Icone nom="arrow" taille={20} couleur="#2E5788" /></span>
      <h2>{t(x.nom)}</h2>
      <p className="espace-val">{x.valeur}</p>
      <p className="espace-lib">{x.libelle}</p>
      <div className="espace-pied">
        <span className={`puce ${x.puce.ton}`}>{x.puce.texte}</span>
        <Micro viz={x.viz} />
      </div>
    </Carte>
  );
}

export default async function Accueil() {
  const { t, locale } = await tServeur();
  const moi = (await lireMoi())!;
  if (moi.role === 'prospection') redirect('/ventes/mes-prospects');   // le prospecteur arrive dans ses prospects, sans accueil
  const nom = moi.nom && !moi.nom.includes('@') ? moi.nom : '';
  const prenom = nom.split(/\s+/)[0];
  const a = await lireAccueil(moi, t, locale);
  const urgentes = a.tuiles.filter((x) => x.puce.ton === 'todo'), calmes = a.tuiles.filter((x) => x.puce.ton !== 'todo');
  const jour = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Toronto' }).format(new Date());

  return (
    <main className="accueil">
      <div className="accueil-tete">
        <div>
          <h1>{t('Bonjour')}{prenom ? `, ${prenom}` : ''}</h1>
          <p className="date">{jour.charAt(0).toUpperCase() + jour.slice(1)} · {t('choisissez un espace, ou demandez à Cléo')}</p>
        </div>
        <section className="brief" aria-label={t('Briefing de Cléo')}>
          <span className="brief-av"><img src="/img/cleo.png" alt="" /><i aria-hidden="true" /></span>
          <div>
            <p className="surtitre">{t('Briefing de Cléo')}</p>
            <p className="brief-texte">{a.briefing}</p>
          </div>
        </section>
      </div>
      {a.erreur && <p className="erreur" role="alert" style={{ marginBottom: 24 }}>{a.erreur} {t('Rechargez la page; si l’erreur revient, écrivez à l’équipe.')}</p>}

      {urgentes.length > 0 && <>
        <p className="surtitre gris">{t('À faire maintenant')}</p>
        <div className="espaces-urgents">{urgentes.map((x) => <Tuile_ key={x.nom} x={x} t={t} urgente />)}</div>
      </>}
      <p className="surtitre gris">{urgentes.length ? t('Autres espaces') : t('Vos espaces')}</p>
      <div className="espaces compact">{calmes.map((x) => <Tuile_ key={x.nom} x={x} t={t} />)}</div>

      <p className="surtitre gris">{t('Reprendre où vous étiez')}</p>
      <div className="recents-vide">
        <span className="recent-ic"><Icone nom="file" taille={20} couleur="#0C2147" /></span>
        <div>
          <strong>{t('Vos derniers dossiers apparaîtront ici.')}</strong>
          <span>{t('Dès que le journal d’activité sera en place, vous reprendrez un dossier en un clic.')}</span>
        </div>
      </div>

      <p className="astuce">
        <Icone nom="command" taille={20} couleur="#2E5788" />
        <b>{t('Astuce :')}</b>
        <kbd className="touche blanche"><Icone nom="command" taille={12} couleur="#3E4A59" trait={2} />K</kbd>
        {t('ouvre n’importe quelle page ou action, sans repasser par l’accueil. Échap revient ici.')}
      </p>
    </main>
  );
}
