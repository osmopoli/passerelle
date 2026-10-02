import vine, { SimpleMessagesProvider } from '@vinejs/vine'
import { LIMITS, ZONE_VALUES } from '#constants/domain'

/** bcrypt ignore tout ce qui dépasse 72 octets : on borne la saisie. */
const PASSWORD = { min: 8, max: 72 } as const

const messages = new SimpleMessagesProvider(
  {
    'required': 'Ce champ est obligatoire.',
    'string': 'Ce champ doit être un texte.',
    'email': 'Adresse e-mail invalide.',
    'minLength': 'Au moins {{ min }} caractères.',
    'maxLength': 'Au plus {{ max }} caractères.',
    'enum': 'Zone inconnue.',
    'database.unique': 'Un compte existe déjà avec cet e-mail.',
  },
  {
    fullName: 'nom',
    email: 'e-mail',
    password: 'mot de passe',
    zone: 'zone',
  }
)

const fullName = () => vine.string().trim().minLength(2).maxLength(LIMITS.fullName)
const zone = () => vine.enum(ZONE_VALUES)

export const registerValidator = vine.compile(
  vine.object({
    fullName: fullName(),
    email: vine
      .string()
      .trim()
      .toLowerCase()
      .email()
      .maxLength(LIMITS.email)
      .unique({ table: 'users', column: 'email', caseInsensitive: true }),
    password: vine.string().minLength(PASSWORD.min).maxLength(PASSWORD.max),
    zone: zone(),
  })
)
registerValidator.messagesProvider = messages

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().toLowerCase().email().maxLength(LIMITS.email),
    password: vine.string().maxLength(PASSWORD.max),
  })
)
loginValidator.messagesProvider = messages

export const updateProfileValidator = vine.compile(
  vine.object({
    fullName: fullName().optional(),
    zone: zone().optional(),
  })
)
updateProfileValidator.messagesProvider = messages
