const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token
 * @param {string} userId - User _id
 * @param {string} role - 'patient' | 'doctor' | 'admin'
 * @param {string} expiresIn - e.g. '7d', '1d'
 */
const generateToken = (userId, role, expiresIn = '7d') => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

module.exports = generateToken;
