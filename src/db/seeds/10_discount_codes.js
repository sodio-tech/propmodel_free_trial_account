import { faker } from "@faker-js/faker";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("discount_codes").del();

  // Generate discount codes
  const discountCodes = Array.from({ length: 20 }).map(() => {
    // Create a mix of active, expired, and future codes
    const currentDate = new Date();
    let endDate;

    const codeStatus = faker.helpers.arrayElement([
      0, // Inactive
      1, // Active
      2, // Expired
    ]);

    if (codeStatus === 1) {
      // Active code with future end date
      endDate = faker.date.future({ years: 1 });
    } else if (codeStatus === 2) {
      // Expired code
      endDate = faker.date.past({ years: 1 });
    } else {
      // Inactive code
      endDate = faker.datatype.boolean()
        ? faker.date.future({ months: 6 })
        : null;
    }

    // Generate discount code
    const codePrefix = faker.helpers.arrayElement([
      "SALE",
      "PROMO",
      "SPECIAL",
      "DEAL",
      "GIFT",
    ]);
    const codeSuffix = faker.string.alphanumeric(5).toUpperCase();
    const code = `${codePrefix}${codeSuffix}`;

    // Create discount value
    const discount = faker.number.int({ min: 5, max: 50 });

    // Max and current usage counts
    const maxUsagesCount = faker.number.int({ min: 1, max: 1000 });
    const currentUsagesCount =
      codeStatus === 2
        ? faker.number.int({ min: 1, max: maxUsagesCount })
        : faker.number.int({ min: 0, max: 20 });

    // Group key (optional)
    const groupKey = faker.datatype.boolean()
      ? faker.helpers.arrayElement(["VIP", "NEW_USER", "SEASONAL", "PARTNER"])
      : null;

    // Account balance (optional)
    const accountBalance = faker.datatype.boolean()
      ? parseFloat(faker.finance.amount({ min: 0, max: 1000, dec: 2 }))
      : 0;

    return {
      uuid: faker.string.uuid(),
      code,
      status: codeStatus,
      max_usages_count: maxUsagesCount,
      current_usages_count: currentUsagesCount,
      discount,
      end_date: endDate,
      group_key: groupKey,
      account_balance: accountBalance,
      created_at: faker.date.past({ years: 2 }),
      updated_at: new Date(),
    };
  });

  // Insert all discount codes
  await knex("discount_codes").insert(discountCodes);
};
