/**********************************
 * Desc: Free Trial Expiration Queue
 * Handles 30-day timer for free trial accounts
 * Auth: Auto-generated
 * Date: 05/02/2025
 **********************************/

import Queue from "bull";
import { knex } from "propmodel_api_core";
import { captureException } from "propmodel_sentry_core";
import dotenv from "dotenv";
import mt5Service from "../services/v2/mt5Service.js";
import { sendWebhookEvent } from "./webhookHelper.js";

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
    },
  }
);

// Process free trial expiration
freeTrialExpirationQueue.process(async (job) => {
  const { platformAccountUuid } = job.data;

  try {
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

    // Check if this is actually a free trial account
    if (platformAccount.award_type !== "FREE_TRIAL") {
      console.log(`Account is not a free trial: ${platformAccountUuid}`);
      return { success: false, message: "Not a free trial account" };
    }

    // Check if account is already disabled
    if (platformAccount.status === 0) {
      console.log(`Free trial account already disabled: ${platformAccountUuid}`);
      return { success: true, message: "Account already disabled" };
    }

    // TODO: Add business logic here to check conditions for free trial expiration
    // Example conditions to check:
    // - Has the user reached profit targets? -> Convert to paid or extend
    // - Has the user violated trading rules? -> Disable immediately
    // - Should the account be extended? -> Reschedule queue job
    // - Default: Disable the account

    // For now, default behavior: Disable the free trial account
    console.log(`Disabling free trial account: ${platformAccountUuid}`);

    // 1. Disable the MT5 account (close positions and disable)
    if (platformAccount.platform_login_id) {
      try {
        const mt5Response = await mt5Service.closePositionsDisableMultipleAccounts({
          logins: [platformAccount.platform_login_id],
        });
        console.log(
          `MT5 account disabled: ${platformAccount.platform_login_id}`,
          mt5Response
        );
      } catch (mt5Error) {
        console.error(
          `Error disabling MT5 account ${platformAccount.platform_login_id}:`,
          mt5Error
        );
        captureException(mt5Error, {
          operation: "freeTrialExpirationQueue_disableMT5",
          extra: {
            platformAccountUuid,
            platform_login_id: platformAccount.platform_login_id,
          },
        });
        // Continue with database update even if MT5 disable fails
      }
    }

    // 2. Send webhook event for free trial expiration
    // The webhook handler will take care of disabling the account
    const webhookSent = await sendWebhookEvent(
      "challengeFailed",
      platformAccount.platform_login_id,
      false,
      "Free trial expired"
    );

    if (!webhookSent) {
      console.error(`Failed to send webhook for free trial expiration: ${platformAccountUuid}`);
      // Still log the attempt even if webhook fails
    }

    // 3. Store activity log for free trial expiration
    await knex("activity_logs").insert({
      user_uuid: platformAccount.user_uuid,
      action: "FREE_TRIAL_EXPIRED",
      metadata: `Free trial account expired and disabled - ${platformAccount.platform_login_id}`,
      user_type: "SYSTEM",
      event_type: "FREE_TRIAL",
      created_by: "SYSTEM",
      created_at: new Date(),
    });

    console.log(
      `Free trial account disabled successfully: ${platformAccountUuid}`
    );

    return {
      success: true,
      message: "Free trial account disabled",
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
