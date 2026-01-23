/**********************************
 * Desc: Initialize all routes.
 * Auth: Krunal Dodiya
 * Date: 01/04/2025
 **********************************/

import { knex } from "propmodel_api_core";
import sqsProducer from '../services/sqsProducer.js';

/**
 * Fetch group value from groups table using group key
 * @param {string} groupKey - The group key to search for
 * @returns {Promise<string|null>} The group value if found, null otherwise
 * @throws {Error} If there's a database error or invalid input
 */
const getGroupValueByKey = async (groupKey) => {
  try {
    const query = knex("groups")
      .select("g_name")
      .where("g_key", groupKey)
      .first();
    const result = await query;
    return result ? result.g_name : null;
  } catch (error) {
    throw new Error(`Failed to fetch group value: ${error.message}`);
  }
};

/**
 * Check if a discount code is valid and available for use
 * @param {string} discountCode - The discount code to validate
 * @returns {Promise<Object|null>} Discount code details if valid, null otherwise
 * @throws {Error} If there's a database error or invalid input
 */
const checkDiscountCode = async (discountCode) => {
  try {
    const query = knex("discount_codes")
      .select(
        "uuid",
        "code",
        "discount",
        "current_usages_count",
        "max_usages_count"
      )
      .where("code", discountCode)
      .where("status", 1)
      .whereRaw("current_usages_count < max_usages_count")
      .whereRaw("end_date > NOW()")
      .first();
    const result = await query;
    return result ? result : null;
  } catch (error) {
    throw new Error(`Failed to fetch discount code: ${error.message}`);
  }
};

/**
 * Calculate final price after applying discount
 * @param {number} discountCode - Discount percentage to apply
 * @param {number} originalPrice - Original price before discount
 * @returns {number} Final price after applying discount, rounded to 2 decimal places
 */
const calculateDiscount = (discountCode, originalPrice) => {
  const discountAmount = originalPrice * (discountCode / 100);
  const finalPrice = Math.max(0, originalPrice - discountAmount); // Ensure price doesn't go below 0
  return Number(finalPrice.toFixed(2));
};

/**
 * Format price to 2 decimal places
 * @param {number} price - The price to format
 * @returns {number} Formatted price with 2 decimal places
 */
const formatPrice = (price) => {
  return Number(parseFloat(price).toFixed(2));
};


const messageAttributes = {
    type: 'store_activity_log'
};


/**
 * Stores activity log data by sending it to AWS SQS queue
 * @param {Object} reqData - The activity log data to be stored
 * @throws {Error} If there's an error sending the message to SQS
 * @returns {Promise<void>} 
 */
const storeActivityLog = async (reqData) => {
    try {
      const result = await sqsProducer.sendMessage('log', reqData, messageAttributes);
      return result;
    } catch (error) {
        console.error('Error sending activity log to SQS:', error);
        throw error;
    }
}


export {
  getGroupValueByKey,
  checkDiscountCode,
  calculateDiscount,
  formatPrice,
  storeActivityLog
};
