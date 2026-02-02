/**********************************
 * Desc: Define routes for test module v2.
 * Date: 30/01/2026
 **********************************/

import express from "express";

// import middleware
import tokenValidation from "../../middleware/tokenValidation.js";

// import controller
import testController from "../../controllers/v2/testController.js";

const router = express.Router();

router.post(
  "/test/hello-world",
  tokenValidation,
  testController.updateReferralNinjaMasteryProgress
);

export default router;
