'use client';
import { useEffect, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { dateCourte } from '@/composants/portail/format';

/* Propriétaire · Profil · Compte de versement (19 nov. 2026). Le titulaire inscrit le compte où recevoir ses versements du 15.
   Le numéro complet n'est jamais relu (3 derniers chiffres). Toute modification : courriel immédiat au propriétaire et aucun versement
   tant que l'équipe ne l'a pas rappelé au numéro déjà au dossier. */
type Compte = { nom_compte: string | null; institution: string | null; transit: string | null; compte_fin: string | null; statut: 'aucun' | 'a_verifier' | 'verifie'; modifie_le: string | null; titulaire: boolean };

export function CompteVersement({ nomDefaut }: { nomDefaut: string }) {
  const [C, setC] = useState<Compte | null>(null), [erreur, setErreur] = useState<string | null>(null), [ok, setOk] = useState<'change' | 'pareil' | null>(null);
  const [f, setF] = useState<{ nom_compte: string; institution: string; transit: string; compte: string } | null>(null), [envoi, setEnvoi] = useState(false);
  useEffect(() => { supabaseNavigateur().rpc('portail_proprietaire_versement').then(({ data, error }) => error ? setErreur(error.message) : setC(data as Compte)); }, []);
  if (erreur && !C) return <div className="bandeau erreur" role="alert">{erreur}</div>;
  if (!C) return <p className="gris">Chargement…</p>;
  async function enregistrer() {
    if (!f) return; setEnvoi(true); setErreur(null);
    const { data, error } = await supabaseNavigateur().rpc('portail_proprietaire_versement_maj', { p: f });
    setEnvoi(false); if (error) return setErreur(error.message);
    setC(data as Compte); setF(null); setOk((data as { change?: boolean }).change === false ? 'pareil' : 'change');
  }
  return (
    <>
      <h2 className="titre-carte" style={{ marginBottom: 2 }}>Compte de versement</h2>
      <p className="gris texte-13" style={{ margin: '0 0 16px' }}>Le compte où Lease Lane verse vos revenus le 15 de chaque mois, depuis le compte en fidéicommis.</p>
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      {ok && <p className="bandeau info" role="status"><Icone nom="info" taille={16} couleur="#2E5788" />{ok === 'pareil' ? 'Rien de changé : ce compte était déjà inscrit.' : 'Enregistré. Un courriel de confirmation vous a été envoyé, et un membre de l’équipe vous appellera au numéro de votre dossier avant le prochain versement.'}</p>}
      {C.statut === 'aucun' ? <p className="gris">Aucun compte inscrit : aucun versement ne peut vous être fait.</p>
        : <dl className="po-deux" style={{ margin: '0 0 12px', rowGap: 16 }}>
            <div><dt className="fenetre-lib">Titulaire du compte</dt><dd className="fort" style={{ margin: 0 }}>{C.nom_compte ?? '—'}</dd></div>
            <div><dt className="fenetre-lib">Compte</dt><dd className="fort" style={{ margin: 0 }}>Institution {C.institution} · transit {C.transit} · compte se terminant par {C.compte_fin}</dd></div>
            <div><dt className="fenetre-lib">État</dt><dd style={{ margin: 0 }}>{C.statut === 'verifie' ? <span className="puce ok">Confirmé</span>
              : <span className="puce todo">À confirmer par l’équipe</span>}{C.modifie_le && <span className="gris texte-13" style={{ marginLeft: 8 }}>modifié le {dateCourte(C.modifie_le, true)}</span>}</dd></div>
          </dl>}
      {C.statut === 'a_verifier' && <p className="gris texte-13">Pour votre sécurité, aucun versement ne part vers un compte nouveau ou modifié avant notre appel de confirmation au numéro déjà à votre dossier.</p>}
      {!C.titulaire ? <p className="bandeau info"><Icone nom="info" taille={16} couleur="#2E5788" />Seul le titulaire du compte propriétaire peut changer le compte de versement.</p>
        : !f ? <button className="bouton bouton-contour po-bouton" style={{ width: 'auto', padding: '0 16px' }} onClick={() => { setOk(null); setF({ nom_compte: C.nom_compte ?? nomDefaut, institution: '', transit: '', compte: '' }); }}>{C.statut === 'aucun' ? 'Inscrire mon compte' : 'Changer de compte'}</button>
        : <form onSubmit={(e) => { e.preventDefault(); enregistrer(); }}>
            <p className="gris texte-13">Les numéros figurent au bas d’un chèque, ou dans « Renseignements pour dépôt direct » de votre banque en ligne.</p>
            <div className="po-deux">
              <div><label className="fenetre-lib" htmlFor="cv-n">Titulaire du compte</label><input id="cv-n" className="e70-raison" autoComplete="name" value={f.nom_compte} onChange={(e) => setF({ ...f, nom_compte: e.target.value })} /></div>
              <div><label className="fenetre-lib" htmlFor="cv-i">Institution <span>3 chiffres</span></label><input id="cv-i" className="e70-raison" inputMode="numeric" maxLength={3} value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} /></div>
              <div><label className="fenetre-lib" htmlFor="cv-t">Transit <span>5 chiffres</span></label><input id="cv-t" className="e70-raison" inputMode="numeric" maxLength={6} value={f.transit} onChange={(e) => setF({ ...f, transit: e.target.value })} /></div>
              <div><label className="fenetre-lib" htmlFor="cv-c">Numéro de compte <span>5 à 12 chiffres</span></label><input id="cv-c" className="e70-raison" inputMode="numeric" autoComplete="off" maxLength={16} value={f.compte} onChange={(e) => setF({ ...f, compte: e.target.value })} /></div>
            </div>
            <div className="a-faire-actions" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="bouton bouton-contour po-bouton" onClick={() => setF(null)}>Annuler</button>
              <button className="bouton bouton-principal po-bouton" disabled={envoi || !f.nom_compte.trim() || !f.institution || !f.transit || !f.compte}>Enregistrer le compte</button></div>
          </form>}
    </>
  );
}
