import { Icone } from '@/composants/Icones';
import { tServeur } from '@/lib/i18n/serveur';

/* « Accès réservé » (maquette e65) : le cadenas, qui décide, pourquoi, comment demander, et ce qui se passe ensuite. */
export async function AccesReserve({ titre, texte, raisons, courriel }: { titre: string; texte: string; raisons: [string, string, string][]; courriel: string }) {
  const { t } = await tServeur();
  return (
    <main className="reserve">
      <section className="reserve-principal">
        <span className="reserve-cadenas"><Icone nom="lock" taille={36} couleur="#0C2147" /></span>
        <h1>{titre}</h1>
        <p className="reserve-texte">{texte}</p>
        <div className="reserve-raisons">
          {raisons.map(([ic, ti, s]) => (
            <div key={ti}><span><Icone nom={ic} taille={20} couleur="#0C2147" /></span><strong>{ti}</strong><p>{s}</p></div>
          ))}
        </div>
        <a className="bouton bouton-principal reserve-bouton" href={`mailto:${courriel}?subject=${encodeURIComponent(t('Demande d’accès à l’espace admin Lease Lane'))}`}>{t('Demander l’accès')}</a>
      </section>
      <section className="reserve-cote">
        <p className="surtitre gris">{t('Après votre demande')}</p>
        <p className="reserve-sous">{t('Rien ne change sans l’accord de l’administrateur.')}</p>
        {[
          [t('Votre demande part chez l’administrateur'), t('avec le motif que vous écrivez')],
          [t('Il vous ajoute à l’équipe avec un rôle, ou refuse'), t('chaque rôle voit seulement ses espaces')],
          [t('Vous recevez la réponse par courriel'), t('à l’adresse de votre demande')],
        ].map(([ti, s], i) => (
          <div className="reserve-etape" key={ti}>
            <span>{i + 1}</span>
            <div><strong>{ti}</strong><p>{s}</p></div>
          </div>
        ))}
      </section>
    </main>
  );
}
