/**********************************
 * Desc: Test service for API testing
 * Date: 30/01/2026
 **********************************/

import { captureException } from "propmodel_sentry_core";
import emailService from "../../helper/emailService.js";

/**
 * Update mastery progress for the "Referral Ninja" quest when a new user is referred
 *
 * @param {Object} payload - Payload containing knex and user_uuid
 * @param {Object} payload.knex - Knex instance
 * @param {string} payload.user_uuid - User ID (the new referred user)
 * @returns {Object} - Result message
 */
const updateReferralNinjaMasteryProgress = async ({ knex, user_uuid }) => {
  try {
    console.log(`[Mastery] Referral Ninja progress update called with user_uuid: ${user_uuid}`);

    // Find user by user_uuid or fail
    const user = await knex("users")
      .where("uuid", user_uuid)
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user was referred by another user
    if (!user.ref_by_user_id) {
      console.log(`[Mastery] User ${user_uuid} was not referred by anyone. Skipping mastery progress update.`);
      return {
        success: true,
        message: "User was not referred by anyone",
      };
    }

    // Get the referrer (user who referred this user)
    const referrer = await knex("users")
      .where("uuid", user.ref_by_user_id)
      .first();

    if (!referrer) {
      console.log(`[Mastery] Referrer ${user.ref_by_user_id} not found. Skipping mastery progress update.`);
      return {
        success: true,
        message: "Referrer not found",
      };
    }

    // Get the "Referral Ninja" mastery quest
    const quest = await knex("mastery_quests")
      .where("key", "referral-ninja")
      .first();

    if (!quest) {
      console.warn(
        `[Mastery] "Referral Ninja" quest not found. Cannot update mastery progress for referrer ${referrer.uuid}`
      );
      return {
        success: false,
        message: "Referral Ninja quest not found",
      };
    }

    const questUuid = quest.uuid;

    console.log(
      `[Mastery] Found "Referral Ninja" quest with UUID: ${questUuid} for referrer: ${referrer.uuid}`
    );

    // Get existing user progress for this quest
    let userProgress = await knex("mastery_progress")
      .where({
        user_uuid: referrer.uuid,
        quest_uuid: questUuid,
      })
      .first();

    // Parse extra_data to check if this referral was already counted
    let extraData = {};
    if (userProgress?.extra_data) {
      try {
        extraData = typeof userProgress.extra_data === 'string'
          ? JSON.parse(userProgress.extra_data)
          : userProgress.extra_data;
      } catch (e) {
        console.error('[Mastery] Failed to parse extra_data:', e);
        extraData = {};
      }
    }

    // Initialize referral_ninja structure if not exists
    if (!extraData.referral_ninja) {
      extraData.referral_ninja = {
        count: 0,
        referral_uuids: []
      };
    }

    // Check if this user's referral was already counted
    if (extraData.referral_ninja.referral_uuids.includes(user_uuid)) {
      console.log(
        `[Mastery] User ${user_uuid} was already counted in referrer ${referrer.uuid} Referral Ninja progress. Skipping.`
      );
      return {
        success: true,
        message: "Referral already counted - no update needed",
        already_counted: true,
      };
    }

    // This is a new unique referral - add to tracking and update progress
    extraData.referral_ninja.referral_uuids.push(user_uuid);
    const newCount = extraData.referral_ninja.count + 1;
    extraData.referral_ninja.count = newCount;

    if (!userProgress) {
      // No progress yet: start at level 0 with requirement value 1
      console.log(
        `[Mastery] Creating new mastery progress entry for referrer ${referrer.uuid}, quest ${questUuid}`
      );
      await knex("mastery_progress").insert({
        user_uuid: referrer.uuid,
        quest_uuid: questUuid,
        current_level_number: 0,
        current_requirement_value: 1,
        extra_data: JSON.stringify(extraData),
      });
      console.log(
        `[Mastery] Successfully created mastery progress entry for referrer ${referrer.uuid}`
      );

      // Check if level 1 requirement is met
      await checkAndUpgradeLevel({ knex, user_uuid: referrer.uuid, questUuid, currentLevelNumber: 0, newRequirementValue: 1 });
    } else {
      // Existing progress: use the count from extra_data
      const currentLevelNumber = userProgress.current_level_number || 0;

      // Check if requirement is met for the next level and upgrade if needed
      const newLevelNumber = await checkAndUpgradeLevel({
        knex,
        user_uuid: referrer.uuid,
        questUuid,
        currentLevelNumber,
        newRequirementValue: newCount
      });

      // Update progress with new count and updated extra_data
      await knex("mastery_progress")
        .where({ uuid: userProgress.uuid })
        .update({
          current_requirement_value: newCount,
          current_level_number: newLevelNumber,
          extra_data: JSON.stringify(extraData),
          updated_at: knex.fn.now(),
        });
      console.log(
        `[Mastery] Successfully updated mastery progress for referrer ${referrer.uuid}, new count: ${newCount}`
      );
    }

    return {
      success: true,
      message: "Referral Ninja mastery progress updated successfully",
    };
  } catch (error) {
    console.error(`[Mastery] Error updating Referral Ninja mastery progress for user ${user_uuid}:`, error);
    captureException(error, {
      operation: "service_updateReferralNinjaMasteryProgress_v2",
      user: { id: user_uuid },
      extra: { user_uuid },
    });
    throw error;
  }
};

/**
 * Check and upgrade level if requirement is met
 *
 * @param {Object} params - Parameters
 * @param {Object} params.knex - Knex instance
 * @param {string} params.user_uuid - User UUID
 * @param {string} params.questUuid - Quest UUID
 * @param {number} params.currentLevelNumber - Current level number
 * @param {number} params.newRequirementValue - New requirement value
 * @returns {Promise<number>} - New level number
 */
const checkAndUpgradeLevel = async ({ knex, user_uuid, questUuid, currentLevelNumber, newRequirementValue }) => {
  try {
    // Get requirement for the NEXT level (current_level + 1)
    const nextLevelNumber = currentLevelNumber + 1;

    const nextLevelInfo = await knex("mastery_levels")
      .where({
        quest_uuid: questUuid,
        level_number: nextLevelNumber,
      })
      .first();

    let newLevelNumber = currentLevelNumber;

    // If next level exists and requirement is met, upgrade to next level
    if (nextLevelInfo && newRequirementValue >= Number(nextLevelInfo.requirement_value)) {
      const upgradedLevel = nextLevelNumber;
      newLevelNumber = upgradedLevel > 10 ? 10 : upgradedLevel;

      // Credit user's wallet with the level reward amount
      try {
        const walletApiUrl = new URL(
          "/api/v1/wallet/balance/add",
          process.env.WALLET_API_BASE_URL || process.env.WALLET_BASE_URL
        );

        const walletData = {
          user_uuid: user_uuid,
          amount: Number(nextLevelInfo.reward_amount) || 0,
          is_admin: true,
          reason: `Mastery quest "Referral Ninja" level ${upgradedLevel} completed`,
        };

        await emailService(walletApiUrl, walletData, "POST");

        console.log(
          "[Mastery] Successfully credited wallet for level completion",
          JSON.stringify({
            user_uuid: user_uuid,
            quest_uuid: questUuid,
            level_number: upgradedLevel,
            wallet_amount_credited: Number(nextLevelInfo.reward_amount) || 0,
          })
        );
      } catch (walletError) {
        // Log wallet credit error but don't fail the mastery progress update
        console.error(
          "[Mastery] Failed to credit wallet for level completion:",
          walletError
        );
        captureException(walletError, {
          operation: "creditMasteryQuestReward",
          extra: {
            user_uuid: user_uuid,
            quest_uuid: questUuid,
            level_number: upgradedLevel,
            reward_amount: Number(nextLevelInfo.reward_amount) || 0,
          },
        });
      }
    }

    return newLevelNumber;
  } catch (error) {
    console.error("[Mastery] Error in checkAndUpgradeLevel:", error);
    return currentLevelNumber;
  }
};

export default {
  updateReferralNinjaMasteryProgress,
};
