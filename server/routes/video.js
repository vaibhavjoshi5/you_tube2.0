import express from "express";
import { getallvideo, uploadvideo } from "../controllers/video.js";
import upload from "../filehelper/filehelper.js";
import { requireAuth } from "../middleware/auth.js";

const routes = express.Router();

routes.post("/upload", requireAuth, upload.single("file"), uploadvideo);
routes.get("/getall", getallvideo);
export default routes;
