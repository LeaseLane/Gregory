// Erreurs typées des opérations : PostgREST traduit PT403/404/409/422 en statut HTTP;
// le message de la base est déjà en français et dit quoi faire.
export type ErreurOperation = { code: 403 | 404 | 409 | 422 | 500; message: string };

export function traduireErreur(e: { code?: string; message?: string } | null | undefined, statut?: number): ErreurOperation {
  const sql = e?.code ?? "";
  const code = /^PT(403|404|409|422)$/.test(sql) ? (Number(sql.slice(2)) as ErreurOperation["code"])
    : sql === "42501" ? 403 : statut && [403, 404, 409, 422].includes(statut) ? (statut as ErreurOperation["code"]) : 500;
  const message = code === 500 ? "L'opération n'a pas abouti. Réessayez; si l'erreur revient, écrivez à l'équipe." : (e?.message || "Action refusée.");
  return { code, message };
}
