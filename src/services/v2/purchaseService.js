import { captureException, captureMessage } from "propmodel_sentry_core";
import { createHubSpotPurchaseData,createHubSpotPlatformAccountData } from "../../helper/extranalApiCall.js";
import { json } from "express";

/**
 * Sync purchase/account data to HubSpot (via hub service).
 *
 * This function is intentionally fire-and-forget style:
 * - It never throws (errors are captured to Sentry).
 * - MT5/account DB transaction should NOT depend on this call succeeding.
 *
 * @param {Object} params
 * @param {Object} params.purchaseData - Row from purchases table
 * @param {Object} params.platformRes - Row from platform_accounts table
 * @param {Object} params.platformGroup - Row from platform_groups table
 * @param {Object} params.mt5AccountDetails - MT5 account details (login, passwords, etc.)
 * @param {Object} params.payload - Original SQS payload used to create the account
 * @returns {Promise<void>}
 */
const purchaseHubspotSync = async ({
  purchaseData
}) => {
  try {
    if (!purchaseData?.uuid || !purchaseData?.user_uuid) {
      return;
    }

    const contactData = {
      email:purchaseData?.email,
      nostro_uuid: purchaseData.uuid,
      user_uuid: purchaseData.user_uuid,
      amount: purchaseData.amount_total,
      nostro_currency: purchaseData.currency ?? null,
      payment_method: purchaseData.payment_method ?? null,
      payment_status: 1,
      user_data: typeof purchaseData.user_data === 'string' ? purchaseData.user_data : JSON.stringify(purchaseData.user_data ?? null),
      original_amount: purchaseData.original_amount ?? null,
      discount_uuid: purchaseData.discount_uuid ?? null,
      payment_transaction_id: purchaseData.payment_transaction_id ?? null,
      payment_response: purchaseData.payment_response ?? null,
      webhook_response: purchaseData.webhook_response ?? null,
      purchase_type: purchaseData.purchase_type ?? null,
      competition_uuid: purchaseData.competition_uuid ?? null,
      wallet_amount: purchaseData.wallet_amount ?? 0,
      wallet_usage: purchaseData.wallet_usage ?? null,
      hubspot_id: purchaseData.hubspot_id ?? null
    };

    // console.log("contactData",contactData);
    const response = await createHubSpotPurchaseData(contactData);
    // console.log("response",response);
    return response;
  } catch (error) {
    
    captureException(error, {
      extra: {
        operation: "hubspot_purchase_sync",
        purchase_uuid: purchaseData?.uuid,
        user_uuid: purchaseData?.user_uuid,
      },
    });
  }
};


const platformAccountHubspotSync = async ({
  platformRes = {},
  purchaseData = {},
  platformGroup = {}
}) => {
  try {
    // Essential required fields
    if (
      !platformRes?.uuid ||
      !platformRes?.user_uuid ||
      !platformRes?.purchase_uuid ||
      !platformRes?.platform_login_id ||
      !platformRes?.platform_name
    ) {
      return;
    }

    const contactData = {
      nostro_uuid: platformRes?.uuid ?? null,
      user_uuid: platformRes?.user_uuid ?? null,
      purchase_uuid: platformRes?.purchase_uuid ?? null,
      platform_login_id: platformRes?.platform_login_id,
      platform_name: platformRes?.platform_name,
      remote_group_name: platformRes?.remote_group_name ?? null,
      platform_group_uuid: platformRes.platform_group_uuid ?? null,
      current_phase: platformRes.current_phase ?? null,
      initial_balance: platformRes.initial_balance ??  null,
      profit_target: platformRes.profit_target ?? null,
      profit_split: platformRes.profit_split ?? null,
      max_drawdown: platformRes.max_drawdown ?? null,
      max_daily_drawdown: platformRes.max_daily_drawdown ?? null,
      account_stage: platformRes.account_stage ?? null,
      account_type: platformRes.account_type ?? null,
      account_leverage: platformRes.account_leverage ?? null,
      status: platformRes.status ?? null,
      funded_at: platformRes.funded_at ?? null,
      is_kyc: platformRes.is_kyc ?? null,
      is_trades_check: platformRes.is_trades_check ?? null,
      is_trade_agreement: platformRes.is_trade_agreement ?? null,
      reason: platformRes.reason ?? null,
      funded_status: platformRes.funded_status ?? null,
      award_type: platformRes.award_type ?? null,
      evalution_reference_uuid: platformRes.evalution_reference_uuid ?? null,
      action_type: platformRes.action_type ?? null,
      main_password: platformRes.main_password ?? null,
      investor_password: platformRes.investor_password ?? null,
      platform_group_hubspot_id: platformGroup.group_hubspot_id ?? null, //Platform groups hub spot id 
      purchase_hubspot_id: purchaseData.purchase_hubspot_id ?? null, // purchase hubspot id 
      contact_hubspot_id: purchaseData.hubspot_id ?? null //User hubspot id 
    };

    await createHubSpotPlatformAccountData(contactData);

    // captureMessage("HubSpot platform account sync triggered", {
    //   level: "info",
    //   extra: {
    //     operation: "hubspot_platform_account_sync",
    //     platform_account_uuid: platformRes.uuid,
    //     user_uuid: platformRes.user_uuid,
    //     status: response?.status,
    //     response: JSON.stringify(response),
    //     contactData: JSON.stringify(contactData),
    //   },
    // });
  } catch (error) {
    captureException(error, {
      extra: {
        operation: "hubspot_platform_account_sync",
        platform_account_uuid: (platformRes && platformRes.uuid) || null,
        user_uuid: (platformRes && platformRes.user_uuid) || null,
      },
    });
  }
};

export { purchaseHubspotSync,platformAccountHubspotSync };
