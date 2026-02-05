/**********************************
 * Desc: Define routes for challenge module v2.
 * Auth: GitHub Copilot
 * Date: 22/04/2025
 **********************************/

import express from "express";

// import middleware
import tokenValidation from "../../middleware/tokenValidation.js";

// import controller
import challengeController from "../../controllers/v2/challengesController.js";

const router = express.Router();

router.post(
  "/challenges/free-trial",
  tokenValidation,
  challengeController.createFreeTrialAccount
);

export default router;

