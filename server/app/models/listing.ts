import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { Category, ListingStatus, ListingType } from '#constants/domain'
import User from '#models/user'
import ExchangeRequest from '#models/exchange_request'

export default class Listing extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare type: ListingType

  @column()
  declare category: Category

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare availability: string

  @column()
  declare status: ListingStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare author: BelongsTo<typeof User>

  @hasMany(() => ExchangeRequest)
  declare requests: HasMany<typeof ExchangeRequest>
}
