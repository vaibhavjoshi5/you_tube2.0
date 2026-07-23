import test from "node:test";
import assert from "node:assert/strict";
import { plans } from "../config/plans.js";
import { isSouthernState } from "../utils/location.js";
import { hashOtp, otpMatches } from "../utils/otp.js";

process.env.JWT_SECRET = "test-secret";

test("southern states are detected case-insensitively", () => {
  assert.equal(isSouthernState("Karnataka"), true);
  assert.equal(isSouthernState(" tamil nadu "), true);
  assert.equal(isSouthernState("Gujarat"), false);
});

test("plan limits match internship requirements", () => {
  assert.equal(plans.free.watchLimitSeconds, 300);
  assert.equal(plans.bronze.watchLimitSeconds, 420);
  assert.equal(plans.silver.watchLimitSeconds, 600);
  assert.equal(plans.gold.watchLimitSeconds, null);
  assert.equal(plans.free.dailyDownloads, 1);
  assert.equal(plans.gold.dailyDownloads, Infinity);
});

test("OTP comparison accepts only the matching code", () => {
  const hash = hashOtp("123456");
  assert.equal(otpMatches("123456", hash), true);
  assert.equal(otpMatches("654321", hash), false);
});
