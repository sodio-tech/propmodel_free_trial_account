/**********************************
 * Desc: Define validation schema for test module.
 * Auth: Krunal Dodiya
 * Date: 09/04/2025
 **********************************/

/**
 * Generic request validation handler
 * @param {Object} schema - Joi schema to validate against
 * @param {string} property - Request property to validate (body, query, params)
 */
const requestHandler = (schema, property = "body") => {
  return async (req, res, next) => {
    try {
      req[property] = await schema.validateAsync(req[property], {
        abortEarly: false,
        stripUnknown: true,
      });

      next();
    } catch (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }
  };
};

export { requestHandler };
