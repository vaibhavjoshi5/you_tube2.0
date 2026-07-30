import video from "../Modals/video.js";
import history from "../Modals/history.js";
import videoViews from "../Modals/videoview.js";

export const handlehistory = async (req, res) => {
  const userId = req.user._id;
  const { videoId } = req.params;
  try {
    const existingHistory = await history.findOne({
      viewer: userId,
      videoid: videoId,
    });

    if (existingHistory) {
      return res.status(200).json({ history: true, counted: false });
    }

    await history.create({ viewer: userId, videoid: videoId });
    const updatedVideo = await video.findByIdAndUpdate(
      videoId,
      { $inc: { views: 1 } },
      { new: true }
    );
    return res.status(200).json({
      history: true,
      counted: true,
      views: updatedVideo?.views,
    });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const handleview = async (req, res) => {
  const { videoId } = req.params;
  const viewerKey = String(req.body?.viewerKey || "").trim();

  if (!viewerKey || viewerKey.length > 120) {
    return res.status(400).json({ message: "Viewer identity is required" });
  }

  try {
    const existingView = await videoViews.findOne({ videoid: videoId, viewerKey });

    if (existingView) {
      return res.status(200).json({ viewed: true, counted: false });
    }

    await videoViews.create({ videoid: videoId, viewerKey });
    const updatedVideo = await video.findByIdAndUpdate(
      videoId,
      { $inc: { views: 1 } },
      { new: true }
    );
    return res.status(200).json({
      viewed: true,
      counted: true,
      views: updatedVideo?.views,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ viewed: true, counted: false });
    }
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getallhistoryVideo = async (req, res) => {
  const userId = req.user._id;
  try {
    const historyvideo = await history
      .find({ viewer: userId })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();
    return res.status(200).json(historyvideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
