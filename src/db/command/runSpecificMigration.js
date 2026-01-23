import { dbUtils } from "propmodel_api_core";
const migrationName = process.argv[2]; // Get migration name from command line

if (!migrationName) {
  console.error("Please provide a migration name.");
  process.exit(1);
}
dbUtils.runSpecificMigration(migrationName)
  .then(() => console.log(`Migration completed.-${migrationName}`))
  .catch((err) => console.error("Seeding error:", err));
