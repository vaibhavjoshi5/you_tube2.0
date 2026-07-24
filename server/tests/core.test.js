import test from "node:test";
import assert from "node:assert/strict";
import { plans } from "../config/plans.js";
import { isSouthernState } from "../utils/location.js";
import { hashOtp, otpMatches } from "../utils/otp.js";
import { getPublicBlobDownloadUrl } from "../services/blobDownload.js";

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

test("public Vercel Blob URLs are converted to download URLs", () => {
  assert.equal(
    getPublicBlobDownloadUrl(
      "https://example.public.blob.vercel-storage.com/videos/demo.mp4"
    ),
    "https://example.public.blob.vercel-storage.com/videos/demo.mp4?download=1"
  );
  assert.equal(
    getPublicBlobDownloadUrl(
      "https://example.public.blob.vercel-storage.com/videos/demo.mp4?x=1"
    ),
    "https://example.public.blob.vercel-storage.com/videos/demo.mp4?x=1&download=1"
  );
});

test("non-Vercel URLs cannot be used as download redirects", () => {
  assert.equal(getPublicBlobDownloadUrl("https://example.com/video.mp4"), null);
  assert.equal(
    getPublicBlobDownloadUrl(
      "https://example.public.blob.vercel-storage.com.evil.test/video.mp4"
    ),
    null
  );
});
