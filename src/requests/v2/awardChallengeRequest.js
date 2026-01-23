/**********************************
 * Desc: Define validation schema for free trail module.
 * Auth: GitHub Copilot
 * Date: 22/04/2025
 **********************************/

import Joi from "joi";

const freeTrailRequest = Joi.object({
  free_trail_code: Joi.string().required().messages({
    "string.base": "Free trail code should be a string",
    "any.required": "Free trail code is required",
  }),
});

export { freeTrailRequest };
