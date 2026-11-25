/* Dates et heures du portail locataire dans la langue choisie : le français garde les formats de composants/portail (« 1er mars »),
   l'anglais donne « Mar 1 », « March 1, 2026 », « 3:30 p.m. » (jour du calendrier à Québec). */
import { dateCourte as dcFr, dateLongue as dlFr } from '@/composants/portail/format';
import { heureQc as hFr, jourQc as jFr } from '@/composants/portail/dates';

const FUSEAU = 'America/Toronto';
const en = (locale: string) => locale.startsWith('en');
const jourIso = (iso: string) => iso.length === 10 ? iso : new Date(iso).toLocaleDateString('en-CA', { timeZone: FUSEAU });
const midi = (iso: string) => new Date(`${jourIso(iso)}T12:00:00`);

export const dateLongueL = (iso: string, locale: string) => en(locale) ? midi(iso).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' }) : dlFr(iso);
export const dateCourteL = (iso: string, locale: string, annee = false) => en(locale) ? midi(iso).toLocaleDateString('en-CA', annee ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric' }) : dcFr(iso, annee);
export const heureQcL = (iso: string, locale: string) => en(locale) ? new Intl.DateTimeFormat('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: FUSEAU }).format(new Date(iso)) : hFr(iso);
export const jourQcL = (iso: string, locale: string, mois: 'short' | 'long' = 'short') => en(locale) ? new Date(iso).toLocaleDateString('en-CA', { month: mois, day: 'numeric', timeZone: FUSEAU }) : jFr(iso, mois);
export const moisAnneeL = (iso: string, locale: string) => { const s = midi(iso).toLocaleDateString(locale, { month: 'long', year: 'numeric' }); return en(locale) ? s : s[0].toUpperCase() + s.slice(1); };
export const tailleL = (n: number | null | undefined, locale: string) => n == null ? '' : en(locale) ? (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`) : (n > 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(n / 1e3))} ko`);
