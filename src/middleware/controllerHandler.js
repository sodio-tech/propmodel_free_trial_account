/**
 * Controller wrapper for error handling
 * @param {Function} handler - Controller function to wrap
 */
const controllerWrapper = (handler) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (err) {
        return res.error("internal_error", err.message);
    }
  };
export default controllerWrapper;