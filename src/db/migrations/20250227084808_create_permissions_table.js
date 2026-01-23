/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  if (!knex.schema.hasTable('permissions')) {
    return knex.schema.createTable("permissions", (table) => {
      table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));
      table.string("name").notNullable().unique();
      table.string("description");
      table.timestamps(true, true);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  if (!knex.schema.hasTable('permissions')) {
    return knex.schema.dropTable("permissions");
  }
}
