export async function up(knex) {
  await knex.schema.createTable("add_funded_account_permissions", (table) => {
    table.increments("id").primary();
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTable("add_funded_account_permissions");
}
