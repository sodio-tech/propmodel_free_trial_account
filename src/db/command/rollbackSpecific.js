import { dbUtils } from "propmodel_api_core";

const migrationName = process.argv[2]; // Get migration name from command line

if (!migrationName) {
  console.error("Please provide a migration name.");
  process.exit(1);
}

dbUtils.rollbackSpecificMigration(migrationName)
  .then(() => console.log("Rollback completed."))
  .catch((err) => console.error("Rollback error:", err));
