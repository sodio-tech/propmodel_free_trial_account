import { knex, createToken, initializeDatabase } from "propmodel_api_core";
import dotenv from "dotenv";
import runMigrations from "../src/db/command/runMigrations.js";

dotenv.config({ path: ".env.test" });

beforeAll(async () => {
  await initializeDatabase();
  try {
    await runMigrations();
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
});

beforeEach(async () => {
  await knex("users").del();
});

afterAll(async () => {
  try {
    await knex.destroy();
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (error) {
    console.error("Cleanup failed:", error);
    await knex.destroy();
  }
});

describe("Authentication Tests", () => {
  describe("createToken", () => {
    it("should create a valid JWT token", async () => {
      const reqParams = { id: 1, email: "as@gmail.com" };
      const response = await createToken(reqParams);
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("token");
    });
  });
});
