/* Icônes de la maquette (blk.js), trait 1,75. */
const P: Record<string, React.ReactNode> = {
  home: <><path d="M3 11 12 3.5 21 11" /><path d="M5.5 9.5V20.5h13V9.5" /><path d="M10 20.5v-6h4v6" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  inbox: <><path d="M3.5 13.5 6 5h12l2.5 8.5v5h-17z" /><path d="M3.5 13.5h5l1.5 2.5h4l1.5-2.5h5" /></>,
  trend: <><path d="M4 16l5-5 4 4 7-7" /><path d="M15 8h5v5" /></>,
  users: <><circle cx="9" cy="9" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><circle cx="17" cy="10" r="2.6" /><path d="M15.5 14.6A4.6 4.6 0 0 1 21 19" /></>,
  building: <><rect x="5" y="3.5" width="14" height="17" rx="1.5" /><path d="M9 7.5h2M13 7.5h2M9 11h2M13 11h2M9 14.5h2M13 14.5h2M10.5 20.5v-3h3v3" /></>,
  wrench: <><path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5" /><path d="M14.5 6.5 17 4l3 3-2.5 2.5" /></>,
  dollar: <path d="M12 3v18M16.5 7.5c-.8-1.2-2.4-2-4.5-2-2.6 0-4.5 1.3-4.5 3.2 0 4.6 9.5 2.5 9.5 7 0 2-2 3.3-4.8 3.3-2.3 0-4.1-.9-5-2.4" />,
  scale: <><path d="M12 4v16M7 20h10M5 8h14" /><path d="m5 8-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.3 2.6 14.7 0 17M12 3.5c-2.6 2.3-2.6 14.7 0 17" /></>,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
  chart: <><path d="M4 20V4M4 20h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  file: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  command: <path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z" />,
  shield: <><path d="M12 3 4.5 6v6c0 4.5 3.2 7.7 7.5 9 4.3-1.3 7.5-4.5 7.5-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
};
export function Icone({ nom, taille = 20, couleur = 'currentColor', trait = 1.75 }: { nom: string; taille?: number; couleur?: string; trait?: number }) {
  return <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth={trait} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[nom]}</svg>;
}
