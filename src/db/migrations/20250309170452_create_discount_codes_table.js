/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("discount_codes", (table) => {
    table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").defaultTo(null);
    table.string("code").unique().notNullable();
    table.integer("max_usage_count").defaultTo(0);
    table.integer("current_usage_count").defaultTo(0);
    table.double('discount').defaultTo(0);
    table.timestamp("start_date").defaultTo(null);
    table.timestamp("end_date").defaultTo(null);
    table.jsonb('challenge_amount').defaultTo(null);
    table.jsonb('challenge_step').defaultTo(null);
    table.jsonb('email').defaultTo(null);
    // table.string("group_uuid").defaultTo(null);
    // table.decimal('account_balance', 8, 2).defaultTo(0);
    table.enu('status', ['active', 'deactive']).defaultTo('active');
    table.uuid('created_by').references('uuid').inTable('users').onDelete('CASCADE').defaultTo(null);
    table.timestamps(true, true);

    //Index
    table.index('code');
    table.index('start_date');
    table.index('end_date');
  });
      
 
}


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("discount_codes");
}
