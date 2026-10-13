import { supabaseServeur } from '@/lib/supabase/serveur';
import { lireAccueil, type Tuile } from '@/lib/accueil';
import { Icone } from '@/composants/Icones';

/* Accueil · 10 espaces (maquette l00 : 5 × 2, état en direct, « reprendre où vous étiez », astuce ⌘K). */
function Micro({ viz }: { viz: Tuile['viz'] }) {
  if (!viz) return null;
  if (viz.type === 'meter') return <span className="jauge" aria-hidden="true"><i style={{ width: `${Math.max(6, viz.ratio * 100)}%` }} /></span>;
  return <span className="unites" aria-hidden="true">{Array.from({ length: viz.n }, (_, i) => <i key={i} className={i < viz.k ? 'rouge' : ''} />)}</span>;
}

export default async function Accueil() {
  const supabase = await supabaseServeur();
  const { data } = await supabase.auth.getUser();
  const prenom = String(data.user?.user_metadata?.full_name ?? '').trim().split(/\s+/)[0];
  const a = await lireAccueil();
  const jour = new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Toronto' }).format(new Date());

  return (
    <main className="accueil">
      <div className="accueil-tete">
        <div>
          <h1>Bonjour{prenom ? `, ${prenom}` : ''}</h1>
          <p className="date">{jour.charAt(0).toUpperCase() + jour.slice(1)} · choisissez un espace, ou demandez à Cléo</p>
        </div>
        <section className="brief" aria-label="Briefing de Cléo">
          <span className="brief-av"><img src="/img/cleo.png" alt="" /><i aria-hidden="true" /></span>
          <div>
            <p className="surtitre">Briefing de Cléo</p>
            <p className="brief-texte">{a.briefing}</p>
          </div>
        </section>
      </div>
      {a.erreur && <p className="erreur" role="alert" style={{ marginBottom: 24 }}>{a.erreur} Rechargez la page; si l’erreur revient, écrivez à l’équipe.</p>}

      <p className="surtitre gris">Vos espaces</p>
      <div className="espaces">
        {a.tuiles.map((t) => (
          <article key={t.nom} className="espace" tabIndex={0} aria-label={`${t.nom} : ${t.valeur} ${t.libelle}`}>
            <span className="espace-ic"><Icone nom={t.icone} taille={24} couleur="#0C2147" /></span>
            <span className="espace-fl"><Icone nom="arrow" taille={20} couleur="#2E5788" /></span>
            <h2>{t.nom}</h2>
            <p className="espace-val">{t.valeur}</p>
            <p className="espace-lib">{t.libelle}</p>
            <div className="espace-pied">
              <span className={`puce ${t.puce.ton}`}>{t.puce.texte}</span>
              <Micro viz={t.viz} />
            </div>
          </article>
        ))}
      </div>

      <p className="surtitre gris">Reprendre où vous étiez</p>
      <div className="recents-vide">
        <span className="recent-ic"><Icone nom="file" taille={20} couleur="#0C2147" /></span>
        <div>
          <strong>Vos derniers dossiers apparaîtront ici.</strong>
          <span>Dès que le journal d’activité sera en place, vous reprendrez un dossier en un clic.</span>
        </div>
      </div>

      <p className="astuce">
        <Icone nom="command" taille={20} couleur="#2E5788" />
        <b>Astuce :</b>
        <kbd className="touche blanche"><Icone nom="command" taille={12} couleur="#3E4A59" trait={2} />K</kbd>
        ouvre n’importe quelle page ou action, sans repasser par l’accueil. Échap revient ici.
      </p>
    </main>
  );
}
