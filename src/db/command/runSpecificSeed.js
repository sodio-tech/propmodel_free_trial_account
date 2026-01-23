import { dbUtils } from "propmodel_api_core";
const seedName = process.argv[2]; // Get migration name from command line

if (!seedName) {
  console.error("Please provide a seed name.");
  process.exit(1);
}
dbUtils.runSpecificSeeder(seedName)
  .then(() => console.log(`Seeding completed.-${seedName}`))
  .catch((err) => console.error("Seeding error:", err));
