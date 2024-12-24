
const jwt = require("jsonwebtoken");




const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header missing" });
    }
  
    const token = authHeader.split(" ")[1];
  
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET || "your-jwt-secret");
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };

  module.exports = authenticateJWT

