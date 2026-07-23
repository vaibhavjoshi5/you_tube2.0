import express from "express";
import {
  deletecomment,
  editcomment,
  getallcomment,
  postcomment,
  reactToComment,
  translateComment,
} from "../controllers/comment.js";
import { requireAuth } from "../middleware/auth.js";

const routes = express.Router();
routes.get("/:videoid", getallcomment);
routes.post("/postcomment", requireAuth, postcomment);
routes.delete("/deletecomment/:id", requireAuth, deletecomment);
routes.patch("/editcomment/:id", requireAuth, editcomment);
routes.post("/:id/reaction", requireAuth, reactToComment);
routes.post("/:id/translate", translateComment);
export default routes;
