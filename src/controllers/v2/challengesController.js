/**********************************
 * Desc: Define controllers for challenge module v2.
 * Auth: GitHub Copilot
 * Date: 22/04/2025
 **********************************/

import controllerWrapper from "../../middleware/controllerHandler.js";
import challengeService from "../../services/v2/challengeService.js";
import { captureException } from "propmodel_sentry_core";
import { awardChallengeRequest } from "../../requests/v2/awardChallengeRequest.js";

/**
 * Award challenge
 */
const awardChallenge = controllerWrapper(async (req, res) => {
  try {
    const requestBody = req.body;
    const tokenData = req.tokenData;

    await awardChallengeRequest.validateAsync(requestBody);

    // Get payout amounts from service
    const result = await challengeService.awardChallenge(
      requestBody,
      tokenData
    );

    if (!result) {
      return res.error("server_error", "Failed to award challenge", 500);
    }

    return res.success("challenge_awarded", result, 200);
  } catch (error) {
    console.error("Error in awardChallenge:", error);
    captureException(error, {
      operation: "controller_awardChallenge_v2",
      user: { id: req.tokenData?.uuid || req.tokenData?.id },
      extra: { requestBody: req.body },
    });
    return res.error("challenge_award_failed", error.message, 400);
  }
});

export default {
  awardChallenge,
};

