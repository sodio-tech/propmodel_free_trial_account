/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable("default_challenge_settings", (table) => {
    table.integer("account_leverage").defaultTo(0);
    table.integer("profit_split").defaultTo(0);
    table.integer("profit_target").defaultTo(0);
    table.integer("max_drawdown").defaultTo(0);
    table.integer("max_daily_drawdown").defaultTo(0);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable("default_challenge_settings", (table) => {
    table.dropColumn("account_leverage");
    table.dropColumn("profit_split");
    table.dropColumn("profit_target");
    table.dropColumn("max_drawdown");
    table.dropColumn("max_daily_drawdown");
  });
}
