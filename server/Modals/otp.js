import mongoose from "mongoose";

const otpSchema = mongoose.Schema(
  {
    firebaseUid: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String },
    name: { type: String },
    image: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: "India" },
    latitude: { type: Number },
    longitude: { type: Number },
    method: { type: String, enum: ["email", "sms"], required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export default mongoose.model("otpchallenge", otpSchema);
