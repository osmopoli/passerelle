import { BaseSchema } from '@adonisjs/lucid/schema'
import logger from '@adonisjs/core/services/logger'
import { LIMITS, type Zone } from '#constants/domain'

/** Zone provisoire des comptes antérieurs à cette migration (à faire corriger par l'utilisateur). */
const BACKFILL_ZONE: Zone = 'mamoudzou'

/**
 * Complète la table `users` du starter (déjà déployée) : zone obligatoire et nom requis.
 * Les lignes existantes éventuelles sont complétées avant de passer les colonnes en NOT NULL.
 * Backfill fait en JS (pas de SQL propre à MySQL).
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('zone', 32).nullable().after('password')
    })

    this.defer(async (db) => {
      const users: { id: number; email: string; full_name: string | null }[] = await db
        .from(this.tableName)
        .select('id', 'email', 'full_name')

      for (const user of users) {
        const fullName = (user.full_name ?? user.email.split('@')[0]).slice(0, LIMITS.fullName)
        await db
          .from(this.tableName)
          .where('id', user.id)
          .update({ zone: BACKFILL_ZONE, full_name: fullName })
      }

      if (users.length > 0) {
        logger.warn(
          `alter_users_table : ${users.length} compte(s) existant(s) placé(s) en zone provisoire "${BACKFILL_ZONE}" (ids ${users.map((u) => u.id).join(', ')}), à faire corriger.`
        )
      }
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
