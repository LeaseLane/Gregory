/* Icônes de la maquette (blk.js), trait 1,75. */
const P: Record<string, React.ReactNode> = {
  shield: <><path d="M12 3 4.5 6v6c0 4.5 3.2 7.7 7.5 9 4.3-1.3 7.5-4.5 7.5-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
};
export function Icone({ nom, taille = 20, couleur = 'currentColor' }: { nom: keyof typeof P | string; taille?: number; couleur?: string }) {
  return <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[nom]}</svg>;
}
