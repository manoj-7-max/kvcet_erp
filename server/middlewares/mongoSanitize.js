const hasInjectionVector = (key) => {
  return key.startsWith('$') || key.includes('.');
};

const sanitizeMongoObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (hasInjectionVector(key)) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitizeMongoObject(obj[key]);
      }
    }
  }
  return obj;
};

export const mongoSanitizeClean = (req, res, next) => {
  if (req.body) {
    sanitizeMongoObject(req.body);
  }
  if (req.query) {
    // Mutate the query object properties in-place, compatible with Express 5 getters
    sanitizeMongoObject(req.query);
  }
  if (req.params) {
    sanitizeMongoObject(req.params);
  }
  next();
};

export default mongoSanitizeClean;
