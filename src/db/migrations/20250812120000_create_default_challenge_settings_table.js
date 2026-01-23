export async function up(knex) {
  const tableName = "default_challenge_settings";
  if (!(await knex.schema.hasTable(tableName))) {
    await knex.schema.createTable(tableName, (table) => {
      // Primary key
      table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));

      // Settings columns (derived from default_settings.md)
      table.boolean("100_profit_split").defaultTo(false);
      table.boolean("2_percent_lower_target").defaultTo(false);
      table.boolean("2_percent_more_daily_drawdown").defaultTo(false);
      table.boolean("2_percent_more_max_drawdown").defaultTo(false);
      table.boolean("allow_expert_advisors").defaultTo(false);
      table.string("breach_type", 191).defaultTo(null);
      table.boolean("close_all_positions_on_friday").defaultTo(false);
      table.integer("delete_account_after_failure").defaultTo(null);
      table.string("delete_account_after_failure_unit", 50).defaultTo(null);
      table.boolean("double_leverage").defaultTo(false);
      table.boolean("held_over_the_weekend").defaultTo(false);
      table.integer("inactivity_breach_trigger").defaultTo(null);
      table.string("inactivity_breach_trigger_unit", 50).defaultTo(null);
      table.integer("max_open_lots").defaultTo(null);
      table.integer("max_risk_per_symbol").defaultTo(null);
      table.integer("max_time_per_evaluation_phase").defaultTo(null);
      table.string("max_time_per_evaluation_phase_unit", 50).defaultTo(null);
      table.integer("max_time_per_funded_phase").defaultTo(null);
      table.string("max_time_per_funded_phase_unit", 50).defaultTo(null);
      table.integer("max_trading_days").defaultTo(null);
      table.integer("min_trading_days").defaultTo(null);
      table.integer("min_time_per_phase").defaultTo(null);
      table.string("min_time_per_phase_unit", 50).defaultTo(null);
      table.boolean("no_sl_required").defaultTo(false);
      table.boolean("requires_stop_loss").defaultTo(false);
      table.boolean("requires_take_profit").defaultTo(false);
      table.integer("time_between_withdrawals").defaultTo(null);
      table.string("time_between_withdrawals_unit", 50).defaultTo(null);
      table.boolean("visible_on_leaderboard").defaultTo(false);
      table.integer("withdraw_within").defaultTo(null);
      table.string("withdraw_within_unit", 50).defaultTo(null);

      // Audit
      table
        .uuid("updated_by")
        .references("uuid")
        .inTable("users")
        .onDelete("SET NULL")
        .defaultTo(null);

      table.timestamps(true, true);
    });

    // Optional: ensure only a single row can exist by using a partial unique index on a constant expression
    // Not all engines support this; for Postgres this is fine via a check constraint
    // Here we skip hard enforcement and let application maintain singleton semantics.
  }
}

export async function down(knex) {
  const tableName = "default_challenge_settings";
  if (await knex.schema.hasTable(tableName)) {
    await knex.schema.dropTable(tableName);
  }
}
