/**********************************
 * Desc: Define routes for challenge module v2.
 * Auth: GitHub Copilot
 * Date: 22/04/2025
 **********************************/

import express from "express";
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// import middleware
import tokenValidation from "../../middleware/tokenValidation.js";

// import controller
import challengeController from "../../controllers/v2/challengesController.js";

const router = express.Router();

// Rate limiter to prevent brute force / abuse on free trial creation
// Limits each user to 1 request per 15 seconds
const freeTrialLimiter = rateLimit({
  windowMs: 15 * 1000, // 15 seconds
  max: 1, // Limit each user (by uuid) to 1 request per windowMs
  keyGenerator: function (req) {
    // Always use user_uuid from tokenData for uniqueness if available
    if (req.tokenData && req.tokenData.uuid) {
      return req.tokenData.uuid;
    }
    // Fallback to IP if uuid is not available
    return ipKeyGenerator(req);
  },
  message: {
    success: false,
    message: "Too many free trial requests. Please try again later."
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

router.post(
  "/challenges/free-trial",
  tokenValidation,
  freeTrialLimiter,
  challengeController.createFreeTrialAccount
);

router.get(
  "/admin/challenges/free-trial/stats",
  tokenValidation,
  challengeController.getFreeTrialStats
);

router.post(
  "/webhook/generate-signature",
  tokenValidation,
  challengeController.generateWebhookSignature
);

export default router;

