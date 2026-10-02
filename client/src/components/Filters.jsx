import { CATEGORIES, TYPES } from '../lib/constants.js';

const TYPE_OPTIONS = [{ value: '', label: 'Tout' }, ...TYPES.map((t) => ({ ...t, label: `${t.label}s` }))];

// L'option cochée prend la couleur de son type : on retrouve le même code
// (safran = offre, salouva = demande) que sur les cartes.
const CHECKED_STYLES = {
  '': 'peer-checked:bg-ink peer-checked:text-white',
  offre: 'peer-checked:bg-saffron peer-checked:text-ink',
  demande: 'peer-checked:bg-salouva peer-checked:text-white',
};

export default function Filters({ type, category, onChange }) {
  return (
    <form
      className="flex flex-col gap-4 sm:flex-row sm:items-end"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Filtrer les annonces"
    >
      <fieldset>
        <legend className="mb-1.5 font-bold">Type</legend>
        <div className="flex overflow-hidden rounded-control border-2 border-ink">
          {TYPE_OPTIONS.map((option) => (
            <label key={option.value || 'all'} className="flex-1 cursor-pointer border-ink not-first:border-l-2">
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={type === option.value}
                onChange={() => onChange({ type: option.value, category })}
                className="peer sr-only"
              />
              <span
                className={`block px-4 py-2 text-center font-bold text-ink peer-focus-visible:outline-3 peer-focus-visible:-outline-offset-4 peer-focus-visible:outline-lagoon ${CHECKED_STYLES[option.value]}`}
              >
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col sm:min-w-64">
        <label htmlFor="filter-category" className="mb-1.5 font-bold">
          Catégorie
        </label>
        <select
          id="filter-category"
          value={category}
          onChange={(e) => onChange({ type, category: e.target.value })}
          className="rounded-control border-2 border-ink bg-white px-3 py-2 text-ink"
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
