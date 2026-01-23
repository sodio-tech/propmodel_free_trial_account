import { dbUtils } from "propmodel_api_core";

const rollbackMigrations = async () => {
    try {
        await dbUtils.rollbackMigrations();
    } catch (error) {
        console.error("Migration error:", error);
        throw error;
    }
};
// For command line execution
if (import.meta.url.endsWith('runMigrations.js')) {
dbUtils.rollbackMigrations()
  .then(() => console.log("Rollback completed."))
  .catch((err) => console.error("Rollback error:", err));
}

export default rollbackMigrations;