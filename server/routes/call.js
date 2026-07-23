import express from "express";
import mongoose from "mongoose";
import CallSignal from "../Modals/callsignal.js";

const router = express.Router();
const allowedTypes = new Set(["join", "offer", "answer", "candidate", "leave"]);
const safeId = /^[a-zA-Z0-9_-]{1,80}$/;

router.post("/signal", async (req, res, next) => {
  try {
    const { roomId, peerId, type, payload = null } = req.body;
    if (
      !safeId.test(roomId || "") ||
      !safeId.test(peerId || "") ||
      !allowedTypes.has(type)
    ) {
      return res.status(400).json({ message: "Invalid call signal" });
    }

    const signal = await CallSignal.create({
      roomId,
      from: peerId,
      type,
      payload,
    });
    return res.status(201).json({ id: signal._id.toString() });
  } catch (error) {
    return next(error);
  }
});

router.get("/signals", async (req, res, next) => {
  try {
    const roomId = String(req.query.roomId || "");
    const peerId = String(req.query.peerId || "");
    const after = String(req.query.after || "");
    if (!safeId.test(roomId) || !safeId.test(peerId)) {
      return res.status(400).json({ message: "Invalid room or peer" });
    }

    const query = { roomId, from: { $ne: peerId } };
    if (after) {
      if (!mongoose.isValidObjectId(after)) {
        return res.status(400).json({ message: "Invalid signal cursor" });
      }
      query._id = { $gt: new mongoose.Types.ObjectId(after) };
    }

    const signals = await CallSignal.find(query)
      .sort({ _id: 1 })
      .limit(50)
      .lean();
    return res.json(
      signals.map((signal) => ({
        id: signal._id.toString(),
        from: signal.from,
        type: signal.type,
        payload: signal.payload,
      }))
    );
  } catch (error) {
    return next(error);
  }
});

export default router;
