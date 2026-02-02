/**********************************
 * Desc: Define controllers for test module v2.
 * Date: 30/01/2026
 **********************************/

import controllerWrapper from "../../middleware/controllerHandler.js";
import testService from "../../services/v2/testService.js";
import { captureException } from "propmodel_sentry_core";
import { knex } from "propmodel_api_core";

/**
 * Update Referral Ninja mastery progress endpoint
 */
const updateReferralNinjaMasteryProgress = controllerWrapper(async (req, res) => {
  try {
    const { user_uuid } = req.body;

    // Prepare payload with trx and user_uuid
    const payload = {
      knex, // Knex instance for database operations
      user_uuid: user_uuid,
    };

    // Get result from service
    const result = await testService.updateReferralNinjaMasteryProgress(payload);

    if (!result) {
      return res.error("server_error", "Failed to process request", 500);
    }

    return res.success("hello_world_success", result, 200);
  } catch (error) {
    console.error("Error in updateReferralNinjaMasteryProgress controller:", error);
    captureException(error, {
      operation: "updateReferralNinjaMasteryProgress",
      user: { id: req.tokenData?.uuid || req.tokenData?.id },
      extra: { requestBody: req.body },
    });
    return res.error("hello_world_failed", error.message, 400);
  }
});

export default {
  updateReferralNinjaMasteryProgress,
};
