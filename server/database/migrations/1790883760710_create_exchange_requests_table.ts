import { BaseSchema } from '@adonisjs/lucid/schema'
import { EXCHANGE_REQUEST_STATUS_VALUES, LIMITS } from '#constants/domain'

export default class extends BaseSchema {
  protected tableName = 'exchange_requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('listing_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('listings')
        .onDelete('CASCADE')
      table
        .integer('requester_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('message', LIMITS.message).notNullable()
      table.enum('status', EXCHANGE_REQUEST_STATUS_VALUES).notNullable().defaultTo('en_attente')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Pas de doublon pour un même demandeur sur une annonce (P1-1).
      table.unique(['listing_id', 'requester_id'])
      // Demandes reçues + auto-refus des autres demandes en attente.
      table.index(['listing_id', 'status'])
      // Demandes envoyées (tableau de bord).
      table.index(['requester_id', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
