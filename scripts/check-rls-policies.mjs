// Vérification statique des règles d'accès (lot P6). Ne touche aucune
// base : lit schema.sql et supabase/migrations/*.sql.
//
// Trois défauts que l'audit P6 a réellement trouvés, et qui reviendraient
// sans garde automatique :
//   1. policy UPDATE sans WITH CHECK — la ligne peut être réécrite vers
//      un état interdit (réassignée à un autre propriétaire);
//   2. table sans RLS activé — tout est lisible par la clé anon;
//   3. helper d'autorisation sans security definer / row_security = off,
//      qui provoque une récursion de policy ou un contrôle qui s'ignore.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Les commentaires sont retirés avant analyse. Sans ça, la prose des
// en-têtes déclenchait de faux positifs : « CREATE TABLE IF NOT EXISTS »
// cité en exemple donnait une table nommée « IF », et une phrase
// française contenant « create table et ... » une table nommée « et ».
const sansCommentaires = (sql) =>
  sql
    .replace(/\/\*[\s\S]*?\*\//g, "")   // blocs /* ... */
    .replace(/^[ \t]*--.*$/gm, "")      // lignes entièrement en commentaire
    .replace(/(\s)--.*$/gm, "$1");      // commentaires en fin de ligne

const fichiers = [
  { nom: "schema.sql", contenu: sansCommentaires(readFileSync("schema.sql", "utf8")) },
  ...readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .map((f) => ({ nom: f, contenu: sansCommentaires(readFileSync(join("supabase/migrations", f), "utf8")) })),
];
const tout = fichiers.map((f) => f.contenu).join("\n");

// pg_dump cite les identifiants ("public"."owners") alors que le SQL écrit
// à la main ne les cite pas (public.owners) : les deux formes doivent être
// reconnues, sinon la référence de schéma paraît dépourvue de RLS.
const nomTable = String.raw`(?:"?public"?\.)?"?(\w+)"?`;

const problemes = [];

// 1. UPDATE sans WITH CHECK. Une policy corrigée plus tard par un
//    drop+create compte comme corrigée : on retient la DERNIÈRE
//    définition de chaque nom, dans l'ordre des fichiers.
const derniere = new Map();
for (const f of fichiers) {
  const re = new RegExp(
    String.raw`create policy\s+"([^"]+)"\s+on\s+` + nomTable + String.raw`\s+(?:as\s+\w+\s+)?for\s+(\w+)([\s\S]*?);`,
    "gi",
  );
  let m;
  while ((m = re.exec(f.contenu))) {
    derniere.set(m[1], { table: m[2], cmd: m[3].toLowerCase(), corps: m[4], fichier: f.nom });
  }
}
for (const [nom, p] of derniere) {
  if (p.cmd === "update" && !/with check/i.test(p.corps)) {
    problemes.push(`policy UPDATE sans WITH CHECK — ${p.table} "${nom}" (${p.fichier})`);
  }
}

// 2. Toute table doit avoir RLS activé.
const tables = new Set(
  [...tout.matchAll(new RegExp(String.raw`create table (?:if not exists )?` + nomTable, "gi"))].map((m) => m[1]),
);
const rls = new Set(
  [...tout.matchAll(new RegExp(String.raw`alter table (?:only\s+)?` + nomTable + String.raw`\s+enable row level security`, "gi"))].map((m) => m[1]),
);
for (const t of tables) {
  if (!rls.has(t)) problemes.push(`table sans RLS activé — ${t}`);
}

// 3. Les helpers lus par les policies doivent être security definer ET
//    row_security = off, sinon la policy s'auto-appelle.
const helpers = /create or replace function (auth_\w+|owned_\w+|tenant_\w+)\(\)([\s\S]*?)\$\$/gi;
let h;
while ((h = helpers.exec(tout))) {
  const [, nom, entete] = h;
  if (!/security definer/i.test(entete)) problemes.push(`helper sans security definer — ${nom}()`);
  if (!/row_security\s*=\s*off/i.test(entete)) problemes.push(`helper sans row_security = off — ${nom}()`);
}

console.log(`${tables.size} table(s), ${rls.size} avec RLS, ${derniere.size} policy(ies) analysée(s).`);
if (problemes.length) {
  console.log(`\n❌ ${problemes.length} problème(s) :`);
  problemes.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
console.log("✓ Aucune règle d'accès non conforme.");
