/* Cadre des écrans de connexion : maquette PHASE 2/connexion-finale (auth.jsx + connexion-admin.png).
   Panneau : couches de la maquette (filtre bleu h7-duo, halo, immeubles coupés à l'horizon, reflet,
   bande d'horizon, sol à chevrons), mesurées sur connexion-admin.png à 1440 × 900 et posées en statique. */
const SITE = 'https://leaselane.ca';
const IM = '/img/couverture-immeubles.png';

// Grille de fond en perspective (GrilleFond de la maquette).
const GRILLE_V = Array.from({ length: 41 }, (_, k) => (k - 20) * 90);
const GRILLE_H = Array.from({ length: 22 }, (_, k) => 600 / (1 + k * 0.32));

function Ville() {
  return (
    <div className="ville" aria-hidden="true">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="h7-duo" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feConvolveMatrix in="SourceGraphic" order="3" kernelMatrix="0 -0.9 0 -0.9 4.6 -0.9 0 -0.9 0" preserveAlpha="true" edgeMode="duplicate" result="net" />
            <feConvolveMatrix in="SourceGraphic" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" edgeMode="duplicate" result="bords" />
            <feComposite in="net" in2="bords" operator="arithmetic" k1="0" k2="1" k3=".22" k4="0" />
            <feColorMatrix type="matrix" values=".1169 .3934 .0397 0 .0971 .1169 .3934 .0397 0 .1818 .1169 .3934 .0397 0 .2859 0 0 0 1 0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.18" intercept="-.05" />
              <feFuncG type="linear" slope="1.18" intercept="-.05" />
              <feFuncB type="linear" slope="1.18" intercept="-.05" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <div className="ville-halo" />
      <img className="ville-im" src={IM} alt="" />
      <div className="ville-ombre" />
      <div className="ville-reflet"><img src={IM} alt="" /></div>
      <div className="ville-horizon">
        <i className="h-bande" /><i className="h-lueur" /><i className="h-trait" /><i className="h-bleu" />
      </div>
      <svg className="ville-sol" viewBox="0 0 672 220" preserveAspectRatio="none">
        <g stroke="rgba(160,190,230,.09)" strokeWidth="1" fill="none">
          {[-900, -600, -380, -220, -100, 0, 100, 220, 380, 600, 900].map((dx) => (
            <line key={dx} x1={330 + dx * 0.04} y1="0" x2={330 + dx} y2="220" />
          ))}
        </g>
        <g stroke="rgba(160,190,230,.20)" strokeWidth="2" fill="none" strokeLinejoin="miter">
          {[
            [70, 0.8], [190, 0.9], [330, 1], [470, 0.9], [590, 0.8],
            [130, 1.25], [330, 1.4], [530, 1.25],
          ].map(([x, k], i) => {
            const y = k > 1.1 ? 150 : 95;
            const w = 34 * k;
            return <path key={i} d={`M${x - w} ${y + w * 0.55} L${x} ${y} L${x + w} ${y + w * 0.55}`} />;
          })}
        </g>
      </svg>
    </div>
  );
}

export function CadreAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-panneau">
        <div className="auth-cadre" aria-hidden="true" />
        <Ville />
        <div className="auth-haut">
          <img className="auth-logo" src="/img/logo-sur-marine.svg" alt="Lease Lane" />
          <h1 className="auth-titre">Espace <span>admin</span></h1>
          <p className="auth-slogan"><span>Une <b>clé</b> d’avance et ce, en <b>permanence</b>.</span></p>
        </div>
        <nav className="auth-pied" aria-label="Information légale">
          <a href={SITE}><svg aria-hidden="true" className="chev" viewBox="0 0 16 9" fill="none" stroke="#91B5E0" strokeWidth="1.3"><path d="M4 1 1 4.5 4 8M9 1 6 4.5 9 8M14 1l-3 3.5 3 3.5" /></svg>Retour à l’accueil</a>
          <a href={`${SITE}/conditions-utilisation`}>Conditions d’utilisation</a>
          <a href={`${SITE}/confidentialite`}>Politique de confidentialité</a>
          <a href={`${SITE}/temoins`}>Témoins de navigation</a>
        </nav>
      </aside>
      <main className="auth-droite">
        <div className="grille-fond" aria-hidden="true">
          <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
            <g stroke="rgba(46,87,136,.2)" strokeWidth="1" fill="none">
              {GRILLE_V.map((dx) => <line key={'v' + dx} x1={500 + dx * 0.06} y1="0" x2={500 + dx} y2="600" vectorEffect="non-scaling-stroke" />)}
              {GRILLE_H.map((y) => <line key={'h' + y} x1="-2000" y1={y} x2="3000" y2={y} vectorEffect="non-scaling-stroke" />)}
            </g>
          </svg>
        </div>
        <div className="auth-colonne">
          {children}
          <a className="auth-gouv" href={`${SITE}/gouvernance`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3767A2" strokeWidth="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
            Gouvernance des renseignements personnels
          </a>
          <p className="auth-ia">Cléo, l’assistante virtuelle de Lease Lane, est un système d’intelligence artificielle. Certaines demandes sont classées automatiquement ; une personne peut toujours réviser la décision.</p>
        </div>
      </main>
    </div>
  );
}
