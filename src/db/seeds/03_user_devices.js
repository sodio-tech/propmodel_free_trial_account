import { faker } from "@faker-js/faker";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex("user_devices").del();

  // Get all seeded users
  const users = await knex("users").select("uuid");

  // Generate 2-4 devices for each user
  const userDevices = users.flatMap((user) => {
    const numDevices = faker.number.int({ min: 2, max: 4 });

    return Array.from({ length: numDevices }).map(() => {
      const deviceType = faker.helpers.arrayElement([
        "Desktop",
        "Mobile",
        "Tablet",
      ]);
      const browser = faker.helpers.arrayElement([
        "Chrome",
        "Firefox",
        "Safari",
        "Edge",
        "Chrome Mobile",
        "Safari Mobile",
        "Samsung Browser",
      ]);

      const os = faker.helpers.arrayElement([
        "Windows 10",
        "Windows 11",
        "macOS",
        "iOS",
        "Android 13",
        "Android 14",
        "Linux",
      ]);

      return {
        uuid: faker.string.uuid(),
        user_uuid: user.uuid,
        browser,
        os,
        device: deviceType,
        ip: faker.internet.ip(),
        location: `${faker.location.city()}, ${faker.location.country()}`,
        created_at: faker.date.past({ years: 1 }),
      };
    });
  });

  // Insert all devices
  await knex("user_devices").insert(userDevices);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex("user_devices").del();
}
