/* Registre Loi 25 partagé entre les portails (prototype : stocké dans le navigateur).
   Une demande créée depuis l'espace locataire ou propriétaire apparaît dans le registre admin, échéance à 30 jours. */
(()=>{
  const CLE='ll-loi25-demandes';
  const MOIS=['janv.','févr.','mars','avr.','mai','juin','juill.','août','sept.','oct.','nov.','déc.'];
  const loc=v=>v?(/^\d{4}-\d{2}-\d{2}$/.test(v)?new Date(v+'T00:00'):new Date(v)):new Date();
  const fmt=d=>d.getDate()+' '+MOIS[d.getMonth()];
  const lire=()=>{try{return JSON.parse(localStorage.getItem(CLE))||[]}catch(e){return []}};
  const ecrire=l=>{try{localStorage.setItem(CLE,JSON.stringify(l))}catch(e){}};
  window.LLLoi25={
    lister:lire,loc,
    fmt,
    echeance(recue){const d=loc(recue);d.setDate(d.getDate()+30);return d},
    ajouter({type,qui,recue,identite,source}){
      const l=lire(), r=loc(recue), e=new Date(r);e.setDate(e.getDate()+30);
      const n=19+l.length;
      const dem={id:'DR-2026-'+String(n).padStart(3,'0'),type,qui,recue:fmt(r),echeance:fmt(e),etat:'Reçue',ton:'bleu',
        jours:Math.max(0,Math.round((e-new Date())/864e5)),identite:!!identite,source:source||'portail'};
      ecrire([dem,...l]);window.dispatchEvent(new Event('ll-loi25'));return dem;
    }
  };
})();
