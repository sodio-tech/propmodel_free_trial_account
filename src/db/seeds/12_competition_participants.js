import { faker } from "@faker-js/faker";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("competition_participants").del();

  // Get competitions and users
  const competitions = await knex("competitions").select("uuid", "status");
  const users = await knex("users").select("uuid").where({ role_id: 2 }); // Only regular users (assuming role_id 2 is for regular users)

  if (competitions.length === 0 || users.length === 0) {
    console.log(
      "No competitions or users found. Skipping competition_participants seed."
    );
    return;
  }

  const participants = [];

  // For each competition, add random participants
  competitions.forEach((competition) => {
    // Determine how many participants to add based on competition status
    let participantCount;

    if (competition.status === "completed") {
      // Completed competitions have more participants
      participantCount = faker.number.int({ min: 30, max: 50 });
    } else if (competition.status === "active") {
      // Active competitions have medium number of participants
      participantCount = faker.number.int({ min: 15, max: 30 });
    } else if (competition.status === "upcoming") {
      // Upcoming competitions have fewer participants
      participantCount = faker.number.int({ min: 5, max: 15 });
    } else {
      // Canceled competitions have very few participants
      participantCount = faker.number.int({ min: 1, max: 10 });
    }

    // Ensure we don't add more participants than available users
    participantCount = Math.min(participantCount, users.length);

    // Randomly select users to be participants
    const selectedUsers = faker.helpers.arrayElements(users, participantCount);

    // Create participant entries
    selectedUsers.forEach((user) => {
      participants.push({
        uuid: faker.string.uuid(),
        competition_uuid: competition.uuid,
        user_uuid: user.uuid,
        platform_user_id: faker.string.alphanumeric(8),
        platform_user_data: JSON.stringify({
          login: faker.number.int({ min: 10000000, max: 99999999 }),
          account_type: faker.helpers.arrayElement(["demo", "real"]),
          balance: faker.number.float({
            min: 100,
            max: 10000,
            precision: 0.01,
          }),
        }),
        created_at: faker.date.past({ years: 1 }),
        updated_at: new Date(),
      });
    });
  });

  // Insert all participants
  if (participants.length > 0) {
    await knex("competition_participants").insert(participants);
  }
};
