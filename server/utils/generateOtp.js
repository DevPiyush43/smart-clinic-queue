/**
 * Generate a random 4-digit OTP string
 * @returns {string} e.g. '4821'
 */
const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

module.exports = generateOtp;
