/* Fiche de chaque adresse française (routes.js du prototype). Module léger : utilisé aussi dans le navigateur. */
import { LL_ROUTES } from '@/proto/routes';

export function routeDe(path) {
  const p = (path || '/').split('#')[0].split('?')[0].replace(/\/+$/, '') || '/';
  return LL_ROUTES.find(r => r.path === p) || LL_ROUTES[0];
}
export const routesDe = page => LL_ROUTES.filter(r => r.page === page);
export const existe = path => LL_ROUTES.some(r => r.path === path);
