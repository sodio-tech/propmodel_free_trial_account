import axios from 'axios';
import { captureException } from "propmodel_sentry_core";

/**
 * Recharges user wallet by calling the wallet API endpoint.
 * @param {Object} params - The request body parameters.
 * @param {string} params.user_uuid - User UUID.
 * @param {number} params.amount - Amount to add to wallet.
 * @param {boolean} params.is_admin - Whether this is an admin operation.
 * @param {string} params.reason - Reason for the recharge.
 * @returns {Promise<Object>} - The response from the wallet API.
 */
async function walletRechargeService(params = {}) {
  try {
    const baseUrl = process.env.WALLET_API_BASE_URL;
    const apiKey = process.env.WALLET_API_KEY;

    if (!baseUrl) {
      throw new Error("WALLET_API_URL is not configured");
    }

    const walletApiUrl = new URL(
      "/api/v1/wallet/balance/add",
      baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
    ).href;

    const response = await axios.post(walletApiUrl, params, {
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
      },
    });

    return response;
  } catch (error) {
    captureException(error);
    throw error;
  }
}

export default walletRechargeService;
