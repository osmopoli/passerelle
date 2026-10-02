// Contour ink-muted (6.5:1 sur blanc) ; le focus passe par l'outline lagon
// global de index.css, l'invalidité par `aria-invalid`.
export const inputClass =
  'w-full rounded-control border-2 border-ink-muted bg-white px-3 py-2.5 text-base text-ink placeholder:text-ink-muted hover:border-ink aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:bg-mist disabled:text-ink-muted';

export default function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-ink">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-sm text-ink-muted">{hint}</span>}
      {error && <span className="mt-1 block text-sm font-bold text-danger">{error}</span>}
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
  return (
    <p className="rounded-control border-2 border-danger bg-danger-wash p-3 text-sm font-bold text-danger">
      {error.message}
    </p>
  );
}
