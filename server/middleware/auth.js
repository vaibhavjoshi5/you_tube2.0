import jwt from "jsonwebtoken";
import users from "../Modals/Auth.js";

export const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await users.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
};
