import { faker } from "@faker-js/faker";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("competitions").del();

  // Generate competition data
  const competitions = Array.from({ length: 5 }).map(() => {
    // Generate start and end dates with different statuses
    const status = faker.helpers.arrayElement([
      "active",
      "upcoming",
      "completed",
      "canceled",
    ]);

    let startDate, endDate, registrationOpenTill;
    const now = new Date();

    if (status === "upcoming") {
      // Future competition
      startDate = faker.date.future({ years: 1 });
      endDate = new Date(startDate);
      endDate.setDate(
        endDate.getDate() + faker.number.int({ min: 7, max: 30 })
      );
      registrationOpenTill = new Date(startDate);
      registrationOpenTill.setDate(registrationOpenTill.getDate() - 1);
    } else if (status === "active") {
      // Ongoing competition
      startDate = faker.date.recent({ days: 10 });
      endDate = faker.date.future({ months: 1 });
      registrationOpenTill = faker.date.between({
        from: startDate,
        to: endDate,
      });
    } else if (status === "completed") {
      // Past competition
      endDate = faker.date.recent({ days: 30 });
      startDate = new Date(endDate);
      startDate.setDate(
        startDate.getDate() - faker.number.int({ min: 7, max: 30 })
      );
      registrationOpenTill = new Date(startDate);
    } else {
      // Canceled competition
      startDate = faker.date.recent({ days: 30 });
      endDate = new Date(startDate);
      endDate.setDate(
        endDate.getDate() + faker.number.int({ min: 7, max: 30 })
      );
      registrationOpenTill = null;
    }

    // Generate competition name and description
    const competitionType = faker.helpers.arrayElement([
      "Trading Challenge",
      "Forex Competition",
      "Investment Contest",
      "Prop Firm Challenge",
      "Traders Cup",
    ]);
    const name = `${competitionType} - ${faker.date.month()} ${new Date().getFullYear()}`;

    // Trading parameters
    const balanceSize = faker.helpers.arrayElement([
      "10000",
      "25000",
      "50000",
      "100000",
    ]);
    const stepType = faker.helpers.arrayElement(["single", "double", "triple"]);
    const riskSetting = faker.helpers.arrayElement([
      "normal",
      "aggressive",
      "conservative",
    ]);
    const platform = faker.helpers.arrayElement(["mt4", "mt5", "ctrader"]);
    const prizeType = faker.helpers.arrayElement([
      "cash",
      "funded_account",
      "mixed",
    ]);

    return {
      uuid: faker.string.uuid(),
      name,
      description: faker.lorem.paragraph(),
      balance_size: balanceSize,
      step_type: stepType,
      risk_setting: riskSetting,
      platform,
      rules_applicable: faker.datatype.boolean(),
      start_date: startDate,
      end_date: endDate,
      registration_open_till: registrationOpenTill,
      max_participants: faker.number.int({ min: 50, max: 500 }),
      status,
      entry_fee: faker.helpers.arrayElement([0, 25, 50, 100]),
      entry_currency: faker.helpers.arrayElement(["USD", "EUR", "GBP"]),
      prize_type: prizeType,
      created_at: faker.date.past({ years: 1 }),
      updated_at: new Date(),
    };
  });

  // Insert all competitions
  await knex("competitions").insert(competitions);

  // Return the competitions for use in other seed files
  return competitions;
};
