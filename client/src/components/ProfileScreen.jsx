import { useState } from 'react';
import { api } from '../api/client.js';
import Field, { FormError, ZoneSelect, inputClass } from './Field.jsx';

export default function ProfileScreen({ user, zones, onUpdated, onLogout }) {
  const [form, setForm] = useState({ fullName: user.fullName, zone: user.zone });
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const zoneLabel = zones.find((z) => z.value === user.zone)?.label ?? user.zone;

  async function save(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      onUpdated(await api('/me', { method: 'PATCH', body: form }));
      setSaved(true);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">Bonjour</p>
          <h1 className="truncate text-xl font-bold text-slate-800">{user.fullName}</h1>
          <p className="truncate text-sm text-slate-500">{user.email}</p>
          <p className="mt-1 text-sm font-medium text-emerald-700">Zone : {zoneLabel}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Se déconnecter
        </button>
      </div>

      <form onSubmit={save} className="mt-6 space-y-4 border-t border-slate-100 pt-6" noValidate>
        <h2 className="font-semibold text-slate-800">Mon profil</h2>
        <Field label="Nom" error={error?.fields?.fullName}>
          <input
            className={inputClass}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </Field>
        <Field label="Ma zone" error={error?.fields?.zone}>
          <ZoneSelect
            zones={zones}
            value={form.zone}
            onChange={(e) => setForm({ ...form, zone: e.target.value })}
          />
        </Field>
        <FormError error={error} />
        {saved && <p className="text-sm text-emerald-700">Profil enregistré.</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
