import { Icone } from '@/composants/Icones';

/* « Accès réservé » (maquette e65) : le cadenas, qui décide, pourquoi, comment demander, et ce qui se passe ensuite. */
export function AccesReserve({ titre, texte, raisons, courriel }: { titre: string; texte: string; raisons: [string, string, string][]; courriel: string }) {
  return (
    <main className="reserve">
      <section className="reserve-principal">
        <span className="reserve-cadenas"><Icone nom="lock" taille={36} couleur="#0C2147" /></span>
        <h1>{titre}</h1>
        <p className="reserve-texte">{texte}</p>
        <div className="reserve-raisons">
          {raisons.map(([ic, t, s]) => (
            <div key={t}><span><Icone nom={ic} taille={20} couleur="#0C2147" /></span><strong>{t}</strong><p>{s}</p></div>
          ))}
        </div>
        <a className="bouton bouton-principal reserve-bouton" href={`mailto:${courriel}?subject=${encodeURIComponent('Demande d’accès à l’espace admin Lease Lane')}`}>Demander l’accès</a>
      </section>
      <section className="reserve-cote">
        <p className="surtitre gris">Après votre demande</p>
        <p className="reserve-sous">Rien ne change sans l’accord de l’administrateur.</p>
        {[
          ['Votre demande part chez l’administrateur', 'avec le motif que vous écrivez'],
          ['Il vous ajoute à l’équipe avec un rôle, ou refuse', 'chaque rôle voit seulement ses espaces'],
          ['Vous recevez la réponse par courriel', 'à l’adresse de votre demande'],
        ].map(([t, s], i) => (
          <div className="reserve-etape" key={t}>
            <span>{i + 1}</span>
            <div><strong>{t}</strong><p>{s}</p></div>
          </div>
        ))}
      </section>
    </main>
  );
}
