'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

type Evenement = { type: 'visite' | 'intervention' | 'tache'; id: string; debut: string; fin: string; titre: string; detail: string; qui: string | null; urgent: boolean; libre?: boolean };
type Semaine = { lundi: string; evenements: Evenement[] };
export type DonneesAgenda = { jour: string; evenements: Evenement[]; jours_occupes: string[]; a_planifier: { type: 'intervention' | 'tache'; id: string; titre: string; detail: string }[] };

const HP = 56, H0 = 8, H1 = 18;
const TZ = 'America/Toronto';
const hm = (iso: string) => new Date(iso).toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: TZ }).replace(':', ' h ').replace(/ h 00$/, ' h');
const heureDec = (iso: string) => { const [h, m] = new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).split(':').map(Number); return h + m / 60; };
const initiales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join('').toUpperCase();
const decaler = (j: string, n: number) => { const d = new Date(`${j}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export function Agenda({ donnees, aujourdhui, semaine = null, logements = [], erreurLecture }: { donnees: DonneesAgenda | null; aujourdhui: string; semaine?: Semaine | null;
  logements?: { id: string; libelle: string }[]; erreurLecture: string | null }) {
  const router = useRouter();
  const [maintenant, setMaintenant] = useState(() => new Date().toISOString());
  const [planifier, setPlanifier] = useState<{ id: string; titre: string } | null>(null), [libre, setLibre] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { const t = setInterval(() => setMaintenant(new Date().toISOString()), 60000); return () => clearInterval(t); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);

  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture} <button className="lien" onClick={() => router.refresh()}>Réessayer</button></div>;
  const j = donnees.jour, estAujourdhui = j === aujourdhui;
  const titreJour = new Date(`${j}T12:00:00Z`).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const urgences = donnees.evenements.filter((e) => e.urgent).length;
  const hNow = heureDec(maintenant);
  const etat = (e: Evenement) => e.urgent ? 'urg' : estAujourdhui && heureDec(e.fin) <= hNow ? 'passe' : j < aujourdhui ? 'passe' : 'avenir';
  // mois : semaines du dimanche au samedi
  const [an, mo] = j.split('-').map(Number);
  const premier = new Date(Date.UTC(an, mo - 1, 1)), nbJours = new Date(Date.UTC(an, mo, 0)).getUTCDate(), decal = premier.getUTCDay();
  const cases = Array.from({ length: Math.ceil((decal + nbJours) / 7) * 7 }, (_, i) => i - decal + 1);
  const iso = (n: number) => `${an}-${String(mo).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
  const moisPrec = decaler(iso(1), -1).slice(0, 8) + '01', moisSuiv = decaler(iso(nbJours), 1);

  return (
    <>
      <div className="studio">
        <section className="studio-liste agenda" aria-label="Journée">
          <header className="carte-tete studio-tete">
            <div><h2>{semaine ? `Semaine du ${new Date(`${semaine.lundi}T12:00:00Z`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', timeZone: 'UTC' })}` : titreJour.charAt(0).toUpperCase() + titreJour.slice(1)}</h2>
              <p>{semaine ? (semaine.evenements.length ? `${semaine.evenements.length} rendez-vous · visites de 15 min, visites libres en hachures` : 'Semaine libre.') : donnees.evenements.length ? `${donnees.evenements.length} rendez-vous` : 'Journée libre.'}{urgences ? ` · ${urgences} urgence${urgences > 1 ? 's' : ''}${estAujourdhui ? ' en cours' : ''}` : ''}</p></div>
            <div className="taches-actions">
              <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 16px' }} onClick={() => setLibre(true)}><Icone nom="plus" taille={16} couleur="#fff" />Visite libre</button>
              <Link className="haut-ibtn" href={`?jour=${decaler(j, semaine ? -7 : -1)}${semaine ? '&vue=semaine' : ''}`} aria-label={semaine ? 'Semaine précédente' : 'Jour précédent'}><span className="flip"><Icone nom="chevron" taille={20} couleur="#0C2147" /></span></Link>
              <Link className="haut-ibtn" href={`?jour=${decaler(j, semaine ? 7 : 1)}${semaine ? '&vue=semaine' : ''}`} aria-label={semaine ? 'Semaine suivante' : 'Jour suivant'}><Icone nom="chevron" taille={20} couleur="#0C2147" /></Link>
              <div className="segment" role="tablist" aria-label="Vue de l’agenda">
                <Link role="tab" aria-selected={!semaine} className={semaine ? '' : 'actif'} href={`?jour=${j}`}>Jour</Link>
                <Link role="tab" aria-selected={!!semaine} className={semaine ? 'actif' : ''} href={`?jour=${j}&vue=semaine`}>Semaine</Link>
                <button role="tab" aria-selected={false} disabled title="Arrive avec sa tranche">Mois</button>
              </div>
            </div>
          </header>
          {semaine ? <VueSemaine semaine={semaine} aujourdhui={aujourdhui} /> : <div className="grille-h" style={{ height: (H1 - H0) * HP + 1 }}>
            {Array.from({ length: H1 - H0 + 1 }, (_, i) => H0 + i).map((h) => (
              <div key={h} className={'heure' + (h === H0 || h === H1 ? ' bord' : '')} style={{ top: (h - H0) * HP }}>
                {!(estAujourdhui && Math.abs(hNow - h) < 0.4 && hNow >= H0 && hNow <= H1) && <span>{h} h</span>}
              </div>
            ))}
            {donnees.evenements.map((e) => {
              const d = Math.max(H0, heureDec(e.debut)), f = Math.min(H1, Math.max(d + 0.25, heureDec(e.fin)));
              if (f <= H0 || d >= H1) return null;
              const h = (f - d) * HP - 3, grand = h >= 40, k = etat(e);
              return (
                <div key={e.type + e.id} className={`rdv ${k}` + (e.libre ? ' libre' : '') + (grand ? '' : ' court')} style={{ top: (d - H0) * HP + 2, height: h }} title={`${e.titre} · ${hm(e.debut)}`}>
                  <i />
                  <div><strong>{e.titre}</strong><span>{hm(e.debut)} à {hm(e.fin)}{e.detail ? ` · ${e.detail}` : ''}</span></div>
                  {grand && e.urgent && <span className="urgence"><Icone nom="alert" taille={16} couleur="#fff" trait={2} />Urgence</span>}
                  {grand && e.qui && <span className="ini" style={{ width: 28, height: 28, fontSize: 12 }} title={e.qui}>{initiales(e.qui)}</span>}
                </div>
              );
            })}
            {estAujourdhui && hNow >= H0 && hNow <= H1 && (
              <div className="maintenant" style={{ top: (hNow - H0) * HP }}><span>{hm(maintenant)}</span><i /></div>
            )}
          </div>}
        </section>

        <div className="colonne-l18">
          <section className="carte-l18 mois" aria-label={`${MOIS[mo - 1]} ${an}`}>
            <header className="mois-tete"><h2>{MOIS[mo - 1].charAt(0).toUpperCase() + MOIS[mo - 1].slice(1)} {an}</h2>
              <Link href={`?jour=${moisPrec}`} aria-label="Mois précédent"><span className="flip"><Icone nom="chevron" taille={16} couleur="#0C2147" /></span></Link>
              <Link href={`?jour=${moisSuiv}`} aria-label="Mois suivant"><Icone nom="chevron" taille={16} couleur="#0C2147" /></Link></header>
            <div className="mois-grille">
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <b key={i}>{d}</b>)}
              {cases.map((n, i) => n < 1 || n > nbJours ? <span key={i} className="hors" /> : (
                <Link key={i} href={`?jour=${iso(n)}`} className={(iso(n) === j ? 'choisi ' : '') + (iso(n) === aujourdhui ? 'auj ' : '') + (iso(n) < aujourdhui ? 'passe' : '')}>
                  {n}{donnees.jours_occupes.includes(iso(n)) && <i />}
                </Link>
              ))}
            </div>
            <p className="sync"><i className="vide" />Google Agenda pas encore relié</p>
          </section>
          <section className="carte-l18" aria-label="À planifier">
            <header className="carte-tete sans-marge"><h2>À planifier</h2><p>{donnees.a_planifier.length ? `${donnees.a_planifier.length} sans date` : 'Rien à planifier.'}</p></header>
            <ul className="planifier">
              {donnees.a_planifier.map((p) => (
                <li key={p.type + p.id}><div><strong>{p.titre}</strong><span>{p.detail}</span></div>
                  {p.type === 'tache'
                    ? <button className="bouton bouton-contour" onClick={() => setPlanifier({ id: p.id, titre: p.titre })}>Planifier</button>
                    : <button className="bouton bouton-contour" disabled title="Le rendez-vous se fixe avec le fournisseur et le locataire (Maintenance)">Planifier</button>}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      {libre && <VisiteLibre logements={logements} jour={j} fermer={() => setLibre(false)} fait={(t) => { setLibre(false); setToast(t); router.refresh(); }} />}
      {planifier && <Planifier tache={planifier} jour={j} fermer={() => setPlanifier(null)} fait={(t) => { setPlanifier(null); setToast(t); router.refresh(); }} />}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

function Planifier({ tache, jour, fermer, fait }: { tache: { id: string; titre: string }; jour: string; fermer: () => void; fait: (t: string) => void }) {
  const [date, setDate] = useState(jour), [heure, setHeure] = useState('09:00'), [erreur, setErreur] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  async function ok() {
    setEnvoi(true); setErreur(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_maj_tache', { p: { id: tache.id, due_at: new Date(`${date}T${heure}:00`).toISOString(), due_all_day: false } });
    setEnvoi(false);
    if (error) setErreur(error.message); else fait(`« ${tache.titre} » planifiée.`);
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="pl-titre" style={{ width: 'min(480px, 100%)' }}>
        <div className="fenetre-tete"><h2 id="pl-titre">Planifier « {tache.titre} »</h2><button className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={18} couleur="#3E4A59" trait={2} /></button></div>
        <div className="nt-grille">
          <label className="fenetre-lib">Date<input type="date" className="e70-raison" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="fenetre-lib">Heure<input type="time" className="e70-raison" value={heure} onChange={(e) => setHeure(e.target.value)} /></label>
        </div>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions"><button className="bouton bouton-contour" onClick={fermer}>Annuler</button><button className="bouton bouton-principal" disabled={envoi} onClick={ok}>Planifier</button></div>
      </div>
    </div>
  );
}

// Vue Semaine (lundi au dimanche) : mêmes rendez-vous que la journée, une colonne par jour, 14 px par quart d'heure.
function VueSemaine({ semaine, aujourdhui }: { semaine: Semaine; aujourdhui: string }) {
  const jours = Array.from({ length: 7 }, (_, k) => decaler(semaine.lundi, k));
  const jourDe = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
  let h0 = H0, h1 = H1;
  for (const e of semaine.evenements) { h0 = Math.min(h0, Math.floor(heureDec(e.debut))); h1 = Math.max(h1, Math.ceil(heureDec(e.fin))); }
  const haut = (h1 - h0) * HP;
  return (
    <div className="sem">
      <div />{jours.map((d) => <div key={d} className={'sem-tete' + (d === aujourdhui ? ' auj' : '')}>
        {new Date(`${d}T12:00:00Z`).toLocaleDateString('fr-CA', { weekday: 'short', timeZone: 'UTC' })}<small>{new Date(`${d}T12:00:00Z`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</small></div>)}
      <div className="sem-h" style={{ height: haut }}>{Array.from({ length: h1 - h0 + 1 }, (_, k) => <span key={k} style={{ top: k * HP }}>{h0 + k} h</span>)}</div>
      {jours.map((d) => <div key={d} className="sem-col" style={{ height: haut }}>
        {semaine.evenements.filter((e) => jourDe(e.debut) === d).map((e) => {
          const top = (heureDec(e.debut) - h0) * HP, h = Math.max(14, (heureDec(e.fin) - heureDec(e.debut)) * HP) - 2;
          return <div key={e.type + e.id} className={'rdv' + (e.libre ? ' libre' : '') + (e.urgent ? ' urg' : '') + (h < 40 ? ' court' : '')} style={{ top: top + 1, height: h }} title={`${e.titre} · ${hm(e.debut)} à ${hm(e.fin)}`}>
            <i /><div><strong>{hm(e.debut)} {e.libre ? 'Visite libre' : e.titre.replace(/^Visite · /, 'Visite · ')}</strong>{h >= 40 && <span>{e.libre ? `jusqu’à ${hm(e.fin)} · ${e.titre.replace(/^Visite libre · /, '')}` : e.detail}</span>}</div></div>;
        })}
      </div>)}
    </div>
  );
}

// Visite libre (portes ouvertes) : bloque le logement pendant la plage (3 h par défaut); un chevauchement est refusé par la base.
function VisiteLibre({ logements, jour, fermer, fait }: { logements: { id: string; libelle: string }[]; jour: string; fermer: () => void; fait: (t: string) => void }) {
  const [unite, setUnite] = useState(logements[0]?.id ?? ''), [date, setDate] = useState(jour), [heure, setHeure] = useState('13:00'), [duree, setDuree] = useState(180);
  const [erreur, setErreur] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  async function ok() {
    setEnvoi(true); setErreur(null);
    // Heure saisie = heure du Québec, quel que soit le fuseau de l'appareil.
    const decalage = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'longOffset' }).formatToParts(new Date(`${date}T12:00:00Z`)).find((x) => x.type === 'timeZoneName')?.value.replace('GMT', '') || '-05:00';
    const { error } = await supabaseNavigateur().rpc('lanceur_visite_libre', { p: { unit_id: unite, debut: `${date}T${heure}:00${decalage}`, duree } });
    setEnvoi(false);
    if (error) setErreur(error.message); else fait(`Visite libre ajoutée le ${new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', timeZone: 'UTC' })} à ${heure.replace(':', ' h ')}.`);
  }
  return (
    <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="vl-titre" style={{ width: 'min(520px, 100%)' }}>
        <div className="fenetre-tete"><h2 id="vl-titre">Visite libre</h2><button className="fermer" onClick={fermer} aria-label="Fermer"><Icone nom="close" taille={18} couleur="#3E4A59" trait={2} /></button></div>
        <p className="fenetre-texte">Les visiteurs passent sans heure précise. Aucune autre visite ne peut être prise dans ce logement pendant la plage.</p>
        <label className="fenetre-lib">Logement<select className="e70-raison" value={unite} onChange={(e) => setUnite(e.target.value)}>
          {logements.length ? logements.map((l) => <option key={l.id} value={l.id}>{l.libelle}</option>) : <option value="">Aucun logement à louer</option>}</select></label>
        <div className="nt-grille">
          <label className="fenetre-lib">Date<input type="date" className="e70-raison" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="fenetre-lib">Début<input type="time" step={900} className="e70-raison" value={heure} onChange={(e) => setHeure(e.target.value)} /></label>
        </div>
        <label className="fenetre-lib">Durée<select className="e70-raison" value={duree} onChange={(e) => setDuree(Number(e.target.value))}>
          {[60, 90, 120, 150, 180, 240, 300, 360].map((m) => <option key={m} value={m}>{Math.floor(m / 60)} h{m % 60 ? ` ${m % 60}` : ''}</option>)}</select></label>
        {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
        <div className="fenetre-actions"><button className="bouton bouton-contour" onClick={fermer}>Annuler</button><button className="bouton bouton-principal" disabled={envoi || !unite} onClick={ok}>Bloquer la plage</button></div>
      </div>
    </div>
  );
}
