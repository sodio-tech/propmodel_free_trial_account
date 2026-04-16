export async function up(knex) {
  await knex.schema.createTable("free_trial_codes_usages", (table) => {
    // Primary key
    table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // Foreign key to platform_groups table
    table
      .string("code")
      .unique()
      .notNullable();

    table.uuid("used_by_user_uuid").unique().notNullable();

    table
      .foreign("used_by_user_uuid")
      .references("uuid")
      .inTable("users")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table.index(["code"]);

    table.index(["used_by_user_uuid"]);
  });
}

export async function down(knex) {
  await knex.schema.dropTable("free_trial_codes_usages");
}
