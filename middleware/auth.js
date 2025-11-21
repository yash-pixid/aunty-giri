// Authentication middleware (disabled)
export const authenticate = async (req, res, next) => {
  // Skip authentication for all requests
  next();
};

// Authorization middleware (disabled)
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Skip authorization for all requests
    next();
  };
};
