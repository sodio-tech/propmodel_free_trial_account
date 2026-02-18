/**********************************
 * Desc: Provide services for challenge module v2.
 * Auth: GitHub Copilot
 * Date: 22/04/2025
 **********************************/

import { knex } from "propmodel_api_core";
import { captureException } from "propmodel_sentry_core";
import mt5Service from "./mt5Service.js";
import { storeActivityLog } from "../../helper/common_function.js";
import { scheduleFreeTrialExpiration } from "../../helper/freeTrialExpirationQueue.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

/**
 * Helper function to get value from platform_group or fallback to default settings
 * @param {*} platformGroupValue - Value from platform_groups table
 * @param {*} defaultValue - Value from default_challenge_settings table
 * @returns {*} - Final value to use
 */
const getValueOrDefault = (platformGroupValue, defaultValue) => {
  // If platform_group has a value (not null, not undefined), use it
  // Otherwise, use the default value from default_challenge_settings
  if (platformGroupValue !== null && platformGroupValue !== undefined) {
    return platformGroupValue;
  }
  return defaultValue !== null && defaultValue !== undefined ? defaultValue : 0;
};

/**
 * Helper function to get all phase-wise settings for a specific phase
 * @param {string} platformGroupUuid - Platform group UUID
 * @param {string} phaseKey - Phase key (e.g., 'phase_1', 'phase_2', 'funded')
 * @returns {Object} - Object containing all phase-wise settings for the phase
 */
const getPhaseWiseSettings = async (platformGroupUuid, phaseKey = "phase_1") => {
  const phaseWiseSettingsRaw = await knex("phase_wise_settings")
    .where({ platform_group_uuid: platformGroupUuid, phase_key: phaseKey });

  // Transform into key-value format
  const phaseWiseSettings = {};
  for (const item of phaseWiseSettingsRaw) {
    const { setting_name, phase_value } = item;

    // Convert to number if it's a numeric string
    const parsedValue = !isNaN(phase_value) ? parseFloat(phase_value) : phase_value;
    phaseWiseSettings[setting_name] = parsedValue;
  }

  return phaseWiseSettings;
};

/**
 * Email service function to send emails
 * @param {string} url - Email API URL
 * @param {Object} data - Email data
 * @param {string} method - HTTP method
 * @returns {Promise} Axios response
 */
const emailService = async (url, data, method = "POST") => {
  return await axios({
    method,
    url,
    data,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

/**
 * Free trial - Creates a free trial account for the authenticated user
 * using a free trial code. This uses the SAME logic as awardChallenge,
 * only the input payload is different (free_trial_code instead of award parameters)
 *
 * @returns {Object} - Free trial account created
 */
const createFreeTrialAccount = async (requestBody, tokenData) => {
  const loggedInUserUuid = tokenData.uuid;

  try {
    const { free_trial_code } = requestBody;

    // NEW: Validate free trial code exists and is active (status = 1)
    const freeTrialCodeRecord = await knex("free_trial_codes")
      .where("code", free_trial_code)
      .where("status", 1)
      .first();

    if (!freeTrialCodeRecord) {
      throw new Error("Invalid free trial code");
    }

    // NEW: Get active free trial settings to find platform_group_uuid
    const freeTrialSettings = await knex("free_trial_settings")
      .where("status", 1)
      .first();

    if (!freeTrialSettings) {
      throw new Error("Free trial settings not configured");
    }

    // Check if free trials are enabled
    if (!freeTrialSettings.enable_free_trials) {
      throw new Error("Free trials are currently disabled. Please contact support for assistance.");
    }

    // Check total free trial accounts limit (100,000)
    const totalFreeTrialAccounts = await knex("platform_accounts")
      .where("award_type", "FREE_TRIAL")
      .count("* as count")
      .first();

    if (totalFreeTrialAccounts && totalFreeTrialAccounts.count >= 100000) {
      throw new Error("Free trial accounts limit reached. Maximum 100,000 accounts allowed.");
    }

    // Check user's free trial account count against max_free_trial_per_user from settings
    // Skip check if ALLOW_MULTIPLE_FREE_TRIALS=true (for testing)
    const allowMultipleFreeTrials = process.env.ALLOW_MULTIPLE_FREE_TRIALS === "true";
    const maxFreeTrialPerUser = allowMultipleFreeTrials 
      ? 999999 
      : (freeTrialSettings.max_free_trial_per_user || 1);
    
    if (!allowMultipleFreeTrials) {
      const userFreeTrialCount = await knex("platform_accounts")
        .where("user_uuid", loggedInUserUuid)
        .where("award_type", "FREE_TRIAL")
        .count("* as count")
        .first();

      const currentCount = parseInt(userFreeTrialCount?.count || 0);

      if (currentCount >= maxFreeTrialPerUser) {
        throw new Error(
          `You have reached the maximum free trial accounts limit (${maxFreeTrialPerUser}). Please contact support for assistance.`
        );
      }
    }

    const platformGroupUuid = freeTrialSettings.platform_group_uuid;
    const existingGroup = await knex("platform_groups")
      .where("uuid", platformGroupUuid)
      .first();

    if (!existingGroup) {
      throw new Error("Platform group not found for this free trial");
    }

    // Get the authenticated user (same as original logic gets users from user_emails)
    const user = await knex("users")
      .where("uuid", loggedInUserUuid)
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Use the same create_platform_account function as original award logic
    // Pass empty arrays for optional params since free trial doesn't use them
    const result = await create_platform_account(
      existingGroup,
      user,
      loggedInUserUuid,
      [], // subtags_uuids
      "FREE_TRIAL", // award_type
      null, // discountCodeRecord
      null // payment_transaction_id
    );

    // NEW: Mark the free trial code as used
    await knex("free_trial_codes")
      .where("code", free_trial_code)
      .update({
        status: 0,
        used_by_user_uuid: loggedInUserUuid,
        used_by_platform_account_uuid: result?.platform_account_uuid || null,
      });

    // Store activity log for free trial account creation
    await knex("activity_logs").insert({
      user_uuid: user.uuid,
      action: "FREE_TRIAL_CREATED",
      metadata: `Free trial account created - ${result?.platform_login_id || 'N/A'}`,
      user_type: "USER",
      event_type: "FREE_TRIAL",
      created_by: loggedInUserUuid,
      created_at: new Date(),
    });

    // Return same format as awardChallenge logic
    return {
      createdAccounts: [
        {
          platform_login_id: result?.platform_login_id,
          account_type: result?.account_type,
          account_stage: result?.account_stage,
          initial_balance: result?.initial_balance,
        },
      ],
      failedUsers: [],
    };
  } catch (error) {
    console.error("Error creating free trial:", error);
    captureException(error, {
      operation: "service_freeTrial_v2",
      user: { id: tokenData?.uuid || tokenData?.id },
      extra: { requestBody },
    });
    throw error;
  }
};

// EXACT SAME create_platform_account function as original awardChallenge logic
async function create_platform_account(
  platform_group,
  user,
  loggedInUserUuid,
  subtags_uuids = [],
  award_type,
  discountCodeRecord,
  payment_transaction_id
) {
  try {
    // Get default challenge settings (singleton) for fallback values (for non-phase-wise settings)
    const defaultSettings = await knex("default_challenge_settings").first();

    // Get advanced challenge settings for the platform_group
    // This contains account_leverage and other non-phase-wise settings
    const platform_group_advanced_settings = await knex(
      "advanced_challenge_settings"
    )
      .select("*")
      .where("platform_group_uuid", platform_group.uuid)
      .first();

    // Get phase_1 settings from phase_wise_settings table
    // These settings are now stored per phase in phase_wise_settings
    const phase1Settings = await getPhaseWiseSettings(platform_group.uuid, "phase_1");

    // Phase-wise settings (from phase_wise_settings table for phase_1)
    const profit_target_value = phase1Settings.profit_target ?? 0;
    const max_drawdown = phase1Settings.max_drawdown ?? 0;
    const max_daily_drawdown = phase1Settings.max_daily_drawdown ?? 0;
    const consistency_score = phase1Settings.consistency_score ?? 0;
    const min_trading_days = phase1Settings.min_trading_days ?? 0;

    // Non-phase-wise settings: use advanced_challenge_settings first, then platform_group, then default_challenge_settings
    const account_leverage = getValueOrDefault(
      platform_group_advanced_settings?.account_leverage,
      getValueOrDefault(platform_group.account_leverage, defaultSettings?.account_leverage)
    );
    const profit_split = getValueOrDefault(
      platform_group_advanced_settings?.profit_split,
      getValueOrDefault(platform_group.profit_split, defaultSettings?.profit_split)
    );

    const payload = {
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      group: platform_group.name,
      initial_balance: platform_group.initial_balance,
      initial_target: profit_target_value,
      leverage: account_leverage,
    };

    const mt5ServiceResponse = await mt5Service.createMt5Account(payload);

    if (!mt5ServiceResponse || !mt5ServiceResponse.data) {
      throw new Error("MT5 service returned invalid response");
    }

    const { data: mt5_response } = mt5ServiceResponse;

    if (mt5_response.success === false) {
      console.log("Error creating MT5 account");
      return user.email;
    }

     // Calculate amount after discount
     const originalAmount = Number(platform_group.prices);
     let amountTotal = originalAmount;

     // Apply discount if discount code is provided
     if (discountCodeRecord && discountCodeRecord.discount) {
       const discountPercentage = Number(discountCodeRecord.discount);
       const discountAmount = (originalAmount * discountPercentage) / 100;
       amountTotal = originalAmount - discountAmount;
       // Round to 2 decimal places
       amountTotal = Math.round(amountTotal * 100) / 100;
     }


    const purchaseData = {
        user_uuid: user.uuid,
        amount_total: amountTotal,
        original_amount: originalAmount,
        payment_method: "AWARD",
        payment_status: 1,
        user_data: JSON.stringify({
          first_name: user.first_name,
          last_name: user.last_name,
        }),
    };

    // Add discount_uuid if discount code is provided
    if (discountCodeRecord) {
      purchaseData.discount_uuid = discountCodeRecord.uuid;
    }

    // Add payment_transaction_id if provided and not empty
    if (payment_transaction_id && payment_transaction_id.trim() !== "") {
      purchaseData.payment_transaction_id = payment_transaction_id;
    }

    const purchaseRes = await knex("purchases")
      .insert(purchaseData)
      .returning("*")
      .then((rows) => rows[0]);

    const platformRes = await knex("platform_accounts")
      .insert({
        user_uuid: user.uuid,
        purchase_uuid: purchaseRes.uuid,
        remote_group_name: platform_group.name,
        platform_login_id: mt5_response.data?.login || null,
        main_password: mt5_response.data?.main_password || null,
        investor_password: mt5_response.data?.investor_password || null,
        platform_group_uuid: platform_group.uuid,
        initial_balance: platform_group.initial_balance,
        profit_target: profit_target_value,
        account_leverage,
        profit_split,
        max_drawdown,
        max_daily_drawdown,
        account_stage: platform_group.account_stage,
        account_type: platform_group.account_type,
        action_type: award_type === "FREE_TRIAL" ? "free_trial_challenge" : "challenge",
        award_type: award_type
      })
      .returning("*")
      .then((rows) => rows[0]);

    // Prepare advanced_challenge_settings for platform account
    // Start with existing group settings if available, otherwise use defaults
    const baseSettings = platform_group_advanced_settings || defaultSettings || {};

    // Extract fields to exclude when copying
    const {
      uuid,
      platform_group_uuid,
      platform_account_uuid,
      created_at,
      updated_at,
      profit_target: existing_profit_target,
      account_leverage: existing_account_leverage,
      profit_split: existing_profit_split,
      max_drawdown: existing_max_drawdown,
      max_daily_drawdown: existing_max_daily_drawdown,
      consistency_score: existing_consistency_score,
      min_trading_days: existing_min_trading_days,
      max_trading_days,
      ...other_settings_to_copy
    } = baseSettings;

    // Insert advanced_challenge_settings for platform account
    // Use phase_1 values from phase_wise_settings for phase-wise fields
    // Use merged values for non-phase-wise fields, copy other settings from group/defaults
    await knex("advanced_challenge_settings").insert({
      ...other_settings_to_copy,
      account_leverage,
      profit_split,
      profit_target: profit_target_value,
      max_drawdown,
      max_daily_drawdown,
      consistency_score,
      min_trading_days,
      platform_account_uuid: platformRes.uuid,
      max_trading_days: platform_group?.max_trading_days ?? max_trading_days ?? 30
    });


    //Send email to new user for purchase
    await sendEmailForNewPurchase(platformRes, user);

    // Create a tag record for this platform account
    await knex("tags").insert({
      platform_account_uuid: platformRes.uuid,
      challenge_type: "Challenge",
      acquisition_method: "Awarded",
    });

    // Create tag and attach subtags if provided
    if (subtags_uuids && subtags_uuids.length > 0) {
      const subtagAttachments = subtags_uuids.map((subtag_uuid) => ({
        platform_account_uuid: platformRes.uuid,
        subtag_uuid: subtag_uuid,
      }));

      await knex("platform_account_subtags").insert(subtagAttachments);
    }

    // storing the activity logs
    await storeActivityLog({
      user_uuid: user.uuid,
      action: "AWARDED_CHALLENGE",
      metadata: `Account has been awarded - ${platformRes.platform_login_id}`,
      user_type: "ADMIN_USER",
      event_type: "CHALLENGE",
      created_by: loggedInUserUuid,
    });

    // Schedule free trial expiration job only for FREE_TRIAL accounts
    // Use FREE_TRIAL_EXPIRY_MINUTES from env (default: 43200 minutes = 30 days)
    if (award_type === "FREE_TRIAL") {
      try {
        const trialMinutes = parseInt(process.env.FREE_TRIAL_EXPIRY_MINUTES || "43200");
        const trialDays = trialMinutes / (24 * 60); // Convert minutes to days
        await scheduleFreeTrialExpiration(platformRes.uuid, trialDays);
      } catch (queueError) {
        console.error("Error scheduling free trial expiration job:", queueError);
        // Don't throw - account creation succeeded, just log the queue error
        captureException(queueError, {
          operation: "scheduleFreeTrialExpiration",
          extra: { platformAccountUuid: platformRes.uuid },
        });
      }
    }

    return {
      platform_account_uuid: platformRes.uuid,
      platform_login_id: platformRes.platform_login_id,
      initial_balance: platformRes.initial_balance,
      account_type: platformRes.account_type,
      account_stage: platformRes.account_stage,
    };
  } catch (error) {
    console.error("Error creating platform account:", error);
    captureException(error, {
      operation: "service_create_platform_account_v2",
      user: { id: loggedInUserUuid },
      extra: { userUuid: user.uuid, platformGroup: platform_group.uuid },
    });
    throw error;
  }
}

const sendEmailForNewPurchase = async (platformAccount, userData) => {
   // Send challenge credentials email notification
   const apiUrl = `${process.env.EMAIL_API_URL}/api/v1/send-email`;

   const emailData = {
       email: userData.email,
       email_type: "CHALLENGE_CREDENTIALS",
       data: {
           first_name: userData.first_name,
           account_type: platformAccount.account_type,
           account_balance: platformAccount.initial_balance,
           account_stages: platformAccount.account_stage,
           account_number: platformAccount?.platform_login_id,
           account_password: platformAccount?.main_password,
           investor_password: platformAccount?.investor_password
       }
   };

 try {
   await emailService(apiUrl, emailData, "POST");

 } catch (error) {
   console.log(error);
   // Continue execution even if email fails
   captureException(error);
 }
}

const getFreeTrialStats = async () => {
  try {
    const [
      freeTrialCodesResult,
      totalPayoutResult,
      totalAccountsResult,
      liveAccountsResult,
      breachedAccountsResult,
      reachingPayoutResult,
      purchasedAfterFreeTrialResult,
      profitVsLossResult,
    ] = await Promise.all([
      // 1. Number of free trial codes (status = 1 means active)
      knex("free_trial_codes")
        .where("status", 1)
        .count("* as count")
        .first(),

      // 2. Total payout from free trial accounts (count and amount)
      knex("payout_requests as pr")
        .join("platform_accounts as pa", "pr.platform_account_uuid", "pa.uuid")
        .where("pa.award_type", "FREE_TRIAL")
        .where("pa.action_type", "free_trial_challenge")
        .where("pr.status", 1) // Only approved payouts
        .select(
          knex.raw("COUNT(*) as payout_count"),
          knex.raw("COALESCE(SUM(pr.amount), 0) as total_payout")
        )
        .first(),

      // 3. Number of total free trial accounts
      knex("platform_accounts")
        .where("award_type", "FREE_TRIAL")
        .where("action_type", "free_trial_challenge")
        .count("* as count")
        .first(),

      // 4. Number of live accounts (status = 1 means live)
      knex("platform_accounts")
        .where("award_type", "FREE_TRIAL")
        .where("action_type", "free_trial_challenge")
        .where("status", 1)
        .count("* as count")
        .first(),

      // 5. Breached accounts (status = 0 and funded_status = 0)
      knex("platform_accounts")
        .where("award_type", "FREE_TRIAL")
        .where("action_type", "free_trial_challenge")
        .where("status", 0)
        .where("funded_status", 0)
        .count("* as count")
        .first(),

      // 6. Number of accounts reaching payout (distinct accounts with approved payout)
      knex("payout_requests as pr")
        .join("platform_accounts as pa", "pr.platform_account_uuid", "pa.uuid")
        .where("pa.award_type", "FREE_TRIAL")
        .where("pa.action_type", "free_trial_challenge")
        .where("pr.status", 1)
        .select(knex.raw("COUNT(DISTINCT pa.uuid) as count"))
        .first(),

      // 7. Number of users who purchased after free trial
      // Users who have FREE_TRIAL accounts AND have made a purchase (non-AWARD payment)
      knex("users as u")
        .whereExists(
          knex("platform_accounts as pa")
            .whereRaw("pa.user_uuid = u.uuid")
            .where("pa.award_type", "FREE_TRIAL")
            .where("pa.action_type", "free_trial_challenge")
        )
        .whereExists(
          knex("purchases as p")
            .whereRaw("p.user_uuid = u.uuid")
            .where("p.payment_status", 1)
            .whereNot("p.payment_method", "AWARD")
        )
        .count("* as count")
        .first(),

      // 8. Profit vs Loss for live free trial accounts
      knex("platform_accounts as pa")
        .join("account_stats as ast", "ast.platform_account_uuid", "pa.uuid")
        .where("pa.award_type", "FREE_TRIAL")
        .where("pa.action_type", "free_trial_challenge")
        .where("pa.status", 1) // Only live accounts
        .where("ast.status", "active") // Only active account stats
        .where("ast.trading_days_count", ">", 0) // Must have trading days
        .select(
          knex.raw(`
            sum(case when (ast.current_equity - pa.initial_balance) > 0 then (ast.current_equity - pa.initial_balance) else 0 end) as total_profit
          `),
          knex.raw(`
            sum(case when (ast.current_equity - pa.initial_balance) < 0 then (ast.current_equity - pa.initial_balance) else 0 end) as total_loss
          `),
          knex.raw("sum(ast.current_equity - pa.initial_balance) as net_profit")
        )
        .first(),
    ]);

    const numberOfFreeTrialCodes = parseInt(freeTrialCodesResult?.count || 0);
    const totalPayoutFromFreeTrial = parseFloat(totalPayoutResult?.total_payout || 0);
    const totalPayoutCount = parseInt(totalPayoutResult?.payout_count || 0);
    const numberOfFreeTrialAccounts = parseInt(totalAccountsResult?.count || 0);
    const numberOfLiveAccounts = parseInt(liveAccountsResult?.count || 0);
    const breachedAccountOfFreeTrial = parseInt(breachedAccountsResult?.count || 0);
    const numberOfReachingPayout = parseInt(reachingPayoutResult?.count || 0);
    const numberOfUserWhoPurchasedAfterFreeTrial = parseInt(purchasedAfterFreeTrialResult?.count || 0);

    // Calculate reaching payout percentage
    const reachingPayoutPercentage = numberOfFreeTrialAccounts > 0
      ? parseFloat(((numberOfReachingPayout / numberOfFreeTrialAccounts) * 100).toFixed(2))
      : 0;

    // Calculate profit vs loss
    const totalProfit = parseFloat(profitVsLossResult?.total_profit || 0);
    const totalLoss = Math.abs(parseFloat(profitVsLossResult?.total_loss || 0));
    const netProfit = parseFloat(profitVsLossResult?.net_profit || 0);
    const totalAbsolute = totalProfit + totalLoss;

    return {
      number_of_free_trial_codes: numberOfFreeTrialCodes,
      total_payout_from_free_trial: totalPayoutFromFreeTrial,
      total_payout_count: totalPayoutCount,
      breached_account_of_free_trial: breachedAccountOfFreeTrial,
      number_of_user_who_purchased_after_free_trial: numberOfUserWhoPurchasedAfterFreeTrial,
      free_trial_accounts: {
        total: numberOfFreeTrialAccounts,
        live: numberOfLiveAccounts,
        reaching_payout: numberOfReachingPayout,
        reaching_payout_percentage: reachingPayoutPercentage,
      },
      live_accounts_profit_loss: {
        total_profit: totalProfit,
        total_loss: -totalLoss,
        net_profit: netProfit,
        profit_percentage: totalAbsolute ? parseFloat(((totalProfit / totalAbsolute) * 100).toFixed(2)) : 0,
        loss_percentage: totalAbsolute ? parseFloat(((totalLoss / totalAbsolute) * 100).toFixed(2)) : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching free trial stats:", error);
    captureException(error, {
      operation: "service_getFreeTrialStats",
    });
    throw new Error("Failed to fetch free trial stats");
  }
};

export default {
  createFreeTrialAccount,
  getFreeTrialStats,
};
