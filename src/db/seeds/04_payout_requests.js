import { faker } from "@faker-js/faker";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("payout_requests").del();

  // Get all existing user UUIDs from users table
  const users = await knex("users").select("uuid");

  if (users.length === 0) {
    console.warn("No users found, skipping payout_requests seed");
    return;
  }

  // Create payout requests for users
  const payoutRequests = [];

  // Generate multiple payout requests for each user
  for (const user of users) {
    // Generate 0-5 payout requests per user (random)
    const requestCount = faker.number.int({ min: 0, max: 5 });

    for (let i = 0; i < requestCount; i++) {
      const amount = faker.number.float({
        min: 50,
        max: 5000,
        precision: 0.01,
      });
      const types = ["program", "affiliate"];

      payoutRequests.push({
        uuid: faker.string.uuid(),
        user_uuid: user.uuid,
        type: faker.helpers.arrayElement(types),
        mt5_login: faker.number.int({ min: 10000, max: 99999 }),
        amount: amount,
        method: faker.helpers.arrayElement(["bank", "paypal", "crypto"]),
        status: faker.helpers.arrayElement([0, 1, 2]), // 0: pending, 1: approved, 2: rejected
        data: JSON.stringify({
          details: faker.lorem.sentence(),
          processed_by: faker.string.uuid(),
          processed_at: faker.date.recent(),
        }),
        created_at: faker.date.past({ years: 1 }),
        updated_at: faker.date.recent(),
      });
    }
  }

  // Insert payout requests if there are any
  if (payoutRequests.length > 0) {
    await knex("payout_requests").insert(payoutRequests);
    console.log(`Created ${payoutRequests.length} payout requests`);
  }
};
