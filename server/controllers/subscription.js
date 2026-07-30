import mongoose from "mongoose";
import subscriptions from "../Modals/subscription.js";
import videos from "../Modals/video.js";

const getCount = (channelId) => subscriptions.countDocuments({ channel: channelId });

export const getSubscriptionStatus = async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    return res.status(400).json({ message: "Invalid channel" });
  }

  try {
    const [existing, subscriberCount] = await Promise.all([
      subscriptions.exists({ subscriber: req.user._id, channel: channelId }),
      getCount(channelId),
    ]);

    return res.status(200).json({
      subscribed: Boolean(existing),
      subscriberCount,
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return res.status(500).json({ message: "Unable to load subscription" });
  }
};

export const toggleSubscription = async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    return res.status(400).json({ message: "Invalid channel" });
  }

  if (String(req.user._id) === String(channelId)) {
    return res.status(400).json({ message: "You cannot subscribe to yourself" });
  }

  try {
    const existing = await subscriptions.findOne({
      subscriber: req.user._id,
      channel: channelId,
    });

    if (existing) {
      await existing.deleteOne();
      return res.status(200).json({
        subscribed: false,
        subscriberCount: await getCount(channelId),
      });
    }

    await subscriptions.create({
      subscriber: req.user._id,
      channel: channelId,
    });

    return res.status(200).json({
      subscribed: true,
      subscriberCount: await getCount(channelId),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        subscribed: true,
        subscriberCount: await getCount(channelId),
      });
    }

    console.error("Toggle subscription error:", error);
    return res.status(500).json({ message: "Unable to update subscription" });
  }
};

export const getSubscribedVideos = async (req, res) => {
  try {
    const followedChannels = await subscriptions
      .find({ subscriber: req.user._id })
      .select("channel");
    const channelIds = followedChannels.map((item) => item.channel);

    if (channelIds.length === 0) return res.status(200).json([]);

    const subscribedVideos = await videos
      .find({ uploader: { $in: channelIds } })
      .sort({ createdAt: -1 });

    return res.status(200).json(subscribedVideos);
  } catch (error) {
    console.error("Subscribed videos error:", error);
    return res.status(500).json({ message: "Unable to load subscriptions" });
  }
};
