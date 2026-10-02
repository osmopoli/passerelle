// Chemin de retour après connexion (`/connexion?redirect=/annonces/3`).
// N'accepte qu'un chemin interne : pas de `//hote`, pas de `/\hote`, et aucun
// caractère de contrôle (le parseur d'URL supprime tab/CR/LF, si bien que
// « /\t/evil.com » deviendrait « //evil.com »).
const INTERNAL_PATH = /^\/(?![/\\])[^\x00-\x1f\x7f]*$/;

export function safeRedirect(value) {
  return typeof value === 'string' && INTERNAL_PATH.test(value) ? value : '/';
}

export const loginPath = (redirect) => `/connexion?redirect=${encodeURIComponent(redirect)}`;
