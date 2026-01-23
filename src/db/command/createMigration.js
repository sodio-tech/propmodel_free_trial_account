import { dbUtils } from "propmodel_api_core";
const migrationName = process.argv[2];

if (!migrationName) {
  console.error("Usage: node createMigration.js <migration_name>");
  process.exit(1);
}

dbUtils.createMigration(migrationName)
  .then(() => console.log(`Migration '${migrationName}' created successfully.`))
  .catch((err) => console.error("Error:", err));