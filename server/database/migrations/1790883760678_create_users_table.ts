import { BaseSchema } from '@adonisjs/lucid/schema'
import { LIMITS } from '#constants/domain'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('full_name', LIMITS.fullName).notNullable()
      table.string('email', LIMITS.email).notNullable().unique()
      table.string('password').notNullable()
      // Validée côté app contre ZONE_VALUES : la liste peut évoluer sans ALTER ENUM.
      table.string('zone', 32).notNullable().index()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
