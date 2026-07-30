import express from "express";
import rateLimit from "express-rate-limit";
import {
  getProfile,
  getPublicProfile,
  startLogin,
  updateprofile,
  verifyLogin,
} from "../controllers/auth.js";
import {
  getSubscribedVideos,
  getSubscriptionStatus,
  toggleSubscription,
} from "../controllers/subscription.js";
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
routes.get("/subscriptions/videos", requireAuth, getSubscribedVideos);
routes.get("/subscription/:channelId", requireAuth, getSubscriptionStatus);
routes.post("/subscription/:channelId", requireAuth, toggleSubscription);
routes.get("/profile/:id", getPublicProfile);
routes.patch("/update/:id", requireAuth, updateprofile);

export default routes;
