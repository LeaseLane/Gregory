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

Deno.test("le domaine n'est pas basculé avant que P9 soit fait", () => {
  // Garde délibérée. leaselane.ca est stationné chez Namecheap et
  // mail.leaselane.ca n'existe pas (vérifié le 2026-09-07) : basculer
  // maintenant casserait tous les liens et tous les envois.
  //
  // POUR BASCULER : faire P9 (DNS + domaine vérifié chez Resend +
  // délivrabilité), puis changer DOMAINE, puis SUPPRIMER ce test, puis
  // mettre à jour CNAME, sitemap.xml et ALLOWED_ORIGINS dans auth.ts.
  assertEquals(
    DOMAINE,
    "portailgestion.ca",
    "DOMAINE a changé : confirmer que P9 est terminé (DNS + Resend vérifié) et supprimer ce test.",
  );
});
