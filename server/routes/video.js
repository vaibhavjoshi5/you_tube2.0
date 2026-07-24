import express from "express";
import {
  getallvideo,
  streamVideo,
  uploadvideo,
} from "../controllers/video.js";
import upload from "../filehelper/filehelper.js";
import { requireAuth } from "../middleware/auth.js";

const routes = express.Router();

routes.post("/upload", requireAuth, upload.single("file"), uploadvideo);
routes.get("/getall", getallvideo);
routes.get("/stream/:fileId", streamVideo);
export default routes;
