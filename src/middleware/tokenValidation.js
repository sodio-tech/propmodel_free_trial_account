import { verifyToken, knex} from "propmodel_api_core";

/**
 * Middleware for JWT token validation
 * Verifies the authorization token from request headers
 * Uses propmodel_api_core's verifyToken function for validation
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} Response with error if token is invalid or missing
 */

const tokenValidation = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const apiKey = req.headers["apikey"];

  if (!authHeader && !apiKey) {
    return res
      .status(403)
      .json({ success: false, message: "No token provided" });
  }

  const token = authHeader ? authHeader.split(" ")[1] : "";
  if (!token && !apiKey) {
    return res
      .status(403)
      .json({ success: false, message: "No token provided" });
  }
  const params = {
    token: token,
  };
  if (apiKey) {
    params.apiKey = apiKey;
  }
  const response = await verifyToken(params);
  if (response.success === false) {
    return res.error("invalid_token", [], 401);
  }

  const tokenUser = await knex("users")
    .select("*")
    .where("email", response.decoded.email)
    .where("status", 1)
    .whereNull("deleted_at")
    .first();

  if (!tokenUser) {
    return res.error("invalid_token", [], 401);
  }

  // pass the decoded token to the next middleware
  req.tokenData = response.decoded;
  next();
};

export default tokenValidation;
