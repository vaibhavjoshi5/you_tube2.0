import mongoose from "mongoose";
import { del } from "@vercel/blob";
import video from "../Modals/video.js";
import comment from "../Modals/comment.js";
import like from "../Modals/like.js";
import history from "../Modals/history.js";
import watchlater from "../Modals/watchlater.js";
import downloads from "../Modals/download.js";
import {
  deleteVideoFile,
  findVideoFile,
  openVideoStream,
  saveVideoFile,
} from "../services/videoStorage.js";

export const uploadvideo = async (req, res) => {
  if (req.file === undefined) {
    return res
      .status(400)
      .json({ message: "Please upload an MP4 video file" });
  }

  let gridfsId;
  try {
    gridfsId = await saveVideoFile({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const file = new video({
      videotitle: req.body.videotitle,
      filename: req.file.originalname,
      filepath: `video/stream/${gridfsId}`,
      gridfsId,
      filetype: req.file.mimetype,
      filesize: req.file.size,
      videochanel: req.user.channelname || req.user.name || "My channel",
      uploader: req.user._id.toString(),
    });

    await file.save();
    return res.status(201).json("file uploaded successfully");
  } catch (error) {
    if (gridfsId) {
      await deleteVideoFile(gridfsId).catch(() => {});
    }
    console.error("Upload video error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const registervideo = async (req, res) => {
  try {
    const {
      videotitle,
      filename,
      filepath,
      filetype,
      filesize,
      videochanel,
    } = req.body;

    if (
      !videotitle?.trim() ||
      !filename?.trim() ||
      !filepath?.startsWith("https://") ||
      filetype !== "video/mp4" ||
      !Number.isFinite(Number(filesize)) ||
      Number(filesize) <= 0 ||
      Number(filesize) > 500 * 1024 * 1024 ||
      !videochanel?.trim()
    ) {
      return res.status(400).json({ message: "Invalid video details" });
    }

    const file = await video.create({
      videotitle: videotitle.trim(),
      filename: filename.trim(),
      filepath,
      filetype,
      filesize: Number(filesize),
      videochanel: videochanel.trim(),
      uploader: req.user._id.toString(),
    });

    return res.status(201).json(file);
  } catch (error) {
    console.error("Video registration error:", error);
    return res.status(500).json({ message: "Unable to save video details" });
  }
};

export const getallvideo = async (req, res) => {
  try {
    const files = await video.find().sort({ createdAt: -1 });
    return res.status(200).send(files);
  } catch (error) {
    console.error("Get videos error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getChannelVideos = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.channelId)) {
    return res.status(400).json({ message: "Invalid channel" });
  }

  try {
    const files = await video
      .find({ uploader: req.params.channelId })
      .sort({ createdAt: -1 });

    return res.status(200).json(files);
  } catch (error) {
    console.error("Channel videos error:", error);
    return res.status(500).json({ message: "Unable to load channel videos" });
  }
};

export const deleteVideo = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.videoId)) {
    return res.status(404).json({ message: "Video not found" });
  }

  try {
    const currentVideo = await video.findById(req.params.videoId);
    if (!currentVideo) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (String(currentVideo.uploader) !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the uploader can delete this video" });
    }

    if (currentVideo.gridfsId) {
      await deleteVideoFile(currentVideo.gridfsId);
    } else if (
      typeof currentVideo.filepath === "string" &&
      currentVideo.filepath.includes(".public.blob.vercel-storage.com")
    ) {
      await del(currentVideo.filepath);
    }

    const videoId = currentVideo._id;
    await Promise.all([
      comment.deleteMany({ videoid: videoId }),
      like.deleteMany({ videoid: videoId }),
      history.deleteMany({ videoid: videoId }),
      watchlater.deleteMany({ videoid: videoId }),
      downloads.deleteMany({ video: videoId }),
    ]);

    await currentVideo.deleteOne();
    return res.status(200).json({ deleted: true, videoId });
  } catch (error) {
    console.error("Delete video error:", error);
    return res.status(500).json({ message: "Unable to delete video" });
  }
};

export const streamVideo = async (req, res) => {
  try {
    const file = await findVideoFile(req.params.fileId);
    if (!file) {
      return res.status(404).json({ message: "Video file not found" });
    }

    const total = file.length;
    const range = req.headers.range;
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", file.contentType || "video/mp4");
    res.setHeader("Cache-Control", "public, max-age=3600");

    if (!range) {
      res.setHeader("Content-Length", total);
      return openVideoStream(file._id).pipe(res);
    }

    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      res.setHeader("Content-Range", `bytes */${total}`);
      return res.sendStatus(416);
    }

    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : total - 1;

    if (start < 0 || end < start || start >= total || end >= total) {
      res.setHeader("Content-Range", `bytes */${total}`);
      return res.sendStatus(416);
    }

    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
    res.setHeader("Content-Length", end - start + 1);
    return openVideoStream(file._id, { start, end: end + 1 }).pipe(res);
  } catch (error) {
    console.error("Video stream error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Unable to stream video" });
    }
    res.end();
  }
};
