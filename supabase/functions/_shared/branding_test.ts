// Vérification exécutable du module de marque : `deno test
// supabase/functions/_shared/branding_test.ts`.
//
// Ces tests ne valident pas des goûts de nommage : ils empêchent les deux
// façons concrètes de casser les courriels lors du renommage.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  DOMAINE,
  DOMAINE_COURRIEL,
  EXPEDITEUR,
  PORTAILS,
  REPONSE_A,
  SITE_BASE_URL,
} from "./branding.ts";

Deno.test("toutes les URL de portail dérivent du domaine unique", () => {
  // Le défaut d'origine : une URL oubliée lors du renommage envoie l'usager
  // sur un domaine mort. Si une seule est écrite en dur, ce test échoue.
  for (const [nom, url] of Object.entries(PORTAILS)) {
    assert(url.startsWith(`https://${DOMAINE}/`), `${nom} ne dérive pas de DOMAINE : ${url}`);
  }
  assertEquals(SITE_BASE_URL, `https://${DOMAINE}`);
});

Deno.test("l'expéditeur utilise le sous-domaine d'envoi, pas le domaine du site", () => {
  // Envoyer depuis le domaine racine plutôt que mail.<domaine> fait
  // échouer Resend : SPF/DKIM ne sont vérifiés que sur le sous-domaine.
  assert(EXPEDITEUR.includes(`@${DOMAINE_COURRIEL}>`), `expéditeur inattendu : ${EXPEDITEUR}`);
  assertEquals(DOMAINE_COURRIEL, `mail.${DOMAINE}`);
});

Deno.test("les adresses Reply-To restent sur le domaine racine", () => {
  for (const [role, adresse] of Object.entries(REPONSE_A)) {
    assertEquals(adresse.split("@")[1], DOMAINE, `${role} n'est pas sur DOMAINE`);
  }
});

Deno.test("le domaine et le CNAME de GitHub Pages restent d'accord", () => {
  // La garde d'origine figeait DOMAINE sur portailgestion.ca tant que P9
  // n'était pas fait. P9 étant fait (2026-09-11), elle est remplacée
  // plutôt que supprimée : ce qui compte maintenant n'est plus « ne pas
  // basculer » mais « ne pas basculer À MOITIÉ ».
  //
  // Le fichier CNAME dit à GitHub Pages quel domaine servir. S'il diverge
  // de DOMAINE, les courriels pointent vers un domaine que Pages ne sert
  // pas — et la panne est invisible depuis le code, puisque les deux
  // valeurs sont correctes prises séparément.
  const cname = Deno.readTextFileSync(new URL("../../../CNAME", import.meta.url)).trim();
  assertEquals(
    cname,
    DOMAINE,
    `CNAME (${cname}) et DOMAINE (${DOMAINE}) divergent : GitHub Pages ne servirait pas le domaine des liens.`,
  );
});
