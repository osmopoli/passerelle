import { useState } from 'react';
import { api, setToken } from '../api/client.js';
import Field, { FormError, ZoneSelect, inputClass } from './Field.jsx';

const EMPTY = { fullName: '', email: '', password: '', zone: '' };

export default function AuthScreen({ zones, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const isRegister = mode === 'register';

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = isRegister ? form : { email: form.email, password: form.password };
      const data = await api(`/auth/${mode}`, { method: 'POST', body });
      setToken(data.token);
      onAuthenticated(data.user);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  const tab = (value, label) => (
    <button
      type="button"
      onClick={() => {
        setMode(value);
        setError(null);
      }}
      className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
        mode === value ? 'bg-white text-emerald-700 shadow' : 'text-slate-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow sm:p-8">
      <h1 className="text-center text-2xl font-bold text-emerald-700 sm:text-3xl">PASSERELLE</h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        Proposez ou trouvez un objet, un service ou un coup de main près de chez vous.
      </p>

      <div className="mt-6 flex gap-1 rounded-xl bg-slate-100 p-1">
        {tab('login', 'Connexion')}
        {tab('register', 'Inscription')}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {isRegister && (
          <Field label="Nom" error={error?.fields?.fullName}>
            <input
              className={inputClass}
              value={form.fullName}
              onChange={update('fullName')}
              autoComplete="name"
            />
          </Field>
        )}
        <Field label="E-mail" error={error?.fields?.email}>
          <input
            className={inputClass}
            type="email"
            value={form.email}
            onChange={update('email')}
            autoComplete="email"
          />
        </Field>
        <Field
          label="Mot de passe"
          error={error?.fields?.password}
          hint={isRegister ? '8 caractères minimum.' : null}
        >
          <input
            className={inputClass}
            type="password"
            value={form.password}
            onChange={update('password')}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
        </Field>
        {isRegister && (
          <Field label="Ma zone" error={error?.fields?.zone}>
            <ZoneSelect zones={zones} value={form.zone} onChange={update('zone')} />
          </Field>
        )}

        <FormError error={error} />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? '…' : isRegister ? 'Créer mon compte' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
