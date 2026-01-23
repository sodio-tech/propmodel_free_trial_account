import { faker } from "@faker-js/faker";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("permissions").del();

  // Define base permissions
  const permissions = [
    {
      uuid: faker.string.uuid(),
      name: "manage_users",
      description: "Create, read, update, and delete user accounts",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uuid: faker.string.uuid(),
      name: "view_users",
      description: "View user accounts and their details",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uuid: faker.string.uuid(),
      name: "manage_purchases",
      description: "View and manage user purchases",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uuid: faker.string.uuid(),
      name: "manage_payouts",
      description: "Approve, reject, and process payout requests",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uuid: faker.string.uuid(),
      name: "view_payouts",
      description: "View payout requests and their status",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uuid: faker.string.uuid(),
      name: "manage_discount_codes",
      description: "Create, update, and delete discount codes",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uuid: faker.string.uuid(),
      name: "manage_competitions",
      description: "Create, update, and delete competition events",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uuid: faker.string.uuid(),
      name: "view_statistics",
      description: "View platform statistics and analytics",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uuid: faker.string.uuid(),
      name: "manage_mt5_accounts",
      description: "Create and manage MT5 trading accounts",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uuid: faker.string.uuid(),
      name: "view_mt5_accounts",
      description: "View MT5 trading accounts and their status",
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  // Insert into the permissions table
  await knex("permissions").insert(permissions);
};
