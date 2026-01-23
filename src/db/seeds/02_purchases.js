import { faker } from "@faker-js/faker";

export async function seed(knex) {
  await knex("purchases").del();

  const users = await knex("users").select("uuid");

  const purchases = Array.from({ length: 10 }).map(() => ({
    uuid: faker.string.uuid(),
    user_uuid: faker.helpers.arrayElement(users).uuid, // Select a random user UUID from existing users
    amount_total: parseFloat(faker.commerce.price()),
    currency: "USD",
    payment_status: 1,
    created_at: new Date(),
  }));

  await knex("purchases").insert(purchases);
}

export async function down(knex) {
  await knex("purchases").del();
}
