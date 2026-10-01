import { BaseSchema } from '@adonisjs/lucid/schema'
import { LIMITS, LISTING_STATUS_VALUES, LISTING_TYPE_VALUES } from '#constants/domain'

export default class extends BaseSchema {
  protected tableName = 'listings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.enum('type', LISTING_TYPE_VALUES).notNullable()
      // Validée côté app contre CATEGORY_VALUES.
      table.string('category', 32).notNullable()
      table.string('title', LIMITS.title).notNullable()
      table.text('description').notNullable()
      table.string('availability', LIMITS.availability).notNullable()
      table.enum('status', LISTING_STATUS_VALUES).notNullable().defaultTo('disponible')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Découverte : statut (≠ terminee) + type + catégorie, tri par date.
      table.index(['status', 'type', 'category', 'created_at'], 'listings_discovery_idx')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
