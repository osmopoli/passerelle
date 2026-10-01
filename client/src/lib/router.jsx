import { useSyncExternalStore } from 'react';

// Mini-routeur basé sur l'History API : Express renvoie déjà index.html pour
// toute route hors /api, ce qui évite d'ajouter une dépendance.

const NAV_EVENT = 'passerelle:navigate';

function subscribe(callback) {
  window.addEventListener('popstate', callback);
  window.addEventListener(NAV_EVENT, callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener(NAV_EVENT, callback);
  };
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export const withBase = (to) => BASE + to;

function getLocation() {
  const { pathname, search } = window.location;
  const path = BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname;
  return path + search;
}

export function useLocation() {
  const href = useSyncExternalStore(subscribe, getLocation);
  const url = new URL(href, window.location.origin);
  return { pathname: url.pathname, searchParams: url.searchParams };
}

export function navigate(to, { replace = false } = {}) {
  if (to === getLocation()) return;
  // Mémorise la page d'origine pour permettre un vrai « retour » (filtres conservés).
  const state = replace ? window.history.state : { from: getLocation() };
  window.history[replace ? 'replaceState' : 'pushState'](state, '', withBase(to));
  window.dispatchEvent(new Event(NAV_EVENT));
}

export const canGoBack = () => Boolean(window.history.state?.from);

export function Link({ to, onClick, ...props }) {
  function handleClick(event) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigate(to);
    window.scrollTo(0, 0);
  }

  return <a href={withBase(to)} onClick={handleClick} {...props} />;
}
