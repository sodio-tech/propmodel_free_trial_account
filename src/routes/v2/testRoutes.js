/**********************************
 * Desc: Define routes for mastery module v2.
 * Date: 02/02/2026
 **********************************/

import express from "express";

// import middleware
import tokenValidation from "../../middleware/tokenValidation.js";

// import controller
import testController from "../../controllers/v2/testController.js";

const router = express.Router();

router.post(
  "/mastery/referral-ninja/update-progress",
  tokenValidation,
  testController.updateReferralNinjaMasteryProgress
);

export default router;
