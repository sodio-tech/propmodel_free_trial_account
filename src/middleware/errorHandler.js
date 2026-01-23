/**
 * Centralized error handling middleware
 * Catches all errors thrown in the application and sends a standardized error response
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */

const errorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: "Something went wrong",
    error: err.message,
  });
};

export default errorHandler;
