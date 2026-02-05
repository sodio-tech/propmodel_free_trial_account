/**********************************
 * Desc: Define validation schema for free trial module.
 * Auth: GitHub Copilot
 * Date: 22/04/2025
 **********************************/

import Joi from "joi";

const freeTrialRequest = Joi.object({
  free_trial_code: Joi.string().required().messages({
    "string.base": "Free trial code should be a string",
    "any.required": "Free trial code is required",
  }),
});

export { freeTrialRequest };
