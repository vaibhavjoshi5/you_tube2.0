import mongoose from "mongoose";

const paymentSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    plan: {
      type: String,
      enum: ["bronze", "silver", "gold"],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
    invoiceNumber: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("payment", paymentSchema);
