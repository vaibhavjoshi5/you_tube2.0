import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import users from "../Modals/Auth.js";
import otpChallenges from "../Modals/otp.js";
import admin from "../config/firebase.js";
import { isSouthernState } from "../utils/location.js";
import { createOtp, hashOtp, otpMatches } from "../utils/otp.js";
import { sendEmailOtp, sendSmsOtp } from "../utils/notifications.js";

const normalizePhone = (phone = "") => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length > 10) return `+${digits}`;
  return "";
};

export const startLogin = async (req, res) => {
  const { idToken, phone, location } = req.body;

  if (!idToken || !location?.city || !location?.state) {
    return res
      .status(400)
      .json({ message: "Verified identity, city and state are required" });
  }

  try {
    const firebaseUser = await admin.auth().verifyIdToken(idToken);
    const method = isSouthernState(location.state) ? "email" : "sms";
    const normalizedPhone = normalizePhone(phone);

    if (method === "sms" && !normalizedPhone) {
      return res
        .status(400)
        .json({ message: "A valid mobile number is required for this region" });
    }

    const otp = createOtp();
    const challenge = await otpChallenges.create({
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      phone: normalizedPhone || undefined,
      name: firebaseUser.name,
      image: firebaseUser.picture,
      city: location.city,
      state: location.state,
      country: location.country || "India",
      latitude: location.latitude,
      longitude: location.longitude,
      method,
      codeHash: hashOtp(otp),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    if (method === "email") {
      await sendEmailOtp(firebaseUser.email, otp);
    } else {
      await sendSmsOtp(normalizedPhone, otp);
    }

    return res.status(200).json({
      challengeId: challenge._id,
      method,
      destination:
        method === "email"
          ? firebaseUser.email.replace(/(^.).*(@.*$)/, "$1***$2")
          : normalizedPhone.replace(/.(?=.{4})/g, "*"),
    });
  } catch (error) {
    console.error("Login start error:", error);
    return res.status(401).json({ message: "Unable to start verification" });
  }
};

export const verifyLogin = async (req, res) => {
  const { challengeId, otp } = req.body;

  if (!mongoose.Types.ObjectId.isValid(challengeId) || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: "Invalid verification request" });
  }

  try {
    const challenge = await otpChallenges.findById(challengeId);

    if (!challenge || challenge.expiresAt <= new Date()) {
      return res.status(400).json({ message: "Verification code has expired" });
    }

    if (challenge.attempts >= 5) {
      await challenge.deleteOne();
      return res.status(429).json({ message: "Too many verification attempts" });
    }

    if (!otpMatches(otp, challenge.codeHash)) {
      challenge.attempts += 1;
      await challenge.save();
      return res.status(400).json({ message: "Incorrect verification code" });
    }

    const user = await users.findOneAndUpdate(
      { email: challenge.email },
      {
        $set: {
          firebaseUid: challenge.firebaseUid,
          phone: challenge.phone,
          name: challenge.name,
          image: challenge.image,
          city: challenge.city,
          state: challenge.state,
          country: challenge.country,
          latitude: challenge.latitude,
          longitude: challenge.longitude,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await challenge.deleteOne();

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({ result: user, token });
  } catch (error) {
    console.error("Login verification error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getProfile = async (req, res) =>
  res.status(200).json({ result: req.user });
export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  if (req.user._id.toString() !== _id) {
    return res.status(403).json({ message: "You cannot edit this profile" });
  }
  try {
    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: {
          channelname: channelname,
          description: description,
        },
      },
      { new: true }
    );
    return res.status(201).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
