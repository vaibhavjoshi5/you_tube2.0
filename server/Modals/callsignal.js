import mongoose from "mongoose";

const callSignalSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true, maxlength: 80 },
    from: { type: String, required: true, maxlength: 80 },
    type: {
      type: String,
      required: true,
      enum: ["join", "offer", "answer", "candidate", "leave"],
    },
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000),
      expires: 0,
    },
  },
  { timestamps: true }
);

callSignalSchema.index({ roomId: 1, _id: 1 });

export default mongoose.models.CallSignal ||
  mongoose.model("CallSignal", callSignalSchema);
