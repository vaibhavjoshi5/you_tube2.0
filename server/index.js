import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import paymentroutes from "./routes/payment.js";
import downloadroutes from "./routes/download.js";
import callroutes from "./routes/call.js";
import multer from "multer";
const app = express();

const DBURL = process.env.DB_URL;
let databasePromise;

const connectDatabase = () => {
  if (!DBURL) {
    return Promise.reject(
      new Error("DB_URL is required. Copy .env.example to .env and configure it.")
    );
  }
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!databasePromise) {
    databasePromise = mongoose.connect(DBURL).catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
};

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});
app.get("/", (req, res) => {
  res.send("You tube backend is working");
});
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});
app.use(bodyParser.json());
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/payment", paymentroutes);
app.use("/download", downloadroutes);
app.use("/call", callroutes);
const PORT = process.env.PORT || 5000;

app.use((error, req, res, next) => {
  console.error(error);
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "Video is too large. The hosted demo accepts MP4 files up to 4 MB.",
      });
    }
    return res.status(400).json({ message: "Please upload one MP4 video file" });
  }
  res.status(500).json({ message: "Unexpected server error" });
});

if (!process.env.VERCEL) {
  if (!process.env.JWT_SECRET) {
    console.error(
      "DB_URL and JWT_SECRET are required. Copy .env.example to .env and configure them."
    );
    process.exit(1);
  }
  connectDatabase()
    .then(() => {
      console.log("Mongodb connected");
      app.listen(PORT, () => {
        console.log(`server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    });
}

export { app, connectDatabase };
export default app;
