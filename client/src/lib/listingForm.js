import { isValidCategory, isValidType } from './constants.js';

// Maximums de LIMITS (`server/app/constants/domain.ts`). Comme le validateur
// VineJS de PAND-7 (`minLength(1)` après trim), un champ non vide suffit.
export const LISTING_LIMITS = {
  title: 120,
  description: 2000,
  availability: 255,
};

export const EMPTY_LISTING = { type: '', category: '', title: '', description: '', availability: '' };

const TEXT_LABELS = {
  title: 'Le titre',
  description: 'La description',
  availability: 'La disponibilité',
};

export function cleanListing(values) {
  return {
    type: values.type,
    category: values.category,
    title: values.title.trim(),
    description: values.description.trim(),
    availability: values.availability.trim(),
  };
}

// Retourne { champ: message } ; un objet vide signifie que le formulaire est valide.
export function validateListing(values) {
  const clean = cleanListing(values);
  const errors = {};

  if (!isValidType(clean.type)) errors.type = 'Choisissez « Offre » ou « Demande ».';
  if (!isValidCategory(clean.category)) errors.category = 'Choisissez une catégorie.';

  for (const [field, max] of Object.entries(LISTING_LIMITS)) {
    const length = clean[field].length;
    if (length === 0) errors[field] = `${TEXT_LABELS[field]} est obligatoire.`;
    else if (length > max) errors[field] = `${TEXT_LABELS[field]} ne doit pas dépasser ${max} caractères.`;
  }

  return errors;
}
