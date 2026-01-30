/**********************************
 * Desc: Test service for API testing
 * Date: 30/01/2026
 **********************************/

import { captureException } from "propmodel_sentry_core";

/**
 * Test service - Returns hello world
 * @param {Object} payload - Payload containing trx and user_uuid
 * @param {Object} payload.trx - Knex transaction instance
 * @param {string} payload.user_uuid - User ID
 * @returns {Object} - Hello world response
 */
const helloWorld = async ({ knex, user_uuid }) => {
  try {
    console.log(`Test service called with user_uuid: ${user_uuid}`);

    // Find user by user_uuid or fail
    const user = await knex("users")
      .where("uuid", user_uuid)
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user was referred by another user
    let referredBy = null;
    if (user.ref_by_user_id) {
      const referrer = await knex("users")
        .where("uuid", user.ref_by_user_id)
        .first();

      if (referrer) {
        referredBy = {
          uuid: referrer.uuid,
          email: referrer.email,
          first_name: referrer.first_name,
          last_name: referrer.last_name,
        };
      }
    }

    return {
      message: "hello world",
      user_uuid: user_uuid,
      user_email: user.email,
      referred_by: referredBy,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in helloWorld service:", error);
    captureException(error, {
      operation: "service_helloWorld_v2",
      user: { id: user_uuid },
      extra: { user_uuid },
    });
    throw error;
  }
};

export default {
  helloWorld,
};
