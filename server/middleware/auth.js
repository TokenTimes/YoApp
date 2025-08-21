const jwtService = require("../services/jwtService");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "no_token" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwtService.verifyToken(token);

      // Check if user still exists
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: "user_not_found" });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: "invalid_token" });
    }
  } catch (error) {
    return res.status(500).json({ error: "server_error" });
  }
};

module.exports = authMiddleware;
