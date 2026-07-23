import express from "express";
import { handlelike, getallLikedVideo } from "../controllers/like.js";
import { requireAuth } from "../middleware/auth.js";

const routes = express.Router();
routes.get("/:userId", requireAuth, getallLikedVideo);
routes.post("/:videoId", requireAuth, handlelike);
export default routes;
