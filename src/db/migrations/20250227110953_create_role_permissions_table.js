/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("role_permissions", (table) => {
    table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("role_id")
      .notNullable()
      .references("uuid")
      .inTable("roles")
      .onDelete("CASCADE");

    table
      .uuid("permission_id")
      .notNullable()
      .references("uuid")
      .inTable("permissions")
      .onDelete("CASCADE");
    table.timestamps(true, true);

    // Create a unique composite index on role_id and permission_id
    table.unique(["role_id", "permission_id"]);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("role_permissions");
}
