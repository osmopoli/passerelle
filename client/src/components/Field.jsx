export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200';

export default function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

export function ZoneSelect({ zones, ...props }) {
  return (
    <select className={inputClass} required {...props}>
      <option value="" disabled>
        Choisissez votre commune
      </option>
      {zones.map((z) => (
        <option key={z.value} value={z.value}>
          {z.label}
        </option>
      ))}
    </select>
  );
}

/** Message d'erreur global (ex. identifiants incorrects), quand aucun champ n'est en cause. */
export function FormError({ error }) {
  if (!error || Object.keys(error.fields ?? {}).length > 0) return null;
  return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error.message}</p>;
}
