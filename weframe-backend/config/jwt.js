const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = '1h';

module.exports = { jwtSecret, jwtExpiresIn };