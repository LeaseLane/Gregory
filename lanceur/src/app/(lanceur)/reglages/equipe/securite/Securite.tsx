'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

/* Sécurité : double authentification obligatoire (non modifiable), déconnexion après inactivité, connexions depuis le Canada seulement (exceptions datées et motivées),
   longueur du mot de passe; revue trimestrielle (chaque compte confirmé ou retiré avant la fermeture); responsable de la protection des renseignements personnels. */
type Ex = { user_id: string; raison: string; jusqu: string };
export type DonneesSecurite = { reglages: { inactivite_minutes: number; canada_seulement: boolean; mdp_min: number; exceptions: Ex[] };
  responsable: { user_id: string; nom: string; courriel: string; titre: string | null; telephone: string | null } | null; membres: { user_id: string; nom: string }[]; sans_2fa: number };
export type DonneesRevue = { trimestre: string; ouverte: boolean; fermee_le: string | null; fermee_par: string; precedente: { trimestre: string; fermee_le: string | null } | null;
  comptes: { user_id: string; nom: string; role: string; decision: string | null; par: string; derniere_connexion: string | null }[] };

export function Securite({ donnees: D, revue: R, erreurLecture }: { donnees: DonneesSecurite | null; revue: DonneesRevue | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [envoi, setEnvoi] = useState(false);
  const [f, setF] = useState(D ? { ...D.reglages, responsable_prp: D.responsable?.user_id ?? '' } : null);
  if (!D || !f) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  async function rpc(nom: string, p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc(nom, { p });
    setEnvoi(false); if (error) { setBandeau(error.message); return false; } setOk(msg); router.refresh(); return true;
  }
  const decides = R?.comptes.filter((c) => c.decision).length ?? 0;
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <form className="carte-l18" aria-label="Connexion et sessions" onSubmit={(e) => { e.preventDefault(); rpc('lanceur_securite_maj', f, 'Réglages de sécurité enregistrés.'); }}>
          <h2 className="titre-carte" style={{ marginBottom: 2 }}>Connexion et sessions</h2><p className="gris texte-13" style={{ margin: '0 0 16px' }}>S’applique à toute l’équipe · chaque changement est inscrit au journal</p>
          <ul className="lo-docs">
            <li><span className="a-faire-ic"><Icone nom="lock" taille={18} couleur="#0C2147" /></span><div><strong>Double authentification obligatoire</strong><span className="gris texte-13">Pour chaque membre, à chaque connexion{D.sans_2fa ? ` · ${D.sans_2fa} compte${D.sans_2fa > 1 ? 's' : ''} sans facteur activé` : ''}</span></div><span className="puce info">Toujours</span></li>
            <li><span className="a-faire-ic"><Icone nom="clock" taille={18} couleur="#0C2147" /></span><div><strong>Déconnexion après inactivité</strong><span className="gris texte-13">Sans frappe ni clic pendant ce délai</span></div>
              <select className="e70-raison" style={{ width: 140 }} value={f.inactivite_minutes} onChange={(e) => setF({ ...f, inactivite_minutes: Number(e.target.value) })} aria-label="Délai d’inactivité">
                {[15, 30, 60, 120, 240].map((m) => <option key={m} value={m}>{m < 60 ? `${m} minutes` : `${m / 60} heure${m > 60 ? 's' : ''}`}</option>)}</select></li>
            <li><span className="a-faire-ic"><Icone nom="globe" taille={18} couleur="#0C2147" /></span><div><strong>Connexions depuis le Canada seulement</strong><span className="gris texte-13">Une connexion d’ailleurs est refusée et inscrite au journal d’accès</span></div>
              <label className="lo-bascule"><input type="checkbox" role="switch" checked={f.canada_seulement} onChange={(e) => setF({ ...f, canada_seulement: e.target.checked })} aria-label="Canada seulement" /><i /></label></li>
            <li><span className="a-faire-ic"><Icone nom="key" taille={18} couleur="#0C2147" /></span><div><strong>Longueur minimale du mot de passe</strong><span className="gris texte-13">À la création et au changement</span></div>
              <select className="e70-raison" style={{ width: 140 }} value={f.mdp_min} onChange={(e) => setF({ ...f, mdp_min: Number(e.target.value) })} aria-label="Longueur minimale">{[10, 12, 14, 16].map((n) => <option key={n} value={n}>{n} caractères</option>)}</select></li></ul>
          {f.canada_seulement && <><p className="fenetre-lib" style={{ marginTop: 16 }}>Exceptions (voyage, 90 jours au plus)</p>
            {f.exceptions.map((x, i) => <div key={i} className="ec-ligne" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr) 150px 36px' }}>
              <select className="e70-raison" value={x.user_id} onChange={(e) => setF({ ...f, exceptions: f.exceptions.map((y, j) => j === i ? { ...y, user_id: e.target.value } : y) })} aria-label="Personne">
                <option value="">Personne</option>{D.membres.map((m) => <option key={m.user_id} value={m.user_id}>{m.nom}</option>)}</select>
              <input className="e70-raison" placeholder="Raison" value={x.raison} onChange={(e) => setF({ ...f, exceptions: f.exceptions.map((y, j) => j === i ? { ...y, raison: e.target.value } : y) })} />
              <input className="e70-raison" type="date" value={x.jusqu} onChange={(e) => setF({ ...f, exceptions: f.exceptions.map((y, j) => j === i ? { ...y, jusqu: e.target.value } : y) })} aria-label="Jusqu’au" />
              <button type="button" className="haut-ibtn" aria-label="Retirer" onClick={() => setF({ ...f, exceptions: f.exceptions.filter((_, j) => j !== i) })}><Icone nom="close" taille={14} couleur="#3E4A59" /></button></div>)}
            <button type="button" className="lien ligne-ic" onClick={() => setF({ ...f, exceptions: [...f.exceptions, { user_id: '', raison: '', jusqu: '' }] })}><Icone nom="plus" taille={16} couleur="#2E5788" />Ajouter une exception</button></>}
          <p className="fenetre-lib" style={{ marginTop: 20 }}>Responsable de la protection des renseignements personnels</p>
          <select className="e70-raison" value={f.responsable_prp} onChange={(e) => setF({ ...f, responsable_prp: e.target.value })} aria-label="Responsable"><option value="">À désigner</option>{D.membres.map((m) => <option key={m.user_id} value={m.user_id}>{m.nom}</option>)}</select>
          <p className="gris texte-12">Son nom et ses coordonnées sont publiés dans la politique de confidentialité (Loi 25, art. 3.1).</p>
          <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px', marginTop: 8 }} disabled={envoi}>Enregistrer</button>
        </form>
        <section className="carte-l18" aria-label="Revue trimestrielle des accès">
          <h2 className="titre-carte" style={{ marginBottom: 2 }}>Revue trimestrielle des accès</h2>
          <p className="gris texte-13" style={{ margin: '0 0 12px' }}>{R ? `${R.trimestre.replace('-T', ' · trimestre ')}${R.fermee_le ? ` · fermée le ${new Date(R.fermee_le).toLocaleDateString('fr-CA')} par ${R.fermee_par}` : R.ouverte ? ` · ${decides} sur ${R.comptes.length} décidés` : ''}` : '—'}</p>
          {R && !R.ouverte && <><p className="texte-13">Chaque trimestre, confirmez que chaque personne a encore besoin de son accès.{R.precedente ? ` Dernière revue : ${R.precedente.trimestre}.` : ''}</p>
            <button className="bouton bouton-principal" disabled={envoi} onClick={() => rpc('lanceur_revue_action', { action: 'ouvrir' }, 'Revue ouverte.')}>Commencer la revue</button></>}
          {R?.ouverte && <><ul className="lo-docs">{R.comptes.map((c) => <li key={c.user_id} className="texte-13"><div><strong>{c.nom} · {c.role}</strong><span className="gris">Dernière connexion : {c.derniere_connexion ? new Date(c.derniere_connexion).toLocaleDateString('fr-CA') : 'jamais'}</span></div>
            {c.decision ? <span className={`puce ${c.decision === 'confirme' ? 'info' : 'neutral'}`}>{c.decision === 'confirme' ? 'Confirmé' : 'Retiré'}</span>
              : !R.fermee_le && <span className="ligne-ic"><button className="lien" onClick={() => rpc('lanceur_revue_action', { action: 'confirme', user_id: c.user_id }, `${c.nom} : accès confirmé.`)}>Confirmer</button>
                <button className="lien rouge-txt" onClick={() => rpc('lanceur_revue_action', { action: 'retire', user_id: c.user_id }, `${c.nom} : accès retiré.`)}>Retirer</button></span>}</li>)}</ul>
            {!R.fermee_le && <button className="bouton bouton-principal" style={{ marginTop: 12 }} disabled={envoi || decides < R.comptes.length} onClick={() => rpc('lanceur_revue_action', { action: 'fermer' }, 'Revue du trimestre fermée.')}>Fermer la revue</button>}</>}
        </section>
      </div>
    </>
  );
}
