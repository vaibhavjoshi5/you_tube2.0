import express from "express";
import {
  createOrder,
  getPlans,
  verifyPayment,
} from "../controllers/payment.js";
import { requireAuth } from "../middleware/auth.js";

const routes = express.Router();

routes.get("/plans", getPlans);
routes.post("/order", requireAuth, createOrder);
routes.post("/verify", requireAuth, verifyPayment);

export default routes;
