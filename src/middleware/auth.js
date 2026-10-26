const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");
const AppError = require("../utils/AppError");

exports.authenticate = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new AppError(401, "Missing or malformed Authorization header"));
  }
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
};

exports.requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : next(new AppError(403, `Only ${roles.join("/")} can perform this action`));
