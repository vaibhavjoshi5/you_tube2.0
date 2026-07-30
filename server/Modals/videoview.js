import mongoose from "mongoose";

const videoViewSchema = mongoose.Schema(
  {
    videoid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },
    viewerKey: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

videoViewSchema.index({ videoid: 1, viewerKey: 1 }, { unique: true });

export default mongoose.model("videoview", videoViewSchema);
