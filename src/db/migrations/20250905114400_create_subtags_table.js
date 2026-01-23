export async function up(knex) {
  await knex.schema.createTable("subtags", (table) => {
    table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.string("challenge_type"); // 'Challenge', 'Competition'
    table.string("acquisition_method"); // 'Awarded', 'Purchased', 'Free'

    table.string("name");

    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTable("subtags");
}
