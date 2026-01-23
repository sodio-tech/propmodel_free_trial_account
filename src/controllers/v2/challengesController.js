/**********************************
 * Desc: Define controllers for challenge module v2.
 * Auth: GitHub Copilot
 * Date: 22/04/2025
 **********************************/

import controllerWrapper from "../../middleware/controllerHandler.js";
import challengeService from "../../services/v2/challengeService.js";
import { captureException } from "propmodel_sentry_core";
import { freeTrailRequest } from "../../requests/v2/awardChallengeRequest.js";

/**
 * Free trail
 */
const freeTrail = controllerWrapper(async (req, res) => {
  try {
    const requestBody = req.body;
    const tokenData = req.tokenData;

    await freeTrailRequest.validateAsync(requestBody);

    // Get result from service
    const result = await challengeService.freeTrail(
      requestBody,
      tokenData
    );

    if (!result) {
      return res.error("server_error", "Failed to create free trail account", 500);
    }

    return res.success("free_trail_created", result, 200);
  } catch (error) {
    console.error("Error in freeTrail:", error);
    captureException(error, {
      operation: "controller_freeTrail_v2",
      user: { id: req.tokenData?.uuid || req.tokenData?.id },
      extra: { requestBody: req.body },
    });
    return res.error("free_trail_failed", error.message, 400);
  }
});

export default {
  freeTrail,
};
