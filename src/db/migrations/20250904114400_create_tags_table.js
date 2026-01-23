export async function up(knex) {
  await knex.schema.createTable("tags", (table) => {
    table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.uuid("platform_account_uuid").notNullable();

    table
      .foreign("platform_account_uuid")
      .references("uuid")
      .inTable("platform_accounts")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table.string("challenge_type"); // 'Challenge', 'Competition'
    table.string("acquisition_method"); // 'Awarded', 'Purchased', 'Free'

    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTable("tags");
}
