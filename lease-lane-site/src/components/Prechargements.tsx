/* Préchargements du <head> (PageSpeed du 23 oct. 2026) :
   - Poppins 400 à 700 latin : sans préchargement, les polices n'étaient découvertes qu'une fois le CSS lu et le texte mis en
     page; elles arrivaient après le premier affichage et le titre de la bannière se recalait (décalage 0,067, cause
     « Web font loaded » dans Lighthouse). Préchargées dès l'analyse du HTML, elles sont là pour le premier affichage.
   - Ligne d'immeubles de la bannière d'accueil (WebP) : l'élément le plus grand de l'écran à partir de 1024 px de large;
     en différé, elle s'affichait vers 1,7 à 1,9 s. Préchargée sur ordinateur seulement (media), rien de plus sur mobile. */
const POLICES = ['400', '500', '600', '700'];
export default function Prechargements() {
  return (
    <>
      {POLICES.map((p) => <link key={p} rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href={`/assets/fonts/poppins-${p}-latin.woff2`} />)}
      <link rel="preload" as="image" href="/assets/img/couverture-immeubles.webp" media="(min-width: 1024px)" fetchPriority="high" />
    </>
  );
}
