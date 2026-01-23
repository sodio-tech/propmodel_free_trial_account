import { faker } from "@faker-js/faker";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("competition_prizes").del();

  // Get competitions
  const competitions = await knex("competitions").select(
    "uuid",
    "status",
    "prize_type"
  );

  if (competitions.length === 0) {
    console.log("No competitions found. Skipping competition_prizes seed.");
    return;
  }

  const prizes = [];

  // For each competition, add prize structures
  competitions.forEach((competition) => {
    // Define prize tiers (1st, 2nd, 3rd place, etc.)
    const prizeTiers =
      competition.status === "completed"
        ? [1, 2, 3] // For completed competitions, add top 3 winners
        : [1, 2, 3]; // For all competitions, define at least top 3 prizes

    // Add some competitions with more prize tiers
    if (faker.datatype.boolean()) {
      prizeTiers.push(4);
      prizeTiers.push(5);
    }

    // Create prizes for each tier
    prizeTiers.forEach((prizeRank) => {
      let prizeDetails = {};

      // Different prize structures based on the competition's prize_type
      if (
        competition.prize_type === "cash" ||
        (competition.prize_type === "mixed" && prizeRank < 2)
      ) {
        // Cash prizes - higher for top ranks
        const baseAmount = 10000 / Math.pow(2, prizeRank - 1); // 10000, 5000, 2500, etc.
        prizeDetails = {
          type: "cash",
          title: `${
            prizeRank === 1
              ? "1st"
              : prizeRank === 2
              ? "2nd"
              : prizeRank === 3
              ? "3rd"
              : `${prizeRank}th`
          } Place`,
          amount: baseAmount,
          currency: "USD",
          description: `Cash prize for ${
            prizeRank === 1
              ? "1st"
              : prizeRank === 2
              ? "2nd"
              : prizeRank === 3
              ? "3rd"
              : `${prizeRank}th`
          } place`,
        };
      } else {
        // Funded account prizes
        const accountSize = [100000, 50000, 25000, 10000, 5000][
          Math.min(prizeRank - 1, 4)
        ];
        prizeDetails = {
          type: "funded_account",
          title: `${
            prizeRank === 1
              ? "1st"
              : prizeRank === 2
              ? "2nd"
              : prizeRank === 3
              ? "3rd"
              : `${prizeRank}th`
          } Place`,
          accountSize,
          duration: faker.helpers.arrayElement([30, 60, 90, 180]),
          profitSplit: faker.helpers.arrayElement([70, 80, 90]),
          description: `$${accountSize} Funded Account for ${
            prizeRank === 1
              ? "1st"
              : prizeRank === 2
              ? "2nd"
              : prizeRank === 3
              ? "3rd"
              : `${prizeRank}th`
          } place`,
        };
      }

      // For completed competitions, potentially assign winners
      let winnerUuid = null;
      let isClaimed = false;

      if (competition.status === "completed" && faker.datatype.boolean()) {
        // Find a winner and set as claimed (just for seed data purposes)
        isClaimed = faker.datatype.boolean();
        // In a real scenario, we'd assign an actual user as a winner
      }

      prizes.push({
        uuid: faker.string.uuid(),
        competition_uuid: competition.uuid,
        prize_rank: prizeRank,
        prize_details: JSON.stringify(prizeDetails),
        is_claimed: isClaimed,
        winner_uuid: winnerUuid,
        created_at: faker.date.past({ years: 1 }),
        updated_at: new Date(),
      });
    });
  });

  // Insert all prizes
  if (prizes.length > 0) {
    await knex("competition_prizes").insert(prizes);
  }
};
