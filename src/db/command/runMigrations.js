import { dbUtils } from "propmodel_api_core";

const runMigrations = async () => {
    try {
        await dbUtils.runMigrations();
    } catch (error) {
        console.error("Migration error:", error);
        throw error;
    }
};

// For command line execution
if (import.meta.url.endsWith('runMigrations.js')) {
  dbUtils.runMigrations()
        .then(() => {
            console.log("Migrations completed.");
        })
        .catch((err) => console.log(err));
}

export default runMigrations;