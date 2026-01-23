import {
  SQSClient,
  SendMessageCommand,
  SendMessageBatchCommand,
} from "@aws-sdk/client-sqs";
import dotenv from "dotenv";
import { captureException } from "propmodel_sentry_core";

dotenv.config();
/**
 * @fileoverview SQS Producer Service for AWS SQS message queue
 * This service handles sending messages to different AWS SQS queues
 * Supports single message and batch message operations
 *
 * @requires @aws-sdk/client-sqs
 * @requires dotenv
 *
 */

class SQSProducer {
  constructor() {
    this.sqs = new SQSClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: process.env.AWS_REGION,
    });
  }
  /**
   * Sends a single message to a specified SQS queue
   * @param {string} queueType - Type of queue ('email', 'sms', 'mt5')
   * @param {object} message - Message object to be sent
   * @param {object} attributes - Optional message attributes
   * @returns {Promise<object>} Object containing success status and messageId or error
   */

  async sendMessage(queueType, message, attributes = {}) {
    try {
      let queueUrl = "";
      switch (queueType) {
        case "email":
          queueUrl = process.env.AWS_SQS_QUEUE_EMAIL_URL;
          break;
        case "sms":
          queueUrl = process.env.AWS_SQS_QUEUE_EMAIL_URL;
          break;
        case "mt5":
          queueUrl = process.env.AWS_SQS_QUEUE_MT5_URL;
          break;
        case "log":
          queueUrl = process.env.AWS_SQS_QUEUE_ACTIVITY_LOG_URL;
          break;
        default:
          throw new Error("Invalid queue type");
      }
      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: this._formatMessageAttributes(attributes),
      });

      const result = await this.sqs.send(command);
      // console.log('Message sent successfully:', result.MessageId);
      return { success: true, messageId: result.MessageId };
    } catch (error) {
      console.error("Error sending message:", error);
      captureException(error, {
        operation: "service_sqsProducer_sendMessage",
        extra: {
          queueType,
          message: JSON.stringify(message).substring(0, 200),
        },
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Sends multiple messages to a specified SQS queue in batch
   * @param {string} queueUrl - URL of the SQS queue
   * @param {Array<object>} messages - Array of message objects to be sent
   * @param {Array<object>} attributes - Optional array of message attributes
   * @returns {Promise<object>} Object containing success status and results of batch operation
   */

  async sendBatchMessages(queueType, messages, attributes = []) {
    try {
      let queueUrl = "";
      switch (queueType) {
        case "email":
          queueUrl = process.env.AWS_SQS_QUEUE_EMAIL_URL;
          break;
        case "sms":
          queueUrl = process.env.AWS_SQS_QUEUE_EMAIL_URL;
          break;
        case "mt5":
          queueUrl = process.env.AWS_SQS_QUEUE_MT5_URL;
          break;
        default:
          throw new Error("Invalid queue type");
      }
      const entries = messages.map((message, index) => ({
        Id: `msg${index}`,
        MessageBody: JSON.stringify(message),
        MessageAttributes: this._formatMessageAttributes(
          attributes[index] || {}
        ),
      }));

      const command = new SendMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: entries,
      });

      const result = await this.sqs.send(command);
      console.log("Batch messages sent successfully");

      return {
        success: true,
        successful: result.Successful,
        failed: result.Failed,
      };
    } catch (error) {
      console.error("Error sending batch messages:", error);
      captureException(error, {
        operation: "service_sqsProducer_sendBatchMessages",
        extra: { queueType, messageCount: messages.length },
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Formats message attributes to AWS SQS compatible format
   * @private
   * @param {object} attributes - Message attributes to format
   * @returns {object} Formatted message attributes
   */
  _formatMessageAttributes(attributes) {
    const formattedAttributes = {};

    for (const [key, value] of Object.entries(attributes)) {
      formattedAttributes[key] = {
        DataType: typeof value === "number" ? "Number" : "String",
        StringValue: value.toString(),
      };
    }

    return formattedAttributes;
  }
}

export default new SQSProducer();
