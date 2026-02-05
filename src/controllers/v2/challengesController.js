/**********************************
 * Desc: Define controllers for challenge module v2.
 * Auth: GitHub Copilot
 * Date: 22/04/2025
 **********************************/

import controllerWrapper from "../../middleware/controllerHandler.js";
import challengeService from "../../services/v2/challengeService.js";
import { captureException } from "propmodel_sentry_core";
import { freeTrialRequest } from "../../requests/v2/awardChallengeRequest.js";

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

export default {
  createFreeTrialAccount,
};
