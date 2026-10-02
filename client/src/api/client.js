const TOKEN_KEY = 'passerelle_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

/** Appel JSON vers l'API ; lève une erreur { status, message, fields } si la réponse n'est pas OK. */
export async function api(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${import.meta.env.BASE_URL}api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const errors = data?.errors ?? [];
    const fields = {};
    for (const e of errors) if (e.field && !fields[e.field]) fields[e.field] = e.message;
    const error = new Error(errors[0]?.message ?? 'Une erreur est survenue.');
    error.status = res.status;
    error.fields = fields;
    throw error;
  }
  return data;
}
