import express from "express";
import {
  downloadVideo,
  getDownloads,
} from "../controllers/download.js";
import { requireAuth } from "../middleware/auth.js";

const routes = express.Router();

routes.get("/", requireAuth, getDownloads);
routes.get("/:videoId", requireAuth, downloadVideo);

export default routes;
