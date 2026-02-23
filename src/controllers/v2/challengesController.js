/**********************************
 * Desc: Define controllers for challenge module v2.
 * Auth: GitHub Copilot
 * Date: 22/04/2025
 **********************************/

import controllerWrapper from "../../middleware/controllerHandler.js";
import challengeService from "../../services/v2/challengeService.js";
import { captureException } from "propmodel_sentry_core";
import { freeTrialRequest } from "../../requests/v2/awardChallengeRequest.js";
import { knex } from "propmodel_api_core";

/**
 * Free trial
 */
const createFreeTrialAccount = controllerWrapper(async (req, res) => {
  try {
    const requestBody = req.body;
    const tokenData = req.tokenData;

    await freeTrialRequest.validateAsync(requestBody);

    // Get result from service
    const result = await challengeService.createFreeTrialAccount(
      requestBody,
      tokenData
    );

    if (!result) {
      return res.error("server_error", "Failed to create free trial account", 500);
    }

    return res.success("free_trial_created", result, 200);
  } catch (error) {
    console.error("Error in createFreeTrialAccount:", error);
    captureException(error, {
      operation: "createFreeTrialAccount",
      user: { id: req.tokenData?.uuid || req.tokenData?.id },
      extra: { requestBody: req.body },
    });
    return res.error("free_trial_failed", error.message, 400);
  }
});

const getFreeTrialStats = controllerWrapper(async (req, res) => {
  try {
    const result = await challengeService.getFreeTrialStats();

    if (!result) {
      return res.error("server_error", "Failed to get free trial stats", 500);
    }

    return res.success("free_trial_stats_fetched", result, 200);
  } catch (error) {
    console.error("Error in getFreeTrialStats:", error);
    captureException(error, {
      operation: "getFreeTrialStats",
      user: { id: req.tokenData?.uuid || req.tokenData?.id },
    });
    return res.error("free_trial_stats_failed", error.message, 400);
  }
});

const updateReferralNinjaMasteryProgress = controllerWrapper(async (req, res) => {
  try {
    const { user_uuid } = req.body;

    const payload = {
      knex,
      user_uuid: user_uuid,
    };

    const result = await challengeService.updateReferralNinjaMasteryProgress(payload);

    if (!result) {
      return res.error("server_error", "Failed to process request", 500);
    }

    return res.success("mastery_progress_updated", result, 200);
  } catch (error) {
    console.error("Error in updateReferralNinjaMasteryProgress controller:", error);
    captureException(error, {
      operation: "updateReferralNinjaMasteryProgress",
      user: { id: req.tokenData?.uuid || req.tokenData?.id },
      extra: { requestBody: req.body },
    });
    return res.error("mastery_progress_failed", error.message, 400);
  }
});

export default {
  createFreeTrialAccount,
  getFreeTrialStats,
  updateReferralNinjaMasteryProgress,
};
