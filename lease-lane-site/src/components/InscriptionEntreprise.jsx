/** @jsxImportSource @/lib/i18n */
'use client';
/* Page « Inscrire mon entreprise » (/inscrire-mon-entreprise, /en/list-your-business) : port du prototype de la livraison
   design (_documents/livraisons-design/inscrire-mon-entreprise/prototype/index.html, sans la barre « Mode revue »). Styles : src/styles/inscription.css (préfixe ie-).
   Envoi : envoyerInscription (src/lib/envoi.js), POST multipart vers la fonction inscription-entreprise.
   La confirmation ne s'affiche qu'après la réponse ok du serveur (demande et document enregistrés). */
import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ds';
import { envoyerInscription } from '@/lib/envoi';
import { useLangue } from '@/lib/i18n/contexte';
import { AppelInscription } from '@/components/AppelInscription';
export { AppelInscription };

const MAX = 10 * 1024 * 1024, TYPES = ['application/pdf', 'image/jpeg', 'image/png'], EXT = /\.(pdf|jpe?g|png)$/i;
const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
const M = {
  fichier: 'Joignez votre preuve d’assurance (PDF, JPG ou PNG, 10 Mo maximum).',
  format: 'Ce format n’est pas accepté. Choisissez un PDF, un JPG ou un PNG.',
  taille: 'Ce fichier dépasse 10 Mo. Choisissez un PDF, un JPG ou un PNG de 10 Mo ou moins.',
  telVide: 'Entrez votre numéro de téléphone.',
  tel: 'Entrez un numéro à 10 chiffres, par exemple 418 555-0142.',
  poste: 'Chiffres seulement.',
  courrielVide: 'Entrez votre adresse courriel.',
  courriel: 'Ce courriel semble incomplet. Exemple : vous@entreprise.ca',
  doublon: 'Ce courriel est déjà associé à un compte.',
};
/* Questions fréquentes : mêmes textes que le JSON-LD FAQPage des deux page.tsx. */
const FAQ = [
  ['L’inscription est-elle gratuite?', 'Oui. Vous transmettez votre preuve d’assurance, votre téléphone et votre courriel, sans frais.'],
  ['Ma preuve d’assurance sera-t-elle publique?', 'Non. Elle est transmise à l’équipe Lease Lane pour traiter votre inscription et n’est jamais affichée publiquement.'],
  ['Pourquoi ne demandez-vous pas mes services tout de suite?', 'Pour que l’inscription reste courte. Vos services, vos régions, la description de votre entreprise et vos photos se remplissent ensuite dans la plateforme.'],
  ['Puis-je envoyer une photo de mon document?', 'Oui. Sur téléphone, choisissez « Prendre une photo ». Assurez-vous que le document est lisible. Formats acceptés : PDF, JPG et PNG, 10 Mo maximum.'],
  ['Mon courriel est déjà inscrit. Que faire?', 'Connectez-vous à la plateforme ou récupérez votre accès. Inutile de vous inscrire une deuxième fois.'],
];

const chiffres = v => v.replace(/\D/g, '');
const telValide = v => /^[\d\s().+-]+$/.test(v) && (chiffres(v).length === 10 || (chiffres(v).length === 11 && chiffres(v)[0] === '1'));
/* Même règle que le serveur (_shared/inscription.ts). */
const courrielValide = v => v.length <= 200 && /^[^\s@<>"\\,;:()[\]]+@[^\s@<>"'\\,;:()[\]]+\.[^\s@<>"'\\,;:()[\]]{2,}$/.test(v);
const cle = () => (crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)));
const Ic = ({ n, s = 20, cls = '' }) => <Icon name={n} size={s} className={'ie-ic ' + cls} />;

/* Erreur sous un champ (rendue seulement en erreur : aria-describedby ne pointe que vers un texte visible). */
const Erreur = ({ id, msg }) => msg ? <p className="ie-erreur" id={id}><Ic n="circle-alert" s={16} /><span>{msg}</span></p> : null;

export default function InscriptionEntreprise() {
  const en = useLangue() === 'en';
  const [fichier, setFichier] = useState(null);
  const [err, setErr] = useState({});
  const [message, setMessage] = useState(null); // null | 'echec' | 'doublon'
  const [texteEchec, setTexteEchec] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState('');
  const [survol, setSurvol] = useState(false);
  const enCours = useRef(false), idem = useRef(null), aFocaliser = useRef(null);
  const carte = useRef(null), conf = useRef(null), msg = useRef(null);

  useEffect(() => { if (envoye) { conf.current?.focus({ preventScroll: true }); carte.current?.scrollIntoView({ block: 'start' }); } }, [envoye]);
  useEffect(() => { if (message) msg.current?.scrollIntoView({ block: 'center' }); }, [message]);
  /* Focus sur le champ en erreur, après le rendu (la zone de dépôt peut réapparaître). */
  useEffect(() => { const k = aFocaliser.current; if (k) { aFocaliser.current = null; document.getElementById(k)?.focus(); } });

  const fixer = (k, v) => setErr(e => (e[k] === v ? e : { ...e, [k]: v }));
  const taille = o => o < 1024 * 1024 ? Math.max(1, Math.round(o / 1024)) + (en ? ' KB' : ' Ko') : (o / 1024 / 1024).toFixed(1).replace('.', en ? '.' : ',') + (en ? ' MB' : ' Mo');

  function choisir(f) {
    if (!f) return;
    if (!(TYPES.includes(f.type) || EXT.test(f.name))) { setFichier(null); return fixer('fichier', M.format); }
    if (f.size > MAX) { setFichier(null); return fixer('fichier', M.taille); }
    setFichier(f); fixer('fichier', null);
  }
  const auChoix = e => { choisir(e.target.files[0]); e.target.value = ''; };
  const glisser = e => { e.preventDefault(); setSurvol(e.type === 'dragenter' || e.type === 'dragover'); if (e.type === 'drop') choisir(e.dataTransfer.files[0]); };

  async function soumettre(e) {
    e.preventDefault();
    if (enCours.current) return; // un seul envoi, même au double clic
    setMessage(null);
    const f = e.currentTarget, tel = f.telephone.value.trim(), poste = f.poste.value.trim(), courriel = f.courriel.value.trim();
    const n = {
      fichier: fichier ? null : M.fichier,
      telephone: !tel ? M.telVide : telValide(tel) ? null : M.tel,
      poste: poste && !/^\d{1,6}$/.test(poste) ? M.poste : null,
      courriel: !courriel ? M.courrielVide : courrielValide(courriel) ? null : M.courriel,
    };
    setErr(n);
    const premier = Object.keys(n).find(k => n[k]);
    if (premier) { aFocaliser.current = premier; return; }

    enCours.current = true; setEnvoi(true);
    idem.current = idem.current || cle();
    const fd = new FormData();
    fd.set('courriel', courriel); fd.set('telephone', tel); fd.set('poste', poste); fd.set('document', fichier);
    fd.set('idempotency_key', idem.current); fd.set('website', f.website.value);
    let res;
    try { res = await envoyerInscription(fd); } catch { res = { ok: false, code: 'transmission' }; }
    enCours.current = false; setEnvoi(false);
    if (res.ok) return setEnvoye(courriel);
    if (res.code === 'compte_existant') { setMessage('doublon'); fixer('courriel', M.doublon); return; }
    const k = res.champ === 'document' ? 'fichier' : res.champ;
    if (res.code === 'champ' && ['fichier', 'telephone', 'poste', 'courriel'].includes(k)) {
      if (k === 'fichier') setFichier(null);
      fixer(k, res.error || { fichier: M.format, telephone: M.tel }[k] || M[k]);
      aFocaliser.current = k; return;
    }
    /* Transmission (ou limite) : coordonnées gardées, document à joindre de nouveau, nouvelle tentative = nouvelle clé. */
    idem.current = null; setFichier(null);
    setTexteEchec(res.code === 'limite' && res.error ? res.error : '');
    setMessage('echec');
  }

  const decrit = (k, aide) => (err[k] ? 'e-' + k : aide) || undefined;
  const inval = k => (err[k] ? 'true' : 'false');
  const champ = k => ({ id: k, name: k, 'aria-invalid': err[k] ? 'true' : undefined, onInput: () => fixer(k, null) });
  const joint = !!fichier;

  return <div className="ie">
    <section className="ie-bandeau" aria-labelledby="ie-titre">
      <svg className="ie-chevrons" viewBox="0 0 560 600" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><g fill="none" strokeWidth="64"><path d="M40 -60 L310 270 L40 600" stroke="#2E5788" opacity=".55" /><path d="M200 -60 L470 270 L200 600" stroke="#2E5788" opacity=".55" /><path d="M360 -60 L630 270 L360 600" stroke="#3767A2" opacity=".45" /></g></svg>
      <div className="ie-conteneur">
        <nav aria-label="Fil d'Ariane"><ol className="ie-fil"><li><a href="/">Accueil</a></li><li><span aria-current="page">Inscrire mon entreprise</span></li></ol></nav>
        <span className="ie-surtitre">Entrepreneurs et travailleurs autonomes</span>
        <h1 id="ie-titre">Faites découvrir <span>votre entreprise</span></h1>
        <p className="ie-chapeau">Inscrivez-vous gratuitement avec Lease Lane pour donner plus de visibilité à vos services et permettre à de nouveaux clients de découvrir votre entreprise.</p>
        <ul className="ie-reperes">
          <li><Ic n="tag" s={18} />Inscription gratuite</li>
          <li><Ic n="list" s={18} />Trois éléments seulement</li>
          <li><Ic n="lock" s={18} />Assurance jamais publiée</li>
        </ul>
      </div>
    </section>

    <section className="ie-carte-zone" id="inscription" aria-label="Formulaire d’inscription">
      <div className="ie-conteneur">
        <div className="ie-carte" ref={carte} data-envoye={envoye ? 'true' : 'false'}>
          <aside className="ie-colonne" aria-label="Ce qu’on vous demande">
            <span className="ie-surtitre">Ce qu’on vous demande</span>
            <ul className="ie-demandes">
              <li><span className="ie-pastille-nuit"><Ic n="shield-check" /></span><div><strong>Votre preuve d’assurance</strong><span>Jamais affichée publiquement</span></div></li>
              <li><span className="ie-pastille-nuit"><Ic n="phone" /></span><div><strong>Votre téléphone</strong><span>Avec un poste, au besoin</span></div></li>
              <li><span className="ie-pastille-nuit"><Ic n="mail" /></span><div><strong>Votre courriel</strong><span>Pour la confirmation et l’accès</span></div></li>
            </ul>
            <hr />
            <span className="ie-surtitre ie-ensuite-titre">Ensuite, dans la plateforme</span>
            <ul className="ie-ensuite">
              {['Vos services', 'Les régions que vous desservez', 'La description de votre entreprise', 'Vos photos'].map(x => <li key={x}><Ic n="check" s={18} />{x}</li>)}
            </ul>
            <p className="ie-connexion">Déjà inscrit? <a href="/connexion">Se connecter <Ic n="arrow-right" s={18} /></a></p>
          </aside>

          {!envoye && <div className="ie-formulaire">
            <h2>Commencez votre inscription</h2>
            <p className="ie-sous-titre">Trois champs obligatoires, marqués d’un *. Le reste se complète dans la plateforme.</p>

            <form noValidate onSubmit={soumettre}>
              {message === 'echec' && <div className="ie-message ie-message-erreur" role="alert" ref={msg}>
                <Ic n="triangle-alert" />
                <div><strong>L’envoi n’a pas fonctionné</strong><p>{texteEchec || 'Vos coordonnées sont conservées. Joignez de nouveau votre preuve d’assurance, puis réessayez.'}</p></div>
              </div>}
              {message === 'doublon' && <div className="ie-message ie-message-info" role="alert" ref={msg}>
                <Ic n="info" />
                <div><strong>Ce courriel est déjà associé à un compte</strong><p>Votre inscription est déjà dans la plateforme : connectez-vous ou récupérez votre accès.</p>
                  <div className="ie-actions"><a className="ie-btn ie-btn-plein ie-btn-s" href="/connexion">Se connecter</a><a className="ie-btn ie-btn-contour ie-btn-s" href="/connexion">Récupérer mon accès</a></div></div>
              </div>}

              {/* Pot de miel : laissé vide par les personnes, rempli par les robots. */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="ie-sr" defaultValue="" />

              <div className="ie-groupe" data-invalide={inval('fichier')} data-joint={joint ? 'true' : 'false'}>
                <span className="ie-libelle" id="l-fichier">Preuve d’assurance *</span>
                <div className={'ie-depot' + (survol ? ' ie-survol' : '')} onDragEnter={glisser} onDragOver={glisser} onDragLeave={glisser} onDrop={glisser}>
                  <span className="ie-cercle"><Ic n="upload" s={22} /></span>
                  <div>
                    <strong className="ie-glisser">Glissez votre document ici ou <em>choisissez un fichier</em></strong>
                    <strong className="ie-photo-titre">Joignez votre preuve d’assurance</strong>
                    <span id="a-fichier">PDF, JPG ou PNG · 10 Mo maximum</span>
                  </div>
                  <div className="ie-photo">
                    <label className="ie-btn ie-btn-contour"><input type="file" className="ie-sr" accept={ACCEPT} onChange={auChoix} />Choisir un fichier <Ic n="paperclip" /></label>
                    <label className="ie-btn ie-btn-plein"><input type="file" className="ie-sr" accept="image/jpeg,image/png" capture="environment" onChange={auChoix} />Prendre une photo <Ic n="camera" /></label>
                  </div>
                  <input type="file" id="fichier" accept={ACCEPT} aria-labelledby="l-fichier" aria-describedby={decrit('fichier', 'a-fichier')} aria-invalid={err.fichier ? 'true' : undefined} aria-required="true" onChange={auChoix} />
                </div>
                {joint && <div className="ie-joint">
                  <span className="ie-pastille"><Ic n="file-text" /></span>
                  <div><strong>{fichier.name}</strong><span className="ie-etat"><Ic n="circle-check" s={16} /><span>{taille(fichier.size)}</span><span>· prêt à envoyer</span></span></div>
                  <button className="ie-lien-btn" type="button" onClick={() => document.getElementById('fichier')?.click()}>Remplacer</button>
                  <button className="ie-retirer" type="button" aria-label="Retirer le document" onClick={() => { setFichier(null); aFocaliser.current = 'fichier'; }}><Ic n="trash-2" /></button>
                </div>}
                <Erreur id="e-fichier" msg={err.fichier} />
              </div>

              <div className="ie-rangee">
                <div className="ie-groupe" data-invalide={inval('telephone')}>
                  <label htmlFor="telephone">Téléphone *</label>
                  <div className="ie-boite"><Ic n="phone" /><input {...champ('telephone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="418 555-0142" aria-describedby={decrit('telephone', 'a-telephone')} aria-required="true"
                    onBlur={e => { const v = e.target.value.trim(); if (v) fixer('telephone', telValide(v) ? null : M.tel); }} /></div>
                  {!err.telephone && <p className="ie-aide" id="a-telephone">Espaces, parenthèses et tirets acceptés.</p>}
                  <Erreur id="e-telephone" msg={err.telephone} />
                </div>
                <div className="ie-groupe" data-invalide={inval('poste')}>
                  <label htmlFor="poste">Poste <span className="ie-facultatif">facultatif</span></label>
                  <div className="ie-boite"><input {...champ('poste')} type="text" inputMode="numeric" autoComplete="tel-extension" placeholder="123" aria-describedby={decrit('poste')} /></div>
                  <Erreur id="e-poste" msg={err.poste} />
                </div>
              </div>

              <div className="ie-groupe" data-invalide={inval('courriel')}>
                <label htmlFor="courriel">Courriel *</label>
                <div className="ie-boite"><Ic n="mail" /><input {...champ('courriel')} type="email" inputMode="email" autoComplete="email" placeholder="vous@entreprise.ca" aria-describedby={decrit('courriel', 'a-courriel')} aria-required="true"
                  onBlur={e => { const v = e.target.value.trim(); if (v) fixer('courriel', courrielValide(v) ? null : M.courriel); }} /></div>
                {!err.courriel && <p className="ie-aide" id="a-courriel">Sert à la confirmation et à l’accès à la plateforme.</p>}
                <Erreur id="e-courriel" msg={err.courriel} />
              </div>

              <p className="ie-confidentialite"><Ic n="lock" /><span>Ces renseignements sont transmis à l’équipe Lease Lane pour traiter votre inscription et vous contacter à ce sujet. Votre preuve d’assurance ne sera pas affichée publiquement. <a href="/confidentialite">Politique de confidentialité</a></span></p>

              <button className="ie-btn ie-btn-plein ie-envoyer" type="submit" aria-disabled={envoi ? 'true' : undefined}>
                {envoi ? <Ic n="loader-circle" cls="ie-tourne" /> : null}
                <span>{envoi ? 'Envoi en cours…' : 'Envoyer mon inscription gratuite'}</span>
                {envoi ? null : <Ic n="send" />}
              </button>
              <p className="ie-connexion-mobile">Déjà inscrit? <a href="/connexion"><strong>Se connecter</strong></a></p>
            </form>
          </div>}

          {envoye && <div className="ie-confirmation" tabIndex={-1} role="status" ref={conf}>
            <div className="ie-cercle-ok"><Ic n="circle-check" s={40} /></div>
            <h2>Votre demande d’inscription a bien été reçue!</h2>
            <p>Merci de votre intérêt pour Lease Lane. Nous avons reçu vos coordonnées et votre preuve d’assurance. Vous recevrez par courriel les prochaines étapes pour accéder à la plateforme et compléter votre profil.</p>
            <ul className="ie-suites">
              <li><span className="ie-pastille"><Ic n="mail" /></span><div><strong>Courriel de confirmation</strong><span>{envoye}</span></div></li>
              <li><span className="ie-pastille"><Ic n="key-round" /></span><div><strong>Accès à la plateforme</strong><span>Les étapes arrivent par courriel</span></div></li>
              <li><span className="ie-pastille"><Ic n="layers" /></span><div><strong>Votre profil</strong><span>À compléter dans la plateforme</span></div></li>
            </ul>
            <a className="ie-btn ie-btn-contour" href="/">Retour à l’accueil</a>
          </div>}
        </div>
      </div>
    </section>

    <section className="ie-parcours" aria-labelledby="t-parcours">
      <div className="ie-conteneur">
        <span className="ie-surtitre">Comment ça fonctionne</span>
        <h2 id="t-parcours">De l’inscription à votre profil</h2>
        <p className="ie-intro">Une inscription courte sur le site, puis votre profil complet dans la plateforme.</p>
        <ol className="ie-etapes">
          {[['send', 'Étape 1', 'Envoyez vos trois éléments', 'Preuve d’assurance, téléphone et courriel, depuis un ordinateur ou un téléphone.'],
            ['mail', 'Étape 2', 'Recevez la confirmation', 'Un courriel confirme la réception de votre inscription.'],
            ['key-round', 'Étape 3', 'Accédez à la plateforme', 'Le même courriel vous indique comment activer votre accès.'],
            ['layers', 'Étape 4', 'Complétez votre profil', 'Services, régions, description et photos : vous les ajoutez vous-même.']].map(([ic, n, t, d]) =>
            <li key={n}><span className="ie-rond"><Ic n={ic} s={24} /></span><small>{n}</small><h3>{t}</h3><p>{d}</p></li>)}
        </ol>
      </div>
    </section>

    <section className="ie-faq" aria-labelledby="t-faq">
      <div className="ie-conteneur">
        <div>
          <span className="ie-surtitre">Questions fréquentes</span>
          <h2 id="t-faq">Avant de vous inscrire</h2>
          <p className="ie-intro">Une autre question? Écrivez à l’équipe ou posez-la à Cléo, notre agent IA.</p>
          <a className="ie-btn ie-btn-contour" href="/nous-joindre#ecrire">Écrire à l’équipe <Ic n="mail" /></a>
        </div>
        <div className="ie-questions">
          {FAQ.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}<span className="ie-plus"><Ic n="plus" s={16} /></span></summary><p>{a}</p></details>)}
        </div>
      </div>
    </section>

    <AppelInscription />
  </div>;
}
