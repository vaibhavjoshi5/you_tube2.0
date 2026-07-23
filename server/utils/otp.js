import crypto from "crypto";

export const createOtp = () =>
  crypto.randomInt(100000, 1000000).toString();

export const hashOtp = (otp) =>
  crypto
    .createHmac("sha256", process.env.OTP_SECRET || process.env.JWT_SECRET)
    .update(otp)
    .digest("hex");

export const otpMatches = (otp, expectedHash) => {
  const actual = Buffer.from(hashOtp(otp));
  const expected = Buffer.from(expectedHash);
  return (
    actual.length === expected.length &&
    crypto.timingSafeEqual(actual, expected)
  );
};
