import express from "express";
import {
  getallhistoryVideo,
  handlehistory,
  handleview,
} from "../controllers/history.js";
import { requireAuth } from "../middleware/auth.js";

const routes = express.Router();
routes.get("/:userId", requireAuth, getallhistoryVideo);
routes.post("/views/:videoId", handleview);
routes.post("/:videoId", requireAuth, handlehistory);
export default routes;
