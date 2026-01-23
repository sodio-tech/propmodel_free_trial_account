/**********************************
 * Desc: Provide services for challenge module v2.
 * Auth: GitHub Copilot
 * Date: 22/04/2025
 **********************************/

import { knex } from "propmodel_api_core";
import { captureException } from "propmodel_sentry_core";
import mt5Service from "./mt5Service.js";
import { storeActivityLog } from "../../helper/common_function.js";
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
 * Helper function to get a single phase-wise setting value
 * @param {string} platformGroupUuid - Platform group UUID
 * @param {string} settingName - Setting name (e.g., 'max_drawdown', 'profit_target')
 * @param {string} phaseKey - Phase key (e.g., 'phase_1', 'phase_2', 'funded')
 * @returns {*} - Setting value or null if not found
 */
const getPhaseWiseSetting = async (platformGroupUuid, settingName, phaseKey) => {
  const setting = await knex("phase_wise_settings")
    .where({
      platform_group_uuid: platformGroupUuid,
      setting_name: settingName,
      phase_key: phaseKey,
    })
    .first();

  if (!setting || setting.phase_value === null || setting.phase_value === undefined) {
    return null;
  }

  // Convert to number if it's a numeric string
  const parsedValue = !isNaN(setting.phase_value)
    ? parseFloat(setting.phase_value)
    : setting.phase_value;

  return parsedValue;
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
 * Award challenge
 *
 * @returns {Object} - Challenge awarded
 */
const awardChallenge = async (requestBody, tokenData) => {
  const loggedInUserUuid = tokenData.uuid;

  try {
    const {
      platform_name,
      initial_balance,
      account_stage,
      account_type,
      award_type,
      user_emails,
      subtags_uuids = [],
      discount_code,
      payment_transaction_id,
    } = requestBody;

    // Validate discount code exists by name (if provided and not empty)
    let discountCodeRecord = null;
    if (discount_code && discount_code.trim() !== "") {
      discountCodeRecord = await knex("discount_codes")
        .where("name", discount_code)
        .first();

      if (!discountCodeRecord) {
        throw new Error(`Discount code with name "${discount_code}" does not exist`);
      }
    }

    // Uppercase award_type
    const uppercaseAwardType = award_type?.toUpperCase();

     // Get challenge details
    const existingGroup = await knex("platform_groups")
      .where({
        initial_balance,
        account_stage,
        account_type,
        platform_name,
        group_type: "challenge",
      })
      .first();

    if (!existingGroup) {
      throw new Error("Group does not exist with the given UUID");
    }

    let users = [];
    let failedUsers = [];

    if(user_emails && user_emails.length > 0) {
      users = await knex("users").whereIn("email", user_emails);
      const foundEmails = users.map((user) => user.email);
      const allExist = user_emails.every((email) => foundEmails.includes(email));
      if (!allExist) {
        const missing = user_emails.filter((email) => !foundEmails.includes(email));
        failedUsers.push(...missing);
        // throw new Error(`some users does not exists with emails: ${missing}`);
      }
    }

    // Validate subtags if provided
    if (subtags_uuids && subtags_uuids.length > 0) {
      const existingSubtags = await knex("subtags")
        .whereIn("uuid", subtags_uuids)
        .select("uuid");

      const foundSubtagUuids = existingSubtags.map((subtag) => subtag.uuid);
      const missingSubtags = subtags_uuids.filter(
        (uuid) => !foundSubtagUuids.includes(uuid)
      );

      if (missingSubtags.length > 0) {
        throw new Error(
          `Some subtags do not exist with IDs: ${missingSubtags.join(", ")}`
        );
      }
    }

    // Process users concurrently for better performance
    const results = await Promise.all(
      users.map((user) => {
        return create_platform_account(
          existingGroup,
          user,
          loggedInUserUuid,
          subtags_uuids,
          uppercaseAwardType,
          discountCodeRecord,
          payment_transaction_id
        );
      })
    );

    results.forEach((result, idx) => {
      if (result) {
        // If create_platform_account returns user email, it indicates a failed user
        failedUsers.push(result);
      }
    });

    return { failedUsers };
  } catch (error) {
    console.error("Error awarding a challenge:", error);
    captureException(error, {
      operation: "service_awardChallenge_v2",
      user: { id: tokenData?.uuid || tokenData?.id },
      extra: { requestBody },
    });
    throw error; // Preserve the original detailed error message
  }
};

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

    // Get phase_1 settings from phase_wise_settings table
    // These settings are now stored per phase in phase_wise_settings
    const phase1Settings = await getPhaseWiseSettings(platform_group.uuid, "phase_1");

    // Phase-wise settings (from phase_wise_settings table for phase_1)
    const profit_target_value = phase1Settings.profit_target ?? 0;
    const max_drawdown = phase1Settings.max_drawdown ?? 0;
    const max_daily_drawdown = phase1Settings.max_daily_drawdown ?? 0;
    const consistency_score = phase1Settings.consistency_score ?? 0;
    const min_trading_days = phase1Settings.min_trading_days ?? 0;

    // Non-phase-wise settings: use platform_group or fallback to default_challenge_settings
    const account_leverage = getValueOrDefault(
      platform_group.account_leverage,
      defaultSettings?.account_leverage
    );
    const profit_split = getValueOrDefault(
      platform_group.profit_split,
      defaultSettings?.profit_split
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

    // Get existing advanced settings from platform group (if any) to copy other fields
    const platform_group_advanced_settings = await knex(
      "advanced_challenge_settings"
    )
      .select("*")
      .where("platform_group_uuid", platform_group.uuid)
      .first();

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
        action_type: "challenge",
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
    await sendEmailForNewPurchase(platformRes,user);

    // Create a tag record for this platform account
    await knex("tags").insert({
      platform_account_uuid: platformRes.uuid,
      challenge_type: "Challenge", // Since this is award challenge
      acquisition_method: "Awarded", // Since this is award challenge
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

    return null;
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

const sendEmailForNewPurchase = async (platformAccount,userData) => {
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

export default {
  awardChallenge,
};
