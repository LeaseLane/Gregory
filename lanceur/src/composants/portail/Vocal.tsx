'use client';
import { useEffect, useRef, useState } from 'react';
import { Icone } from '@/composants/Icones';

/* Messages vocaux des portails : enregistrement (MediaRecorder du navigateur) et lecteur avec forme d'onde (pics calculés du son). */
export function useVocal() {
  const [etat, setEtat] = useState<'repos' | 'enregistre' | 'pret'>('repos'), [blob, setBlob] = useState<Blob | null>(null), [duree, setDuree] = useState(0), [erreur, setErreur] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null), debut = useRef(0);
  async function demarrer() {
    setErreur(null);
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(flux), morceaux: Blob[] = [];
      r.ondataavailable = (e) => morceaux.push(e.data);
      r.onstop = () => { flux.getTracks().forEach((t) => t.stop()); setBlob(new Blob(morceaux, { type: r.mimeType || 'audio/webm' })); setDuree(Math.round((Date.now() - debut.current) / 1000)); setEtat('pret'); };
      rec.current = r; debut.current = Date.now(); r.start(); setEtat('enregistre');
    } catch { setErreur('Le micro n’est pas accessible : autorisez-le dans votre navigateur, ou écrivez votre message.'); }
  }
  const arreter = () => rec.current?.state === 'recording' && rec.current.stop();
  const effacer = () => { setBlob(null); setDuree(0); setEtat('repos'); };
  const fichier = () => blob && new File([blob], `message-vocal.${(blob.type.split('/')[1] ?? 'webm').split(';')[0]}`, { type: blob.type });
  return { etat, blob, duree, erreur, demarrer, arreter, effacer, fichier };
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export function LecteurVocal({ source, duree, effacer }: { source: Blob | (() => Promise<string | null>); duree?: number; effacer?: () => void }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [pics, setPics] = useState<number[]>([]), [pos, setPos] = useState(0), [total, setTotal] = useState(duree ?? 0), [joue, setJoue] = useState(false), [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let annule = false, local: string | null = null;
    (async () => {
      const u = source instanceof Blob ? (local = URL.createObjectURL(source)) : await source();
      if (!u || annule) return; setUrl(u);
      try {
        const brut = source instanceof Blob ? await source.arrayBuffer() : await (await fetch(u)).arrayBuffer();
        const son = await new AudioContext().decodeAudioData(brut), c = son.getChannelData(0), n = 90, pas = Math.floor(c.length / n);
        const p = Array.from({ length: n }, (_, i) => { let m = 0; for (let j = i * pas; j < (i + 1) * pas; j += 64) m = Math.max(m, Math.abs(c[j])); return m; });
        const max = Math.max(...p, 0.01); if (!annule) { setPics(p.map((x) => 0.15 + 0.85 * (x / max))); if (!duree) setTotal(son.duration); }
      } catch { if (!annule) setPics(Array.from({ length: 90 }, (_, i) => 0.3 + 0.5 * Math.abs(Math.sin(i * 1.7)))); }
    })();
    return () => { annule = true; if (local) URL.revokeObjectURL(local); };
  }, [source, duree]);
  function basculer() { const a = audio.current; if (!a) return; if (a.paused) { a.play(); setJoue(true); } else { a.pause(); setJoue(false); } }
  const avance = total ? pos / total : 0;
  return (
    <div className="vocal">
      <button type="button" className="vocal-jouer" onClick={basculer} disabled={!url} aria-label={joue ? 'Pause' : 'Écouter le message vocal'}><Icone nom={joue ? 'pause' : 'play'} taille={18} couleur="#fff" trait={joue ? 2.6 : 1.75} /></button>
      <div className="vocal-onde" aria-hidden="true">{pics.map((h, i) => <i key={i} className={i / pics.length < avance ? 'lu' : ''} style={{ height: `${Math.round(h * 100)}%` }} />)}</div>
      <span className="vocal-temps">{mmss(pos)} / {mmss(total)}</span>
      {effacer && <button type="button" className="vocal-effacer" onClick={effacer} aria-label="Supprimer l’enregistrement"><Icone nom="trash" taille={18} couleur="#3E4A59" /></button>}
      {url && <audio ref={audio} src={url} preload="metadata" onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)} onEnded={() => { setJoue(false); setPos(0); }}
        onLoadedMetadata={(e) => { if (isFinite(e.currentTarget.duration) && !duree) setTotal(e.currentTarget.duration); }} />}
    </div>
  );
}
