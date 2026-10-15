'use client';
import { Erreur } from '@/composants/portail/Etats';
export default function Error({ reset }: { error: Error; reset: () => void }) { return <Erreur reset={reset} espace="proprietaire" />; }
