import { appeler, outils, type Rpc } from "./outils.ts";
import { REGISTRE } from "../_shared/operations/registre.ts";

Deno.test("outils : jamais d'approbation ni de rejet, deux propositions générées du registre", () => {
  const noms = outils().map((o) => o.name);
  for (const interdit of ["approve-proposal", "reject-proposal", "move-prospect-stage", "update-prospect-followup"]) if (noms.includes(interdit)) throw new Error(interdit);
  for (const voulu of ["list-proposals", "get-proposal", "propose-move-prospect-stage", "propose-update-prospect-followup"]) if (!noms.includes(voulu)) throw new Error(voulu);
});

Deno.test("propose : l'agent vient de la clé, la clé d'idempotence est préfixée, canal mcp", async () => {
  let recu: Record<string, unknown> = {};
  const rpc: Rpc = (f, a) => { recu = { f, ...(a.p as Record<string, unknown>) }; return Promise.resolve({ ok: true, status: 200, data: { id: "x", status: "pending", expires_at: "t" } }); };
  await appeler("propose-move-prospect-stage", { target_id: "t", after: { stage: "interested" }, reason: "Intention claire par courriel", source_type: "courriel", idempotency_key: "k1", agent: "pirate" }, "cleo", rpc);
  if (recu.f !== "lanceur_proposer" || recu.agent !== "cleo" || recu.idempotency_key !== "cleo:k1" || recu.channel !== "mcp") throw new Error(JSON.stringify(recu));
});

Deno.test("propose : champ hors registre refusé sans appel", async () => {
  let appels = 0;
  const rpc: Rpc = () => { appels++; return Promise.resolve({ ok: true, status: 200, data: {} }); };
  const r = await appeler("propose-move-prospect-stage", { target_id: "t", after: { stage: "lost", notes: "x" }, reason: "..........", source_type: "courriel", idempotency_key: "k" }, "cleo", rpc);
  if (!("isError" in r) || appels) throw new Error("devait refuser");
});

Deno.test("outil inconnu ou interdit refusé", async () => {
  const rpc: Rpc = () => Promise.resolve({ ok: true, status: 200, data: {} });
  for (const n of ["approve-proposal", "propose-approve-proposal", "propose-list-team-members"]) {
    const r = await appeler(n, {}, "cleo", rpc);
    if (!("isError" in r)) throw new Error(n);
  }
});

Deno.test("T10 : chaque outil correspond à une entrée du registre (ou aux deux lectures de propositions)", () => {
  for (const o of outils(true)) {
    const base = o.name.replace(/^propose-/, "");
    if (!["list-proposals", "get-proposal"].includes(o.name) && !REGISTRE.some((r) => r.nom === base)) throw new Error(o.name);
  }
  if (outils(false).some((o) => o.name === "list-deals")) throw new Error("lectures sans clé");
  if (!outils(true).some((o) => o.name === "list-deals")) throw new Error("lectures avec clé");
});

Deno.test("T10 : avec une clé d'API, tout passe par service_api_appeler (canal mcp), y compris les propositions", async () => {
  const appels: Record<string, unknown>[] = [];
  const rpc: Rpc = (f, a) => { appels.push({ f, ...(a.p as Record<string, unknown>) }); return Promise.resolve({ ok: true, status: 200, data: { id: "x", status: "pending" } }); };
  await appeler("list-deals", { pipeline: "mandats" }, { nom: "cleo", secret: "ll_s" }, rpc);
  await appeler("propose-move-deal-stage", { target_id: "t", after: { stage_id: "s" }, reason: "Rendez-vous confirmé", source_type: "courriel", idempotency_key: "k" }, { nom: "cleo", secret: "ll_s" }, rpc);
  if (appels.length !== 2 || appels.some((x) => x.f !== "service_api_appeler" || x.canal !== "mcp" || x.secret !== "ll_s")) throw new Error(JSON.stringify(appels));
});

Deno.test("T10 : lecture refusée sans clé d'API", async () => {
  const rpc: Rpc = () => Promise.resolve({ ok: true, status: 200, data: {} });
  const r = await appeler("list-deals", {}, "cleo", rpc);
  if (!("isError" in r)) throw new Error("devait refuser");
});
