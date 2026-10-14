import { appeler, outils, type Rpc } from "./outils.ts";

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
