import { faker } from "@faker-js/faker";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("user_activities").del();

  // Get users to associate activities with
  const users = await knex("users").select("uuid");

  if (users.length === 0) {
    console.log("No users found. Skipping user_activities seed.");
    return;
  }

  // Define possible activity types
  const activityTypes = [
    "login",
    "logout",
    "profile_update",
    "password_change",
    "purchase_made",
    "payout_requested",
    "mt5_account_created",
    "competition_joined",
  ];

  // Generate random user activities
  const userActivities = Array.from({ length: 100 }).map(() => {
    const user = faker.helpers.arrayElement(users);
    const action = faker.helpers.arrayElement(activityTypes);

    let metadata = {};

    // Add action-specific metadata
    switch (action) {
      case "login":
        metadata = {
          success: faker.helpers.arrayElement([true, true, true, false]), // Bias towards successful logins
          method: faker.helpers.arrayElement(["password", "token", "social"]),
        };
        break;
      case "profile_update":
        metadata = {
          fields_updated: faker.helpers.arrayElements(
            [
              "first_name",
              "last_name",
              "phone",
              "address",
              "country",
              "timezone",
            ],
            faker.number.int({ min: 1, max: 3 })
          ),
        };
        break;
      case "purchase_made":
        metadata = {
          amount: faker.finance.amount(),
          currency: faker.helpers.arrayElement(["USD", "EUR", "GBP"]),
          payment_method: faker.helpers.arrayElement([
            "credit_card",
            "paypal",
            "bank_transfer",
          ]),
        };
        break;
      case "payout_requested":
        metadata = {
          amount: faker.finance.amount(),
          currency: faker.helpers.arrayElement(["USD", "EUR", "GBP"]),
          payment_method: faker.helpers.arrayElement([
            "paypal",
            "bank_transfer",
            "crypto",
          ]),
        };
        break;
      case "mt5_account_created":
        metadata = {
          account_type: faker.helpers.arrayElement([
            "demo",
            "real",
            "challenge",
          ]),
          deposit: faker.finance.amount(),
        };
        break;
      default:
        // For other actions, just add a simple metadata entry
        metadata = {
          details: `${action} performed by user`,
        };
    }

    // Create the user activity entry
    return {
      uuid: faker.string.uuid(),
      user_uuid: user.uuid,
      action,
      metadata: JSON.stringify(metadata),
      ip_address: faker.internet.ip(),
      user_agent: faker.internet.userAgent(),
      created_at: faker.date.recent({ days: 30 }),
      updated_at: faker.date.recent({ days: 30 }),
    };
  });

  // Insert into the user_activities table
  await knex("user_activities").insert(userActivities);
};
