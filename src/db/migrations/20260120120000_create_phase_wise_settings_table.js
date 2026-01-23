export async function up(knex) {
  await knex.schema.createTable("phase_wise_settings", (table) => {
    // Primary key
    table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // Foreign key to platform_groups table
    table.uuid("platform_group_uuid").notNullable().comment("Reference to the platform group this setting belongs to");

    table
      .foreign("platform_group_uuid")
      .references("uuid")
      .inTable("platform_groups")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    // Setting name - identifies what setting this is (e.g., 'profit_target', 'max_drawdown', 'profit_split')
    table.string("setting_name").notNullable().comment("Name of the setting (e.g., profit_target, max_drawdown, profit_split)");

    // Phase key - which phase this value applies to
    table.string("phase_key").notNullable().comment("Phase identifier: phase_1, phase_2, phase_3, or funded");

    // Phase value - the actual setting value for this phase
    table.text("phase_value").nullable().comment("The setting value for this phase (e.g., '10', '15%', '80')");

    // Timestamps for tracking when records are created/updated
    table.timestamps(true, true);

    // Indexes for better query performance
    table.index("platform_group_uuid");
    table.index("setting_name");
    table.index("phase_key");

    // Unique constraint - each setting can only have one value per phase per group
    table.unique(["platform_group_uuid", "setting_name", "phase_key"]);
  });
}

export async function down(knex) {
  await knex.schema.dropTable("phase_wise_settings");
}
