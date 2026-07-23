import express from "express";
import rateLimit from "express-rate-limit";
import {
  getProfile,
  startLogin,
  updateprofile,
  verifyLogin,
} from "../controllers/auth.js";
import { requireAuth } from "../middleware/auth.js";

const routes = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

routes.post("/auth/start", authLimiter, startLogin);
routes.post("/auth/verify", authLimiter, verifyLogin);
routes.get("/me", requireAuth, getProfile);
routes.patch("/update/:id", requireAuth, updateprofile);
export default routes;
