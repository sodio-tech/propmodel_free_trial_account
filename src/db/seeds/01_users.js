import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";

// Assuming roles are defined in a utility file
// If not, you can define them directly in this file
const roles = {
  USER: 2,
  ADMIN: 1,
  MASTER_ADMIN: 3,
  SUBADMIN: 4,
  CUSTOMER_SUPPORT: 5,
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("users").del();

  // Create regular users with mixed status
  // Hash a sample password for all users
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("testing", salt);

  const regularUsers = Array.from({ length: 10 }).map(() => ({
    uuid: faker.string.uuid(),
    email: faker.internet.email().toLowerCase(),
    password: hashedPassword, // Use the freshly hashed password
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    phone: faker.phone.number(),
    phone_verified: faker.helpers.arrayElement([0, 1]),
    role_id: roles.USER,
    status: faker.helpers.arrayElement([0, 1]), // randomly assign active/inactive status
    country: faker.location.country(),
    state: faker.location.state(),
    city: faker.location.city(),
    address: faker.location.streetAddress(),
    zip: faker.location.zipCode(),
    timezone: faker.helpers.arrayElement([
      "UTC",
      "America/New_York",
      "Europe/London",
      "Asia/Tokyo",
    ]),
    last_login_at: faker.date.recent({ days: 30 }),
    created_at: faker.date.past(),
    updated_at: new Date(),
  }));

  // Create admin users with different admin roles
  const adminRoles = [
    roles.ADMIN,
    roles.MASTER_ADMIN,
    roles.SUBADMIN,
    roles.CUSTOMER_SUPPORT,
  ];
  const adminUsers = adminRoles.map((roleId) => {
    const isActive = faker.datatype.boolean(); // 50% chance of being active
    const recentLogin = isActive && faker.datatype.boolean(); // 50% chance of recent login for active users

    return {
      uuid: faker.string.uuid(),
      email: `admin${roleId}@example.com`,
      password: "$2a$10$qqfPnpkrF6YzblJTJ7HxD.OA8.6hP89aLIj1QQrb.xsVtcnrR5fB.", // "password123"
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      phone: faker.phone.number(),
      phone_verified: 1,
      role_id: roleId,
      status: isActive ? 1 : 0,
      country: faker.location.country(),
      state: faker.location.state(),
      city: faker.location.city(),
      address: faker.location.streetAddress(),
      zip: faker.location.zipCode(),
      timezone: "UTC",
      last_login_at: recentLogin ? faker.date.recent({ days: 5 }) : null, // login within last 5 days
      created_at: faker.date.past(),
      updated_at: new Date(),
    };
  });

  // Create a predictable super admin user for development
  const superAdmin = {
    uuid: faker.string.uuid(),
    email: "superadmin@example.com",
    password: "$2a$10$qqfPnpkrF6YzblJTJ7HxD.OA8.6hP89aLIj1QQrb.xsVtcnrR5fB.", // "password123"
    first_name: "Super",
    last_name: "Admin",
    phone: "1234567890",
    phone_verified: 1,
    role_id: roles.MASTER_ADMIN,
    status: 1, // active
    country: "United States",
    state: "California",
    city: "San Francisco",
    address: "123 Admin Street",
    zip: "94105",
    timezone: "UTC",
    last_login_at: new Date(),
    created_at: faker.date.past({ years: 1 }),
    updated_at: new Date(),
  };

  // Insert all users
  await knex("users").insert([superAdmin, ...adminUsers, ...regularUsers]);
};
