// Exécute une opération du registre avec le jeton de l'usager (jamais la clé de service côté interface).
import { operation, type NomOperation } from "./registre.ts";
import { traduireErreur, traduireRetour, type ErreurOperation } from "./erreurs.ts";

type ClientRpc = { rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }> };
export type Resultat<T = unknown> = { ok: true; donnees: T } | { ok: false; erreur: ErreurOperation };

export async function executer<T = unknown>(client: ClientRpc, nom: NomOperation, entree?: Record<string, unknown>): Promise<Resultat<T>> {
  const op = operation(nom);
  if (op.type !== "sql") return { ok: false, erreur: { code: 500, message: `Opération ${nom} : type ${op.type} pas encore pris en charge par executer().` } };
  const { data, error } = await client.rpc(op.cible, entree === undefined ? undefined : { p: entree });
  if (error) return { ok: false, erreur: traduireErreur(error) };
  const retour = traduireRetour(data);
  return retour ? { ok: false, erreur: retour } : { ok: true, donnees: data as T };
}
