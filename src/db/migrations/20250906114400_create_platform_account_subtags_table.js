export async function up(knex) {
  await knex.schema.createTable("platform_account_subtags", (table) => {
    table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.uuid("platform_account_uuid").notNullable();

    table
      .foreign("platform_account_uuid")
      .references("uuid")
      .inTable("platform_accounts")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table.uuid("subtag_uuid").notNullable();

    table
      .foreign("subtag_uuid")
      .references("uuid")
      .inTable("subtags")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTable("platform_account_subtags");
}
