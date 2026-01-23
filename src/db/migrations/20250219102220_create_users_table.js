/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("users", function (table) {
    table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid('ref_by_user_id').defaultTo(null); 
    table.integer("ref_link_count").defaultTo(0);
    table.uuid("role_id").defaultTo(null).index();
    table.string("email").unique().index();
    table.string("password");
    table.date("dob").defaultTo(null);
    table.string("first_name").defaultTo(null);
    table.string("last_name").defaultTo(null);
    table.string("phone").defaultTo(null);
    table.tinyint("phone_verified").defaultTo(0);
    table.integer("sent_activation_mail_count").defaultTo(0);
    table.tinyint("status").defaultTo(0).index(); // 0: inactive, 1: active, 2: banned
    table.string("reset_pass_hash").defaultTo(null);
    table.string("address").defaultTo(null);
    table.string("country").defaultTo(null);
    table.string("state").defaultTo(null);
    table.string("city").defaultTo(null);
    table.string("zip").defaultTo(null);
    table.string("timezone").defaultTo(null);
    table.string("google_app_secret").defaultTo(null);
    table.tinyint("is_google_app_verify").defaultTo(0);
    table.tinyint("2fa_sms_enabled").defaultTo(0);
    table.string("identity_status").defaultTo(null);
    table.timestamp("identity_verified_at").defaultTo(null);
    table.tinyint("affiliate_terms").defaultTo(0);
    table.tinyint("dashboard_popup").defaultTo(0);
    table.tinyint("discord_connected").defaultTo(0);
    table.integer("used_free_count").defaultTo(0);
    table.integer("available_count").defaultTo(0);
    table.tinyint("trail_verification_status").defaultTo(0).index(); // 0: not verified, 1: verified, 2: rejected
    table.timestamp("last_login_at").defaultTo(null);
    table.tinyint("accept_affiliate_terms").defaultTo(0);
    table.timestamps(true, true); // created_at, updated_at

    //Index
    table.index('created_at');
    table.index('last_login_at');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("users");
}
