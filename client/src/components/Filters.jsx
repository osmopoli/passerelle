import { CATEGORIES, TYPES } from '../lib/constants.js';

const TYPE_OPTIONS = [{ value: '', label: 'Tout' }, ...TYPES.map((t) => ({ ...t, label: `${t.label}s` }))];

export default function Filters({ type, category, onChange }) {
  return (
    <form
      className="flex flex-col gap-4 sm:flex-row sm:items-end"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Filtrer les annonces"
    >
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-700">Type</legend>
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {TYPE_OPTIONS.map((option) => (
            <label key={option.value || 'all'} className="cursor-pointer">
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={type === option.value}
                onChange={() => onChange({ type: option.value, category })}
                className="peer sr-only"
              />
              <span className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-600 peer-checked:bg-white peer-checked:text-emerald-800 peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col sm:min-w-56">
        <label htmlFor="filter-category" className="mb-1.5 text-sm font-medium text-slate-700">
          Catégorie
        </label>
        <select
          id="filter-category"
          value={category}
          onChange={(e) => onChange({ type, category: e.target.value })}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
        >
          <option value="">Toutes les catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
