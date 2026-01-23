import { faker } from "@faker-js/faker";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("roles").del();

  // Define standard roles
  const roles = [
    {
      uuid: "4498cf39-7fe2-4059-9571-6e65632eb283",
      name: "admin",
      description: "Full access to all system features",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uuid: "7d240ffe-f3f3-4015-9aa7-18a3acc854f7",
      name: "user",
      description: "Regular user with limited access",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uuid: "6385517c-60e2-4866-873d-7859a28c2de3",
      name: "master_admin",
      description: "Super admin with all privileges including role management",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uuid: "f00e01b9-ffaa-49c6-b680-7348ef7797a4",
      name: "sub_admin",
      description: "Admin with restricted privileges",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uuid: "d953a3bd-e736-4757-a56b-f2cf1e11bcd8",
      name: "customer_support",
      description: "Support staff with view-only access to most features",
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  // Insert roles into the roles table
  await knex("roles").insert(roles);
};
