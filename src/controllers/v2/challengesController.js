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
import { encryptLogin } from "../../helper/webhookHelper.js";

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

const generateWebhookSignature = controllerWrapper(async (req, res) => {
  try {
    const { login_id, webhook_encryption_key } = req.body;

    if (!login_id) {
      return res.error("validation_error", "login_id is required", 400);
    }

    if (!webhook_encryption_key) {
      return res.error("validation_error", "webhook_encryption_key is required", 400);
    }

    const signature = encryptLogin(login_id, webhook_encryption_key);

    if (!signature) {
      return res.error("encryption_error", "Failed to generate signature", 500);
    }

    return res.success("signature_generated", { signature }, 200);
  } catch (error) {
    console.error("Error in generateWebhookSignature:", error);
    captureException(error, {
      operation: "generateWebhookSignature",
      user: { id: req.tokenData?.uuid || req.tokenData?.id },
      extra: { requestBody: req.body },
    });
    return res.error("signature_generation_failed", error.message, 400);
  }
});

export default {
  createFreeTrialAccount,
  getFreeTrialStats,
  generateWebhookSignature,
};
