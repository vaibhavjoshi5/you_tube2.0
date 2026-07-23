import comment from "../Modals/comment.js";
import mongoose from "mongoose";

const hasBlockedCharacters = (value = "") =>
  /[^\p{L}\p{M}\p{N}\s]/u.test(value);

const validateComment = (value = "") => {
  const body = value.trim();
  if (!body) return "Comment cannot be empty";
  if (body.length > 500) return "Comment cannot exceed 500 characters";
  if (hasBlockedCharacters(body)) {
    return "Special characters are not allowed in comments";
  }
  return null;
};

export const postcomment = async (req, res) => {
  const error = validateComment(req.body.commentbody);
  if (error) return res.status(400).json({ message: error });

  try {
    const postedComment = await comment.create({
      videoid: req.body.videoid,
      userid: req.user._id,
      commentbody: req.body.commentbody.trim(),
      usercommented: req.user.name || "Anonymous",
      city: req.user.city || "Unknown",
    });
    return res.status(201).json(postedComment);
  } catch (requestError) {
    console.error("Post comment error:", requestError);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallcomment = async (req, res) => {
  try {
    const comments = await comment
      .find({ videoid: req.params.videoid })
      .sort({ createdAt: -1 });
    return res.status(200).json(comments);
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletecomment = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: "Comment unavailable" });
  }

  try {
    const deleted = await comment.findOneAndDelete({
      _id: req.params.id,
      userid: req.user._id,
    });

    if (!deleted) {
      return res.status(403).json({ message: "You cannot delete this comment" });
    }
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const error = validateComment(req.body.commentbody);
  if (error) return res.status(400).json({ message: error });

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: "Comment unavailable" });
  }

  try {
    const updated = await comment.findOneAndUpdate(
      { _id: req.params.id, userid: req.user._id },
      { commentbody: req.body.commentbody.trim() },
      { new: true }
    );

    if (!updated) {
      return res.status(403).json({ message: "You cannot edit this comment" });
    }
    return res.status(200).json(updated);
  } catch (error) {
    console.error("Edit comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const reactToComment = async (req, res) => {
  const { type } = req.body;
  if (!["like", "dislike"].includes(type)) {
    return res.status(400).json({ message: "Invalid reaction" });
  }

  try {
    const current = await comment.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ message: "Comment unavailable" });
    }

    if (current.userid.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You cannot react to your own comment" });
    }

    const target = type === "like" ? "likes" : "dislikes";
    const opposite = type === "like" ? "dislikes" : "likes";
    const alreadyReacted = current[target].some((id) =>
      id.equals(req.user._id)
    );

    current[opposite] = current[opposite].filter(
      (id) => !id.equals(req.user._id)
    );

    if (alreadyReacted) {
      current[target] = current[target].filter(
        (id) => !id.equals(req.user._id)
      );
    } else {
      current[target].push(req.user._id);
    }

    if (current.dislikes.length >= 2) {
      await current.deleteOne();
      return res.status(200).json({ removed: true, commentId: current._id });
    }

    await current.save();
    return res.status(200).json(current);
  } catch (error) {
    console.error("Comment reaction error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const translateComment = async (req, res) => {
  const target = String(req.body.target || "").toLowerCase();
  if (!/^[a-z]{2,3}$/.test(target)) {
    return res.status(400).json({ message: "Invalid target language" });
  }

  try {
    const current = await comment.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ message: "Comment unavailable" });
    }

    const baseUrl =
      process.env.TRANSLATION_API_URL ||
      "https://api.mymemory.translated.net/get";
    const url = new URL(baseUrl);
    url.searchParams.set("q", current.commentbody);
    url.searchParams.set("langpair", `auto|${target}`);

    const response = await fetch(url);
    if (!response.ok) throw new Error("Translation provider failed");
    const data = await response.json();

    return res.status(200).json({
      translatedText: data.responseData?.translatedText,
      target,
    });
  } catch (error) {
    console.error("Translate comment error:", error);
    return res.status(502).json({ message: "Translation is unavailable" });
  }
};
