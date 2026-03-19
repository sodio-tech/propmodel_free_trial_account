import dotenv from "dotenv";
import axios from "axios";
import { captureException } from "propmodel_sentry_core";
import { handleApiError } from "./apiUtils.js";

dotenv.config();

const HUB_BASE_URL = process.env.HUB_BASE_URL;
const HUB_API_KEY = process.env.HUB_API_KEY;

/**
 * Axios client for Hub service (HubSpot sync)
 * Mirrors the pattern used in `apiUtils.js`.
 */
const hubApiClient = axios.create({
  baseURL: HUB_BASE_URL,
  headers: {
    'authorization': HUB_API_KEY,
    "Content-Type": "application/json",
  }
  // ,timeout: 8000,
});

/**
 * Generic helper for POST requests to the Hub service.
 * Returns the full Axios response on success so existing callers
 * can access `response.data` and `response.data.data` as before.
 * On failure, returns a normalized error object via `handleApiError`.
 *
 * @param {string} path - Endpoint path (e.g. `/api/v1/purchase/create`)
 * @param {Object} payload - Request body
 * @param {Object} [config={}] - Optional Axios config overrides
 * @returns {Promise<import("axios").AxiosResponse|{success:false,error:string,statusCode:number}>}
 */
const postToHub = async (path, payload, config = {}) => {
  try {
    const response = await hubApiClient.post(path, payload, config);
    return response;
  } catch (error) {
    captureException(error, {
      extra: {
        operation: "hub_service_request",
        path,
      },
    });
    return handleApiError(error);
  }
};

/**
 * Creates a HubSpot purchase record via Hub service.
 *
 * @param {Object} contactData - Purchase/contact payload
 * @returns {Promise<import("axios").AxiosResponse|{success:false,error:string,statusCode:number}>}
 */
const createHubSpotPurchaseData = async (contactData) => {
  return postToHub("/api/v1/purchase/create", contactData);
};

/**
 * Creates a HubSpot platform account record via Hub service.
 *
 * @param {Object} contactData - Platform account payload
 * @returns {Promise<import("axios").AxiosResponse|{success:false,error:string,statusCode:number}>}
 */
const createHubSpotPlatformAccountData = async (contactData) => {
  // Slightly higher timeout for potentially heavier payloads/processing.
  return postToHub("/api/v1/platform-account/create", contactData, {
    timeout: 16000,
  });
};

export { createHubSpotPurchaseData, createHubSpotPlatformAccountData };
