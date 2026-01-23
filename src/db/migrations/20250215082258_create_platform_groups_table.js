export async function up(knex) {
  await knex.schema.createTable("platform_groups", (table) => {
    table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.string("name").notNullable(); // competition_001
    table.string("second_group_name").nullable();
    table.string("third_group_name").nullable();
    table.string("description").nullable();
    table.string("platform_name").defaultTo("mt5");
    table
      .enum("group_type", ["challenge", "competition"])
      .defaultTo("challenge");

    table.decimal("initial_balance", 8, 2).defaultTo(0);

    table
      .enum("account_stage", ["trial", "single", "double", "triple", "instant"])
      .defaultTo("trial");

    table
      .enum("account_type", ["standard", "aggressive"])
      .defaultTo("standard");

    table.integer("profit_target").defaultTo(0);
    table.float("profit_split").defaultTo(0);
    table.integer("max_drawdown").defaultTo(0);
    table.integer("max_daily_drawdown").defaultTo(0);
    table.integer("max_trading_days").defaultTo(0);
    table.integer("account_leverage").defaultTo(0);
    table.decimal("prices", 8, 2).defaultTo(0);

    table.boolean("status").defaultTo(true);
    table.timestamps(true, true);

    table.index("account_stage");
    table.index("account_type");
    table.index("initial_balance");
    table.index("status");
  });
}

export async function down(knex) {
  await knex.schema.dropTable("platform_groups");
}
