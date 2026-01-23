import { faker } from "@faker-js/faker";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("mt5_users").del();

  // Get all existing users
  const users = await knex("users").select("uuid");

  if (users.length === 0) {
    console.warn("No users found, skipping mt5_users seed");
    return;
  }

  // Get all existing purchases
  const purchases = await knex("purchases").select("uuid", "user_uuid");

  if (purchases.length === 0) {
    console.warn("No purchases found, skipping mt5_users seed");
    return;
  }

  // Create MT5 users
  const mt5Users = [];

  // Account types and stages
  const accountStages = ["trial", "single", "double", "triple", "instant"];
  const accountTypes = ["standard", "aggressive"];

  // For each purchase, create an MT5 user account
  for (const purchase of purchases) {
    const userPurchase = purchase;

    // Randomize account details
    const accountStage = faker.helpers.arrayElement(accountStages);
    const accountType = faker.helpers.arrayElement(accountTypes);
    const initialBalance = faker.helpers.arrayElement([
      5000, 10000, 25000, 50000, 100000,
    ]);
    const accountLeverage = faker.helpers.arrayElement([30, 50, 100, 200]);

    // Randomize MT5 login ID (typically a 5-8 digit number)
    const mt5LoginId = faker.number.int({ min: 10000, max: 99999999 });

    // Set profit target based on account type
    const profitTarget =
      accountType === "standard" ? initialBalance * 0.1 : initialBalance * 0.15;

    // Set drawdown limits
    const maxDrawdown = initialBalance * 0.05;
    const maxDailyDrawdown = initialBalance * 0.02;

    // Define profit split (standard: 70%, aggressive: 80%)
    const profitSplit = accountType === "standard" ? 70 : 80;

    // Randomize status (weighted toward active)
    const status = faker.helpers.weightedArrayElement([
      { value: 1, weight: 7 }, // 70% active
      { value: 0, weight: 2 }, // 20% inactive
      { value: 2, weight: 1 }, // 10% banned
    ]);

    // Group name typically includes account type and size
    const groupName = `${accountType.toUpperCase()}_${initialBalance}`;

    // Create MT5 user record
    mt5Users.push({
      uuid: faker.string.uuid(),
      user_uuid: userPurchase.user_uuid,
      purchase_uuid: userPurchase.uuid,
      mt5_login_id: mt5LoginId,
      group_name: groupName,
      initial_balance: initialBalance,
      profit_target: profitTarget,
      profit_split: profitSplit,
      max_drawdown: maxDrawdown,
      max_daily_drawdown: maxDailyDrawdown,
      account_stage: accountStage,
      account_type: accountType,
      account_leverage: accountLeverage,
      status: status,
      funded_at: status === 1 ? faker.date.recent({ days: 30 }) : null,
      is_contract_sign: faker.helpers.arrayElement([0, 1]),
      is_trades_check: faker.helpers.arrayElement([0, 1]),
      contract_sign_id: faker.helpers.arrayElement([
        null,
        faker.string.alphanumeric(10),
      ]),
      reason: status === 2 ? faker.lorem.sentence() : null,
      created_at: faker.date.past({ years: 1 }),
      updated_at: faker.date.recent(),
    });
  }

  // Insert MT5 users if there are any
  if (mt5Users.length > 0) {
    await knex("mt5_users").insert(mt5Users);
    console.log(`Created ${mt5Users.length} MT5 user accounts`);
  }
};
