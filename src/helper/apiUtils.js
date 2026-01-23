import axios from "axios";
import fs from "fs";
import path from "path";

/**
 * Base URL for the API endpoints
 * @constant {string}
 */
const BASE_URL = process.env.MT5_API_BASE_URL;

/**
 * Authentication token for API requests
 * @constant {string}
 */
const AUTH_TOKEN = process.env.MT5_AUTH_TOKEN;

/**
 * Axios instance for making HTTP requests
 * Configured with base URL and default headers
 * @constant {AxiosInstance}
 */

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${AUTH_TOKEN}`,
    "Content-Type": "application/json",
  },
});
/**
 * Handles successful API responses
 * @param {Object} response - The API response object
 * @returns {Object} Formatted response with success status and data/error
 */

const handleApiResponse = (response) => {
  const { status_code, content, message } = response.data;
  return status_code === 200
    ? { success: true, data: content }
    : {
        success: false,
        error: content || message,
        statusCode: status_code || 500,
      };
};

/**
 * Handles API errors
 * @param {Error} error - The error object from failed API request
 * @returns {Object} Formatted error response with failure status and error details
 */
const handleApiError = (error) => ({
  success: false,
  error: error.message,
  statusCode: error?.response?.status || 500,
});

/**
 * Autoloads routes from the specified directory
 * @param {Object} app - The Express app instance
 * @param {string} routesPath - Path to the routes directory
 * @param {string} baseUrl - Base URL for the API routes
 */
export async function autoloadRoutes(app, routesPath, baseUrl) {
  fs.readdirSync(routesPath).forEach(async (file) => {
    if (file.endsWith("Routes.js")) {
      const route = await import(path.join(routesPath, file));
      const routeName = file.replace("Routes.js", "").toLowerCase();
      app.use(`${baseUrl}/${routeName}`, route.default || route);
    }
  });
}

export { apiClient, handleApiResponse, handleApiError };
