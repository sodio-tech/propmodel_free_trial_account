/**********************************
 * Desc: Free Trial Expiration Queue
 * Handles 30-day timer for free trial accounts
 * Auth: Auto-generated
 * Date: 05/02/2025
 **********************************/

import Queue from "bull";
import { knex, initializeDatabase } from "propmodel_api_core";
import { captureException } from "propmodel_sentry_core";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Queue for free trial expiration check
const freeTrialExpirationQueue = new Queue(
  "free trial expiration",
  {
    redis: {
      port: process.env.REDIS_PORT,
      host: process.env.REDIS_HOST,
      password: process.env.REDIS_PASSWORD,
      db: Number(process.env.REDIS_DB),
      ttl: process.env.REDIS_CACHE_TTL,
    },
  }
);

// Process free trial expiration
freeTrialExpirationQueue.process(async (job) => {
  const { platformAccountUuid } = job.data;

  try {
    // Initialize database connection for the queue worker
    await initializeDatabase();

    console.log(
      `Processing free trial expiration for platform account: ${platformAccountUuid}`
    );

    // Get the platform account details
    const platformAccount = await knex("platform_accounts")
      .where("uuid", platformAccountUuid)
      .first();

    if (!platformAccount) {
      console.log(`Platform account not found: ${platformAccountUuid}`);
      return { success: false, message: "Platform account not found" };
    }

    // TODO: Add your business logic here to check if free trial should expire
    // Example conditions to check:
    // - Has the user reached profit targets?
    // - Has the user violated any trading rules?
    // - Should the account be extended/converted to paid?
    // - Should the account be disabled?

    /*
    const shouldPassCondition = await checkFreeTrialConditions(platformAccount);

    if (shouldPassCondition) {
      // Example: Convert to paid account or extend trial
      await knex("platform_accounts")
        .where("uuid", platformAccountUuid)
        .update({
          status: 1, // or other status
          // other updates...
        });
    } else {
      // Example: Disable the account
      await knex("platform_accounts")
        .where("uuid", platformAccountUuid)
        .update({
          status: 0, // disabled
          // other updates...
        });
    }
    */

    // For now, just log that the expiration check was processed
    console.log(
      `Free trial expiration check completed for: ${platformAccountUuid}`
    );

    return {
      success: true,
      message: "Free trial expiration check completed",
    };
  } catch (error) {
    console.error("Error processing free trial expiration:", error);
    captureException(error, {
      operation: "freeTrialExpirationQueue_process",
      extra: { platformAccountUuid },
    });
    throw error;
  }
});

/**
 * Schedule a free trial expiration job
 * @param {string} platformAccountUuid - UUID of the platform account
 * @param {number} trialDays - Trial period in days (default: 30)
 */
const scheduleFreeTrialExpiration = async (
  platformAccountUuid,
  trialDays = 30
) => {
  try {
    // Calculate delay: trialDays * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
    const delay = trialDays * 24 * 60 * 60 * 1000;

    const job = await freeTrialExpirationQueue.add(
      { platformAccountUuid },
      {
        delay: delay,
        jobId: `free_trial_expiration_${platformAccountUuid}`,
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      }
    );

    console.log(
      `Scheduled free trial expiration job with ID: ${job.id} for account: ${platformAccountUuid} (${trialDays} days)`
    );
    return job;
  } catch (error) {
    console.error("Error scheduling free trial expiration:", error);
    captureException(error, {
      operation: "scheduleFreeTrialExpiration",
      extra: { platformAccountUuid, trialDays },
    });
    throw error;
  }
};

/**
 * Remove a scheduled free trial expiration job
 * @param {string} platformAccountUuid - UUID of the platform account
 */
const removeFreeTrialExpirationJob = async (platformAccountUuid) => {
  try {
    const job = await freeTrialExpirationQueue.getJob(
      `free_trial_expiration_${platformAccountUuid}`
    );

    if (job) {
      await job.remove();
      console.log(
        `Removed free trial expiration job for account: ${platformAccountUuid}`
      );
      return { success: true };
    }

    return { success: false, message: "Job not found" };
  } catch (error) {
    console.error("Error removing free trial expiration job:", error);
    captureException(error, {
      operation: "removeFreeTrialExpirationJob",
      extra: { platformAccountUuid },
    });
    throw error;
  }
};

export {
  scheduleFreeTrialExpiration,
  removeFreeTrialExpirationJob,
  freeTrialExpirationQueue,
};
