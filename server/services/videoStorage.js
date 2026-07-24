import mongoose from "mongoose";
import { Readable } from "stream";

const BUCKET_NAME = "videos";

const getBucket = () => {
  if (!mongoose.connection.db) {
    throw new Error("Database is not connected");
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: BUCKET_NAME,
  });
};

export const saveVideoFile = ({ buffer, filename, contentType }) =>
  new Promise((resolve, reject) => {
    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      metadata: { uploadedAt: new Date() },
    });

    uploadStream.once("error", reject);
    uploadStream.once("finish", () => resolve(uploadStream.id));
    Readable.from(buffer).pipe(uploadStream);
  });

export const findVideoFile = async (fileId) => {
  if (!mongoose.isValidObjectId(fileId)) return null;
  const [file] = await getBucket()
    .find({ _id: new mongoose.Types.ObjectId(fileId) })
    .limit(1)
    .toArray();
  return file || null;
};

export const openVideoStream = (fileId, options) =>
  getBucket().openDownloadStream(
    new mongoose.Types.ObjectId(fileId),
    options
  );

export const deleteVideoFile = async (fileId) => {
  if (!mongoose.isValidObjectId(fileId)) return;
  await getBucket().delete(new mongoose.Types.ObjectId(fileId));
};
