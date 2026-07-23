import mongoose from "mongoose";
const userschema = mongoose.Schema(
  {
    firebaseUid: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    name: { type: String },
    channelname: { type: String },
    description: { type: String },
    image: { type: String },
    city: { type: String, default: "Unknown" },
    state: { type: String, default: "Unknown" },
    country: { type: String, default: "India" },
    latitude: { type: Number },
    longitude: { type: Number },
    plan: {
      type: String,
      enum: ["free", "bronze", "silver", "gold"],
      default: "free",
    },
    planUpdatedAt: { type: Date, default: Date.now },
    joinedon: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("user", userschema);
