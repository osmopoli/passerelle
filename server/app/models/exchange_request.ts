import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { ExchangeRequestStatus } from '#constants/domain'
import User from '#models/user'
import Listing from '#models/listing'

export default class ExchangeRequest extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare listingId: number

  @column()
  declare requesterId: number

  @column()
  declare message: string

  @column()
  declare status: ExchangeRequestStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Listing)
  declare listing: BelongsTo<typeof Listing>

  @belongsTo(() => User, { foreignKey: 'requesterId' })
  declare requester: BelongsTo<typeof User>
}
