import { redirect } from 'next/navigation';
import { lireAccueil, type Tuile } from '@/lib/accueil';
import { lireMoi } from '@/lib/moi';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { CellStrip, ProgressBar } from '@/composants/dataviz';
import { tServeur } from '@/lib/i18n/serveur';
import { heureQc } from '@/composants/portail/dates';
import type { T } from '@/lib/i18n/langue';

/* Accueil · 10 espaces (maquette l00 : 5 × 2, état en direct, « reprendre où vous étiez », astuce ⌘K). */
function Micro({ viz, t, en }: { viz: Tuile['viz']; t: T; en: boolean }) {
  if (!viz) return null;
  // Un ratio contre un tout : une jauge et son chiffre écrit (éditorial, 27 nov. 2026). Une file de n éléments dont k urgents : une rangée de cases (le rouge porte aussi une hachure).
  if (viz.type === 'meter') { const pc = Math.round(viz.ratio * 100); return <span className="espace-viz espace-viz-m"><ProgressBar value={Math.max(6, pc)} /><small>{pc}{en ? '%' : '\u00a0%'}</small></span>; }
  return <CellStrip className="espace-viz" size="sm" decorative label={t('À traiter')} cells={Array.from({ length: viz.n }, (_, i) => ({ id: String(i), label: i < viz.k ? t('Urgent') : t('À traiter'), state: i < viz.k ? 'bad' : 'muted' }))} />;
}

// Un espace qui a déjà une page s'ouvre au clic; les autres restent des tuiles d'état.
function Carte({ href, label, urgent, children }: { href?: string; label: string; urgent?: boolean; children: React.ReactNode }) {
  const c = `espace${urgent ? ' espace-urgent' : ''}`;
  return href
    ? <Link href={href} className={`${c} lien-espace`} aria-label={label}>{children}</Link>
    : <article className={c} tabIndex={0} aria-label={label}>{children}</article>;
}

function Tuile_({ x, urgente, t, en }: { x: Tuile; urgente?: boolean; t: T; en: boolean }) {
  return (
    <Carte href={x.href} urgent={x.puce.ton === 'todo'} label={`${t(x.nom)} : ${x.valeur} ${x.libelle}`}>
      <span className="espace-ic"><Icone nom={x.icone} taille={urgente ? 24 : 20} couleur="#0C2147" /></span>
      <span className="espace-fl"><Icone nom="arrow" taille={20} couleur="#2E5788" /></span>
      <h2>{t(x.nom)}</h2>
      <p className="espace-val">{x.valeur}</p>
      <p className="espace-lib">{x.libelle}</p>
      <div className="espace-pied">
        <span className={`puce ${x.puce.ton}`}>{x.puce.texte}</span>
        <Micro viz={x.viz} t={t} en={en} />
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
  // Rangée du haut : les espaces urgents, puis Ventes (Steven, 27 nov. 2026 : 4 tuiles en haut). Une tuile masquée faute de droit reste absente (a.tuiles est déjà filtré).
  const enHaut = (x: Tuile) => x.puce.ton === 'todo' || x.nom === 'Ventes';
  const urgentes = [...a.tuiles.filter((x) => x.puce.ton === 'todo'), ...a.tuiles.filter((x) => x.nom === 'Ventes' && x.puce.ton !== 'todo')], calmes = a.tuiles.filter((x) => !enHaut(x));
  const en = locale.startsWith('en');
  const maintenant = new Date();
  const jour = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Toronto' }).format(maintenant);
  const heure = heureQc(maintenant.toISOString(), locale).replace(/ h 00$/, ' h');   // « 10 h », « 10 h 30 »

  return (
    <main className="accueil">
      <div className="accueil-tete">
        <div>
          <h1>{t('Bonjour')}{prenom ? ` ${prenom}` : ''}.</h1>{/* « Bonjour Camille. » sans virgule (Steven, 27 nov. 2026) */}
          <p className="date">{jour.charAt(0).toUpperCase() + jour.slice(1)} · {heure}</p>{/* la date et l'heure seulement (Steven) */}
        </div>
        <section className="brief" aria-label={t('Briefing de Cléo')}>
          <span className="brief-av"><img src="/img/cleo.png" alt="" /><i aria-hidden="true" /></span>
          <div>
            <p className="surtitre brief-titre">{t('Briefing de Cléo')}</p>
            <p className="brief-texte">{a.briefing}</p>
          </div>
        </section>
      </div>
      {a.erreur && <p className="erreur" role="alert" style={{ marginBottom: 24 }}>{a.erreur} {t('Rechargez la page; si l’erreur revient, écrivez à l’équipe.')}</p>}

      {urgentes.length > 0 && <>
        <h2 className="accueil-section">{t('À faire maintenant')}</h2>
        <div className="espaces-urgents" style={{ '--n': Math.min(4, urgentes.length) } as React.CSSProperties}>{urgentes.map((x) => <Tuile_ key={x.nom} x={x} t={t} en={en} urgente />)}</div>
      </>}
      {/* Plus de titre « Autres espaces » (Steven, 27 nov. 2026) : l'écart entre les deux rangées suffit à les séparer. */}
      {!urgentes.length && <h2 className="accueil-section">{t('Vos espaces')}</h2>}
      <div className="espaces compact espaces-suite">{calmes.map((x) => <Tuile_ key={x.nom} x={x} t={t} en={en} />)}</div>

      <h2 className="accueil-section">{t('Reprendre où vous étiez')}</h2>
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
