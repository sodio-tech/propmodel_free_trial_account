import { dbUtils } from "propmodel_api_core";

dbUtils.runSeeders()
  .then(() => console.log("Seeding completed."))
  .catch((err) => console.error("Seeding error:", err));
