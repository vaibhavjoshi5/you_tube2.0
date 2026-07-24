import video from "../Modals/video.js";
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
  } else {
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
        videochanel: req.body.videochanel,
        uploader: req.body.uploader,
      });
      await file.save();
      return res.status(201).json("file uploaded successfully");
    } catch (error) {
      if (gridfsId) {
        await deleteVideoFile(gridfsId).catch(() => {});
      }
      console.error(" error:", error);
      return res.status(500).json({ message: "Something went wrong" });
    }
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
      uploader,
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
      uploader,
    });

    return res.status(201).json(file);
  } catch (error) {
    console.error("Video registration error:", error);
    return res.status(500).json({ message: "Unable to save video details" });
  }
};

export const getallvideo = async (req, res) => {
  try {
    const files = await video.find();
    return res.status(200).send(files);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
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
