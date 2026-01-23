/**
 * Migration: Create free_trial_settings table
 *
 * This table stores configuration for how free trials are offered and restricted.
 * It is associated with a single platform_group so that a matching trading group
 * and its advanced settings can be created and linked to each free trial.
 *
 * Trial duration fields control when free trials should be disabled:
 * - trial_duration_type: 'manual', 'number_of_trials', or 'date'
 * - trial_duration_value: null (manual), integer (number of trials), or date string (end date)
 */

export const up = async function (knex) {
  await knex.schema.createTable("free_trial_settings", function (table) {
    // Primary key
    table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // Core behaviour flags
    table
      .boolean("leads_to_payout")
      .defaultTo(false)
      .comment(
        "If enabled, users who successfully complete the free trial may receive a partial funded account or payout"
      );

    table
      .boolean("free_trial_code_required")
      .defaultTo(false)
      .comment("If enabled, a valid free trial code is required to join");

    table
      .boolean("available_after_purchase_only")
      .defaultTo(false)
      .comment(
        "If enabled, only users who have made at least one purchase can claim this trial"
      );

    table
      .boolean("kyc_required")
      .defaultTo(false)
      .comment("If enabled, KYC is required before joining the free trial");

    table
      .integer("max_trials_per_user")
      .nullable()
      .comment(
        "Maximum number of free trials a single user can participate in (null = unlimited)"
      );

    table
      .boolean("enable_free_trials")
      .defaultTo(true)
      .comment("Master switch to enable or disable free trials");

    // Audience targeting options
    table
      .boolean("new_users_only")
      .defaultTo(false)
      .comment(
        "If enabled, only users with zero purchases (brand new customers) can join"
      );

    table
      .boolean("users_with_free_trial_code_only")
      .defaultTo(false)
      .comment(
        "If enabled, only users who provide a valid free trial code can join"
      );

    table
      .boolean("all_users_allowed")
      .defaultTo(false)
      .comment("If enabled, any user can join the free trial");

    // Trial duration controls
    table
      .string("trial_duration_type")
      .nullable()
      .defaultTo("manual")
      .comment(
        "Type of trial duration: 'manual', 'number_of_trials', or 'date'"
      );

    table
      .string("trial_duration_value")
      .nullable()
      .comment(
        "Value for trial duration: null (manual), integer (number of trials), or date string (end date)"
      );

    // Association to platform_groups so we can create a group + advanced settings per trial
    table
      .uuid("platform_group_uuid")
      .nullable()
      .unique()
      .comment(
        "UUID of the associated platform_group created for this free trial"
      );

    table
      .foreign("platform_group_uuid")
      .references("uuid")
      .inTable("platform_groups")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    // Common metadata
    table
      .integer("status")
      .defaultTo(1)
      .comment("1 = active, 0 = inactive");

    table
      .uuid("created_by")
      .nullable()
      .comment("UUID of admin who created this setting");

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    // Helpful indexes
    table.index(["status"]);
    table.index(["platform_group_uuid"]);
  });
};

export const down = async function (knex) {
  await knex.schema.dropTable("free_trial_settings");
};


