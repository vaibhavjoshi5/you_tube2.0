import downloads from "../Modals/download.js";
import videos from "../Modals/video.js";
import { plans } from "../config/plans.js";
import { findVideoFile, openVideoStream } from "../services/videoStorage.js";

const startOfTodayInIst = () => {
  const offset = 330 * 60 * 1000;
  const ist = new Date(Date.now() + offset);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - offset);
};

export const downloadVideo = async (req, res) => {
  try {
    const video = await videos.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const plan = plans[req.user.plan] || plans.free;
    if (Number.isFinite(plan.dailyDownloads)) {
      const count = await downloads.countDocuments({
        user: req.user._id,
        downloadedAt: { $gte: startOfTodayInIst() },
      });

      if (count >= plan.dailyDownloads) {
        return res.status(403).json({
          code: "DOWNLOAD_LIMIT_REACHED",
          message: "Free users can download one video per day",
        });
      }
    }

    const storedFile = video.gridfsId
      ? await findVideoFile(video.gridfsId)
      : null;
    if (!storedFile) {
      return res.status(404).json({ message: "Video file is unavailable" });
    }

    await downloads.create({
      user: req.user._id,
      video: video._id,
    });

    const safeFilename = video.filename.replace(/["\r\n]/g, "_");
    res.setHeader("Content-Type", video.filetype || "video/mp4");
    res.setHeader("Content-Length", storedFile.length);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"`
    );
    return openVideoStream(storedFile._id).pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    return res.status(500).json({ message: "Unable to download video" });
  }
};

export const getDownloads = async (req, res) => {
  try {
    const history = await downloads
      .find({ user: req.user._id })
      .sort({ downloadedAt: -1 })
      .populate("video");
    return res.status(200).json(history);
  } catch (error) {
    console.error("Download history error:", error);
    return res.status(500).json({ message: "Unable to load downloads" });
  }
};
