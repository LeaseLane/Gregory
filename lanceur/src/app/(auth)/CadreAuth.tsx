/* Cadre des écrans de connexion (maquette PHASE 2/connexion-finale/connexion-admin.png). */
const SITE = 'https://leaselane.ca';

export function CadreAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-panneau" aria-hidden="false">
        <img className="auth-logo" src="/img/logo-sur-marine.svg" alt="Lease Lane" />
        <h1 className="auth-titre">Espace <span>admin</span></h1>
        <p className="auth-slogan"><span>Une <b>clé</b> d’avance et ce, en <b>permanence</b>.</span></p>
        <img className="couverture" src="/img/couverture-immeubles.png" alt="" />
        <nav className="auth-pied" aria-label="Liens">
          <a href={SITE}>‹‹ Retour à l’accueil</a>
          <a href={`${SITE}/conditions-utilisation`}>Conditions d’utilisation</a>
          <a href={`${SITE}/confidentialite`}>Politique de confidentialité</a>
          <a href={`${SITE}/temoins`}>Témoins de navigation</a>
        </nav>
      </aside>
      <main className="auth-droite">
        {children}
        <div className="auth-gouvernance">
          <strong>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
            Gouvernance des renseignements personnels
          </strong>
          <div>Cléo, l’assistante virtuelle de Lease Lane, est un système d’intelligence artificielle. Certaines demandes sont classées automatiquement ; une personne peut toujours réviser la décision.</div>
        </div>
      </main>
    </div>
  );
}
