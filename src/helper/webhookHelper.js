import crypto from "crypto";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const IV_LENGTH = 12;

const encryptLogin = (login, encryptionKeyBase64) => {
  try {
    const key = Buffer.from(encryptionKeyBase64, "base64");
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
      cipher.update(String(login), "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString("base64");
  } catch (error) {
    console.error("Encryption error:", error);
    return null;
  }
};

const sendWebhookEvent = async (eventName, login, isFunded, reason) => {
  try {
    const webhookUrl = process.env.WEBHOOK_URL;
    const encryptionKey = process.env.WEBHOOK_ENCRYPTION_KEY;

    if (!webhookUrl) {
      console.error("WEBHOOK_URL is not set");
      return false;
    }
    if (!encryptionKey) {
      console.error("WEBHOOK_ENCRYPTION_KEY is not set");
      return false;
    }

    const encryptedValue = encryptLogin(login, encryptionKey);
    if (!encryptedValue) {
      console.error("Failed to encrypt login");
      return false;
    }

    const payload = {
      event: eventName,
      login: String(login),
      isFunded: isFunded,
      reason: reason,
    };

    const headers = {
      "Content-Type": "application/json",
      "X-Signature": encryptedValue,
    };

    const response = await axios.post(webhookUrl, payload, {
      headers,
      timeout: 20000,
    });

    console.log(
      `Webhook sent successfully - Event: ${eventName}, Login: ${login}, Status: ${response.status}`
    );
    return true;
  } catch (error) {
    console.error("Error sending webhook:", error.response?.data || error.message);
    return false;
  }
};

export { sendWebhookEvent };
