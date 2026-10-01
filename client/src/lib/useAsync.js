import { useEffect, useState } from 'react';

// Exécute `load(signal)` à chaque changement de `deps` et annule la requête
// précédente, pour qu'un filtre changé vite n'affiche pas un résultat périmé.
export function useAsync(load, deps) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ status: 'error', data: null, error });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
