import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { Zone } from '#constants/domain'
import Listing from '#models/listing'
import ExchangeRequest from '#models/exchange_request'

// Hasher par défaut de config/hash.ts (bcrypt attendu par P0-3).
const AuthFinder = withAuthFinder(() => hash.use(), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare zone: Zone

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Listing)
  declare listings: HasMany<typeof Listing>

  @hasMany(() => ExchangeRequest, { foreignKey: 'requesterId' })
  declare sentRequests: HasMany<typeof ExchangeRequest>

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
