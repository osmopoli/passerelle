import { useRef, useState } from 'react';
import { LISTINGS_SOURCE, createListing } from '../api/listings.js';
import { CATEGORIES, TYPES } from '../lib/constants.js';
import { EMPTY_LISTING, LISTING_LIMITS, cleanListing, validateListing } from '../lib/listingForm.js';
import { Link, navigate } from '../lib/router.jsx';

const TYPE_HINTS = {
  offre: 'Je propose un objet, un service ou un coup de main.',
  demande: "J'ai besoin d'un objet, d'un service ou d'un coup de main.",
};

const FIELD_ORDER = ['type', 'category', 'title', 'description', 'availability'];

const inputClass = (invalid) =>
  `w-full rounded-xl border bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 ${
    invalid
      ? 'border-red-500 focus:border-red-600 focus:ring-red-600/30'
      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/40'
  }`;

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-medium text-red-700">
      {message}
    </p>
  );
}

function Counter({ id, value, max }) {
  return (
    <p id={id} className={`mt-1 text-right text-xs ${value.length > max ? 'text-red-700' : 'text-slate-500'}`}>
      {value.length} / {max}
    </p>
  );
}

export default function NewListingPage({ user }) {
  const [values, setValues] = useState(EMPTY_LISTING);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState('');
  const summaryRef = useRef(null);

  function update(field, value) {
    const next = { ...values, [field]: value };
    setValues(next);
    // Après une première tentative, les erreurs se mettent à jour pendant la saisie.
    if (submitted) setErrors(validateListing(next));
  }

  function showErrors(nextErrors) {
    setErrors(nextErrors);
    // Le résumé reçoit le focus pour être annoncé par les lecteurs d'écran.
    requestAnimationFrame(() => summaryRef.current?.focus());
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setServerError('');
    const nextErrors = validateListing(values);
    if (Object.keys(nextErrors).length > 0) {
      showErrors(nextErrors);
      return;
    }

    setSending(true);
    try {
      const listing = await createListing(cleanListing(values));
      navigate(`/annonces/${encodeURIComponent(listing.id)}`, { replace: true });
      window.scrollTo(0, 0);
    } catch (error) {
      setSending(false);
      if (error.status === 401) setServerError('Votre session a expiré : reconnectez-vous pour publier.');
      else if (Object.keys(error.fields ?? {}).length > 0) showErrors(error.fields);
      else setServerError(error.message || 'La publication a échoué. Réessayez.');
    }
  }

  // Avec l'API, l'auteur et sa zone viennent du compte connecté.
  if (LISTINGS_SOURCE === 'api' && !user) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h1 className="text-2xl font-bold">Publier une annonce</h1>
        <p className="mt-2 text-slate-600">Connectez-vous pour proposer ou demander un coup de main.</p>
        <Link
          to="/connexion"
          className="mt-5 inline-block rounded-xl bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  const errorFields = FIELD_ORDER.filter((field) => errors[field]);
  const describe = (field, ...extra) =>
    [errors[field] && `${field}-error`, ...extra].filter(Boolean).join(' ') || undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold sm:text-3xl">Publier une annonce</h1>
      <p className="mt-1 text-slate-600">
        Proposez ou demandez un objet, un service ou un coup de main près de chez vous.
      </p>

      {errorFields.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="mt-6 rounded-2xl bg-red-50 p-4 text-red-800 ring-1 ring-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
        >
          <p className="font-semibold">
            {errorFields.length === 1 ? 'Un champ est à corriger :' : `${errorFields.length} champs sont à corriger :`}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {errorFields.map((field) => (
              <li key={field}>
                <a href={`#${field}`} className="underline hover:no-underline">
                  {errors[field]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {serverError && (
        <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-red-800 ring-1 ring-red-200">
          {serverError}
        </div>
      )}

      <form
        noValidate
        onSubmit={handleSubmit}
        aria-label="Publier une annonce"
        className="mt-6 space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8"
      >
        <fieldset aria-describedby={describe('type')}>
          <legend className="mb-2 font-medium text-slate-800">
            Type d'annonce <span className="text-red-700" aria-hidden="true">*</span>
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {TYPES.map((option, index) => (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  id={index === 0 ? 'type' : undefined}
                  value={option.value}
                  checked={values.type === option.value}
                  onChange={() => update('type', option.value)}
                  aria-invalid={Boolean(errors.type)}
                  required
                  className="peer sr-only"
                />
                <span
                  className={`block h-full rounded-xl border-2 p-4 peer-checked:border-emerald-600 peer-checked:bg-emerald-50 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600 peer-focus-visible:ring-offset-2 ${
                    errors.type ? 'border-red-400' : 'border-slate-200'
                  }`}
                >
                  <span className="block font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-sm text-slate-600">{TYPE_HINTS[option.value]}</span>
                </span>
              </label>
            ))}
          </div>
          <FieldError id="type-error" message={errors.type} />
        </fieldset>

        <div>
          <label htmlFor="category" className="mb-1.5 block font-medium text-slate-800">
            Catégorie <span className="text-red-700" aria-hidden="true">*</span>
          </label>
          <select
            id="category"
            value={values.category}
            onChange={(e) => update('category', e.target.value)}
            required
            aria-invalid={Boolean(errors.category)}
            aria-describedby={describe('category')}
            className={inputClass(errors.category)}
          >
            <option value="">Choisir une catégorie...</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <FieldError id="category-error" message={errors.category} />
        </div>

        <div>
          <label htmlFor="title" className="mb-1.5 block font-medium text-slate-800">
            Titre <span className="text-red-700" aria-hidden="true">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={values.title}
            onChange={(e) => update('title', e.target.value)}
            required
            maxLength={LISTING_LIMITS.title}
            placeholder="Ex. : Prêt de perceuse-visseuse"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describe('title', 'title-count')}
            className={inputClass(errors.title)}
          />
          <Counter id="title-count" value={values.title} max={LISTING_LIMITS.title} />
          <FieldError id="title-error" message={errors.title} />
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block font-medium text-slate-800">
            Description <span className="text-red-700" aria-hidden="true">*</span>
          </label>
          <textarea
            id="description"
            rows={5}
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            required
            maxLength={LISTING_LIMITS.description}
            placeholder="Décrivez ce que vous proposez ou recherchez, l'état de l'objet, les conditions..."
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describe('description', 'description-count')}
            className={inputClass(errors.description)}
          />
          <Counter id="description-count" value={values.description} max={LISTING_LIMITS.description} />
          <FieldError id="description-error" message={errors.description} />
        </div>

        <div>
          <label htmlFor="availability" className="mb-1.5 block font-medium text-slate-800">
            Disponibilité <span className="text-red-700" aria-hidden="true">*</span>
          </label>
          <p id="availability-hint" className="mb-1.5 text-sm text-slate-600">
            En texte libre : jours, horaires, lieu de remise...
          </p>
          <input
            id="availability"
            type="text"
            value={values.availability}
            onChange={(e) => update('availability', e.target.value)}
            required
            maxLength={LISTING_LIMITS.availability}
            placeholder="Ex. : Le week-end, à récupérer chez moi"
            aria-invalid={Boolean(errors.availability)}
            aria-describedby={describe('availability', 'availability-hint')}
            className={inputClass(errors.availability)}
          />
          <FieldError id="availability-error" message={errors.availability} />
        </div>

        <p className="text-sm text-slate-500">
          <span className="text-red-700" aria-hidden="true">*</span> Tous les champs sont obligatoires.
        </p>

        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
        >
          {sending ? 'Publication...' : "Publier l'annonce"}
        </button>
      </form>
    </div>
  );
}
