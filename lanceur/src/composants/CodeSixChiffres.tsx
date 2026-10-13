'use client';
import { useRef } from 'react';

/* Six cases du code (maquette e66) : 56 × 64, coins 12; vide g200, remplie g400, case active b500 2 px + halo.
   Saisie, collage du code entier, retour arrière, flèches. */
export function CodeSixChiffres({ valeur, onChange, onComplet, desactive }: { valeur: string; onChange: (v: string) => void; onComplet?: (v: string) => void; desactive?: boolean }) {
  const cases = useRef<(HTMLInputElement | null)[]>([]);
  const chiffres = Array.from({ length: 6 }, (_, i) => valeur[i] ?? '');
  const actif = Math.min(valeur.length, 5);

  function mettre(v: string) {
    const propre = v.replace(/\D/g, '').slice(0, 6);
    onChange(propre);
    cases.current[Math.min(propre.length, 5)]?.focus();
    if (propre.length === 6) onComplet?.(propre);
  }

  return (
    <div className="code6" role="group" aria-label="Code à 6 chiffres">
      {chiffres.map((c, i) => (
        <input
          key={i}
          ref={(el) => { cases.current[i] = el; }}
          className={'code6-case' + (c ? ' rempli' : '') + (i === actif && !desactive ? ' actif' : '')}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Chiffre ${i + 1}`}
          maxLength={6}
          value={c}
          disabled={desactive}
          autoFocus={i === 0}
          onFocus={(e) => { if (i > valeur.length) cases.current[valeur.length]?.focus(); else e.target.select(); }}
          onChange={(e) => {
            const saisi = e.target.value.replace(/\D/g, '');
            if (!saisi) return;
            mettre(saisi.length > 1 ? saisi : valeur.slice(0, i) + saisi + valeur.slice(i + 1));
          }}
          onPaste={(e) => { e.preventDefault(); mettre(e.clipboardData.getData('text')); }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') { e.preventDefault(); const v = valeur.slice(0, Math.max(0, c ? i : i - 1)); onChange(v); cases.current[v.length]?.focus(); }
            if (e.key === 'ArrowLeft') cases.current[Math.max(0, i - 1)]?.focus();
            if (e.key === 'ArrowRight') cases.current[Math.min(5, i + 1)]?.focus();
          }}
        />
      ))}
    </div>
  );
}
