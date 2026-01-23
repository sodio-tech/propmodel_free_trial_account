export async function up(knex) {
  await knex.schema.createTable("platform_accounts", (table) => {
    table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_uuid").notNullable();
    table.uuid("purchase_uuid").notNullable();
    table.string("platform_login_id").unique().defaultTo(0);
    table.string("platform_name").defaultTo("mt5");
    table.string("action_type").defaultTo("challenge"); //challenge, competition
    table.string("remote_group_name", 50).defaultTo(0);

    // Add the missing foreign key columns
    table.uuid("platform_group_uuid").notNullable();

    table
      .foreign("platform_group_uuid")
      .references("uuid")
      .inTable("platform_groups")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table.integer("current_phase").defaultTo(1);
    // password specific
    table.string("main_password").defaultTo("password");
    table.string("investor_password").defaultTo("password");

    // account specific configs
    table.decimal("initial_balance", 8, 2).notNullable();
    table
      .enum("account_stage", ["trial", "single", "double", "triple", "instant"])
      .defaultTo(null);
    table.enum("account_type", ["standard", "aggressive"]).defaultTo(null);
    // account specific configs

    table.integer("profit_target").defaultTo(0);
    table.float("profit_split").defaultTo(0);
    table.integer("max_drawdown").defaultTo(0);
    table.integer("max_daily_drawdown").defaultTo(0);
    table.integer("max_trading_days").defaultTo(0);
    table.integer("account_leverage").defaultTo(0);
    table.decimal("prices", 8, 2).defaultTo(0);

    table.tinyint("status").defaultTo(1).index(); // 0: inactive, 1: active, 2: banned
    table.tinyint("funded_status").defaultTo(0).index(); // 0: pending, 1: approve, 2: reject
    table.timestamp("funded_at").defaultTo(null).index();
    table.tinyint("is_kyc").defaultTo(0);
    table.tinyint("is_trades_check").defaultTo(0);
    table.string("is_trade_agreement").defaultTo(null);
    table.text("reason").defaultTo(null);
    table.timestamp("deleted_at").defaultTo(null).index();
    table.timestamps(true, true);

    table.index("created_at");
    table.index("platform_type");

    // Foreign Keys
    table
      .foreign("user_uuid")
      .references("uuid")
      .inTable("users")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table
      .foreign("purchase_uuid")
      .references("uuid")
      .inTable("purchases")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

export async function down(knex) {
  await knex.schema.dropTable("platform_accounts");
}
