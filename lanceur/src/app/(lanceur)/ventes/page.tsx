import { redirect } from 'next/navigation';

// /ventes seul : le pipeline des mandats (même cible que la tuile Ventes de l'accueil).
export default function Page() { redirect('/ventes/mandats'); }
