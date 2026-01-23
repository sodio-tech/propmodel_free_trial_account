/**********************************
 * Desc: Define validation schema for payout module.
 * Auth: GitHub Copilot
 * Date: 22/04/2025
 **********************************/

import Joi from "joi";

const awardChallengeRequest = Joi.object({
  platform_name: Joi.string().required().messages({
    "string.base": "Platform name should be a string",
    "any.required": "Platform name is required",
  }),
  initial_balance: Joi.number().precision(2).required().messages({
    "number.base": "Initial balance should be a number",
    "number.precision": "Initial balance should have at most 2 decimal places",
    "any.required": "Initial balance is required",
  }),
  account_stage: Joi.string()
    .valid("trial", "single", "double", "triple", "instant")
    .required()
    .messages({
      "string.base": "Account stage should be a string",
      "any.only":
        "Account stage must be one of: trial, single, double, triple, instant",
      "any.required": "Account stage is required",
    }),
  account_type: Joi.string()
    .valid("standard", "aggressive", "trial", "islamic", "raw")
    .required()
    .messages({
      "string.base": "Account type should be a string",
      "any.only": "Account type must be one of: standard, aggressive",
      "any.required": "Account type is required",
    }),
  award_type: Joi.string().required().messages({
    "string.base": "Award type should be a string",
    "any.required": "Award type is required",
  }),
  user_emails: Joi.array()
    .items(
      Joi.string().messages({
        "string.base": "Each User Email should be a string",
      })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "User Emails should be an array of strings",
      "array.min": "At least one User Email is required",
      "any.required": "User Email is required",
    }),
  subtags_uuids: Joi.array()
    .items(
      Joi.string().uuid().messages({
        "string.base": "Each subtag UUID should be a string",
        "string.guid": "Each subtag UUID should be a valid UUID",
      })
    )
    .optional()
    .messages({
      "array.base": "Subtags UUIDs should be an array of strings",
    }),
  discount_code: Joi.string().allow("", null).optional().messages({
    "string.base": "Discount code should be a string",
  }),
  payment_transaction_id: Joi.string().allow("", null).optional().messages({
    "string.base": "Payment transaction ID should be a string",
  }),
});

export { awardChallengeRequest };
