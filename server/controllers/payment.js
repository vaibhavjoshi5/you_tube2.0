import crypto from "crypto";
import Razorpay from "razorpay";
import payments from "../Modals/payment.js";
import users from "../Modals/Auth.js";
import { paidPlanNames, plans } from "../config/plans.js";
import { createInvoice } from "../utils/invoice.js";
import { sendInvoiceEmail } from "../utils/notifications.js";

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

export const createOrder = async (req, res) => {
  const { plan } = req.body;

  if (!paidPlanNames.includes(plan)) {
    return res.status(400).json({ message: "Invalid plan selected" });
  }

  try {
    const selectedPlan = plans[plan];
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: selectedPlan.amount * 100,
      currency: "INR",
      receipt: `yt_${req.user._id.toString().slice(-8)}_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        plan,
      },
    });

    await payments.create({
      user: req.user._id,
      plan,
      amount: selectedPlan.amount,
      razorpayOrderId: order.id,
    });

    return res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: selectedPlan,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(503).json({ message: "Payment service is unavailable" });
  }
};

export const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = req.body;

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ message: "Incomplete payment response" });
  }

  try {
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const valid =
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

    if (!valid) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const payment = await payments.findOne({
      razorpayOrderId: orderId,
      user: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment order not found" });
    }

    if (payment.status === "paid") {
      return res.status(200).json({ result: req.user, payment });
    }

    payment.status = "paid";
    payment.razorpayPaymentId = paymentId;
    payment.paidAt = new Date();
    payment.invoiceNumber = `YT-${payment.paidAt
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "")}-${payment._id.toString().slice(-6).toUpperCase()}`;
    await payment.save();

    const user = await users.findByIdAndUpdate(
      req.user._id,
      { plan: payment.plan, planUpdatedAt: new Date() },
      { new: true }
    );
    const selectedPlan = plans[payment.plan];
    const invoice = await createInvoice({
      user,
      payment,
      plan: selectedPlan,
    });

    try {
      await sendInvoiceEmail({
        user,
        payment,
        plan: selectedPlan,
        invoice,
      });
    } catch (emailError) {
      console.error("Invoice email error:", emailError);
    }

    return res.status(200).json({ result: user, payment });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};

export const getPlans = async (req, res) =>
  res.status(200).json(
    Object.entries(plans).map(([id, plan]) => ({
      id,
      ...plan,
      dailyDownloads: Number.isFinite(plan.dailyDownloads)
        ? plan.dailyDownloads
        : null,
    }))
  );
