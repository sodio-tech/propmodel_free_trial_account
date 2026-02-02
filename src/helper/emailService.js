import axios from "axios";

/**
 * Sends an email by calling the specified API endpoint.
 * @param {string} url - The API endpoint URL.
 * @param {Object} params - The request body parameters (for POST/PUT/PATCH).
 * @param {string} [method='POST'] - HTTP method (GET, POST, PUT, DELETE, etc.).
 * @param {Object} [headers={}] - Additional headers.
 * @returns {Promise<Object>} - The formatted response data.
 */
async function sendEmail(url, params = {}, method = "POST", headers = {}) {
  try {
    const config = {
      method,
      url,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      // Only include data for methods that support a body
      ...(method !== "GET" && method !== "HEAD" ? { data: params } : {}),
    };
    const response = await axios(config);
    return response;
  } catch (error) {
    throw error;
  }
}

export default sendEmail;
