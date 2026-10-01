import { BaseSchema } from '@adonisjs/lucid/schema'
import { LIMITS } from '#constants/domain'

/**
 * Complète la table `users` du starter (déjà déployée) : zone obligatoire et nom requis.
 * Les lignes existantes éventuelles sont complétées avant de passer les colonnes en NOT NULL.
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('zone', 32).nullable().after('password')
    })

    this.defer(async (db) => {
      await db.from(this.tableName).whereNull('zone').update({ zone: 'mamoudzou' })
      await db.rawQuery(
        `UPDATE ${this.tableName} SET full_name = LEFT(COALESCE(full_name, SUBSTRING_INDEX(email, '@', 1)), ?)`,
        [LIMITS.fullName]
      )
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.string('zone', 32).notNullable().alter()
      table.string('full_name', LIMITS.fullName).notNullable().alter()
      table.index(['zone'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['zone'])
      table.dropColumn('zone')
      table.string('full_name').nullable().alter()
    })
  }
}
