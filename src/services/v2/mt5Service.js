/************************************************************
 * MT5 Service Module v2
 * This module handles MT5 trading platform related operations for v2 APIs
 ************************************************************/
import {
  apiClient,
  handleApiResponse,
  handleApiError,
} from "../../helper/apiUtils.js";
import { captureException } from "propmodel_sentry_core";

/**
 * Create MT5 account
 * @param {Object} reqParams - The request parameters object
 * @returns {Promise<Object>} The account creation response from the API
 * @throws {Error} If the API request fails
 */
const createMt5Account = async (reqParams = {}) => {
  try {
    console.log({ reqParams });

    const response = await apiClient.post("/account/create", reqParams);

    console.log({ mt5_response: response });

    return handleApiResponse(response);
  } catch (error) {
    console.log({ error });
    captureException(error, {
      operation: "service_createMt5Account_v2",
      extra: { reqParams },
    });
    return handleApiError(error);
  }
};

/**
 * Reset account in MT5 system
 * @param {Object} reqParams - The request parameters object
 * @returns {Promise<Object>} The account reset response from the API
 * @throws {Error} If the API request fails
 */
const resetAccount = async (reqParams = {}) => {
  try {
    const response = await apiClient.post("/mt5_operations/reset_account", reqParams);
    return handleApiResponse(response);
  } catch (error) {
    console.error("Error in resetAccount:", error);
    captureException(error, {
      operation: "service_resetAccount",
      extra: { reqParams },
    });
    return handleApiError(error);
  }
};

/**
 * Add balance to MT5 account (v2)
 * @param {Object} reqParams - The request parameters object containing platform_login_id, balance, and reason
 * @returns {Promise<Object>} The add balance response from the API
 * @throws {Error} If the API request fails
 */
const addBalance = async (reqParams = {}) => {
  try {
    const { platform_login_id, balance, reason } = reqParams;

    const response = await apiClient.post("/account/add_balance", {
      platform_login_id,
      balance,
      reason,
    });
    return handleApiResponse(response);
  } catch (error) {
    console.error("Error in addBalance:", error);
    captureException(error, {
      operation: "service_addBalance_v2",
      extra: { reqParams },
    });
    return handleApiError(error);
  }
};

/**
 * Approve payout in MT5 system (v2)
 * @param {Object} reqParams - The request parameters object containing login and initial_balance
 * @returns {Promise<Object>} The payout approval response from the API
 * @throws {Error} If the API request fails
 */
const resetPhase = async (reqParams = {}) => {
  try {
    const response = await apiClient.post("/mt5_operations/move_next_phase", reqParams);
    return handleApiResponse(response);
  } catch (error) {
    console.log(error);
    captureException(error, {
      operation: "resetPhase_v2",
      extra: { reqParams },
    });
    return handleApiError(error);
  }
};

/**
 * Change MT5 user group (v2)
 * @param {Object} reqParams - The request parameters object containing login and group
 * @returns {Promise<Object>} The change group response from the API
 * @throws {Error} If the API request fails
 */
const changeUserGroup = async (reqParams = {}) => {
  try {
    const response = await apiClient.post(
      "/account/change_user_group",
      reqParams
    );
    return handleApiResponse(response);
  } catch (error) {
    console.error("Error in changeUserGroup:", error);
    captureException(error, {
      operation: "service_changeUserGroup_v2",
      extra: { reqParams },
    });
    return handleApiError(error);
  }
};

export default {
  createMt5Account,
  resetAccount,
  addBalance,
  resetPhase,
  changeUserGroup,
};

