const jwt = require("jsonwebtoken");
const config = require("../config");

class JWTService {
  generateAccessToken(payload) {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });
  }

  generateRefreshToken(payload) {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.JWT_SECRET);
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  generateTokenPair(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
    };
  }
}

module.exports = new JWTService();
