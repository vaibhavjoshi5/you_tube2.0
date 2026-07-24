import express from "express";
import {
  getallvideo,
  registervideo,
  streamVideo,
  uploadvideo,
} from "../controllers/video.js";
import upload from "../filehelper/filehelper.js";
import { requireAuth } from "../middleware/auth.js";
import { handleUpload } from "@vercel/blob/client";

const routes = express.Router();

routes.post("/upload", requireAuth, upload.single("file"), uploadvideo);
routes.post("/blob-upload", async (req, res, next) => {
  const isTokenRequest = req.body?.type === "blob.generate-client-token";

  const createToken = async () => {
    try {
      const response = await handleUpload({
        body: req.body,
        request: req,
        onBeforeGenerateToken: async (pathname) => {
          if (!pathname.toLowerCase().endsWith(".mp4")) {
            throw new Error("Only MP4 video files are accepted");
          }

          return {
            allowedContentTypes: ["video/mp4"],
            maximumSizeInBytes: 500 * 1024 * 1024,
            addRandomSuffix: true,
          };
        },
      });

      return res.status(200).json(response);
    } catch (error) {
      console.error("Blob upload error:", error);
      return res.status(400).json({
        message: error?.message || "Unable to prepare video upload",
      });
    }
  };

  if (!isTokenRequest) return createToken();
  return requireAuth(req, res, createToken);
});
routes.post("/register", requireAuth, registervideo);
routes.get("/getall", getallvideo);
routes.get("/stream/:fileId", streamVideo);
export default routes;
