/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('purchases', (table) => {
    table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid('user_uuid').notNullable();
    table.decimal('amount_total', 8, 2).notNullable();
    table.string('currency', 10).notNullable().defaultTo('USD');
    table.string('payment_method');
    table.string('purchase_type').defaultTo('challenge');
    table.smallint('payment_status').notNullable().defaultTo(0);
    table.smallint('is_paid_aff_commission');
    table.jsonb('user_data');
    table.decimal('original_amount', 8, 2);
    table.uuid('discount_uuid');
    table.boolean('already_paid').notNullable().defaultTo(false); 
    table.text('payment_transaction_id');
    table.text('payment_response');
    table.text('webhook_response');
    table.integer('payment_attempt_count').defaultTo(0);
    table.timestamps(true, true); // created_at, updated_at
    // Indexes
    
  
    table.index(['payment_status', 'created_at']);
    // Foreign Keys
    table.foreign('user_uuid')
      .references('uuid')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table.foreign('discount_uuid')
    .references('uuid')
    .inTable('discount_codes')
    .onDelete('CASCADE')
    .onUpdate('CASCADE');
  });
    
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('purchases');
}