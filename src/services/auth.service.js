const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/mysql");
const { jwtSecret, jwtExpiresIn } = require("../config/env");
const AppError = require("../utils/AppError");

// Dummy hash so bcrypt.compare always runs (avoids timing leak on unknown emails)
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 10);

exports.login = async (email, password) => {
  if (!email || !password) throw new AppError(400, "email and password are required");

  const [rows] = await db.query(
    "SELECT id, password_hash, role FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  const user = rows[0];

  const match = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !match) throw new AppError(401, "Invalid credentials");

  // iat is added automatically by jsonwebtoken
  const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });
  
  return { token };
};
