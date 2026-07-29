import axios from "axios";
import { FileVideo, Upload, X } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";
import axiosInstance, { backendUrl } from "@/lib/axiosinstance";
import type { ChannelVideo } from "./ChannelVideos";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";

interface VideoUploaderProps {
  channelId: string;
  channelName: string;
  onUploaded?: (video: ChannelVideo) => void;
}

const getUploadError = (error: unknown) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      "There was an error uploading your video. Please try again."
    );
  }
  if (error instanceof Error && error.name === "AbortError") {
    return "Your video upload was cancelled";
  }
  return "There was an error uploading your video. Please try again.";
};

const VideoUploader = ({
  channelId,
  channelName,
  onUploaded,
}: VideoUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setVideoFile(null);
    setVideoTitle("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "video/mp4") {
      toast.error("Please upload an MP4 video file.");
      event.target.value = "";
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error("Please select an MP4 video up to 500 MB.");
      event.target.value = "";
      return;
    }

    setVideoFile(file);
    if (!videoTitle.trim()) {
      setVideoTitle(file.name.replace(/\.mp4$/i, ""));
    }
  };

  const cancelUpload = () => {
    if (isUploading) {
      abortControllerRef.current?.abort();
    }
    resetForm();
  };

  const handleUpload = async () => {
    if (!videoFile || !videoTitle.trim()) {
      toast.error("Please provide a video file and title");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Please sign in again before uploading");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const blob = await upload(
        `videos/${channelId}/${Date.now()}-${videoFile.name}`,
        videoFile,
        {
          access: "public",
          handleUploadUrl: `${backendUrl}/video/blob-upload`,
          headers: { Authorization: `Bearer ${token}` },
          contentType: "video/mp4",
          multipart: true,
          abortSignal: controller.signal,
          onUploadProgress: ({ percentage }) => {
            setUploadProgress(Math.round(percentage));
          },
        }
      );

      const response = await axiosInstance.post<ChannelVideo>("/video/register", {
        videotitle: videoTitle.trim(),
        filename: videoFile.name,
        filepath: blob.url,
        filetype: videoFile.type,
        filesize: videoFile.size,
        videochanel: channelName,
      });

      onUploaded?.(response.data);
      resetForm();
      toast.success("Video uploaded successfully");
    } catch (error: unknown) {
      toast.error(getUploadError(error));
    } finally {
      abortControllerRef.current = null;
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-lg bg-gray-50 p-4 sm:p-6">
      <h2 className="mb-4 text-xl font-semibold">Upload a video</h2>

      <div className="space-y-4">
        {!videoFile ? (
          <button
            type="button"
            className="w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:bg-gray-100 sm:p-8"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto mb-2 h-12 w-12 text-gray-400" />
            <p className="text-base font-medium sm:text-lg">
              Select a video to upload
            </p>
            <p className="mt-1 text-sm text-gray-500">MP4, up to 500 MB</p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="video/mp4"
              onChange={handleFileChange}
            />
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border bg-white p-3">
              <div className="rounded-md bg-blue-100 p-2">
                <FileVideo className="h-6 w-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{videoFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={cancelUpload}
                aria-label={isUploading ? "Cancel upload" : "Remove selected video"}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div>
              <Label htmlFor="video-title">Title</Label>
              <Input
                id="video-title"
                value={videoTitle}
                onChange={(event) => setVideoTitle(event.target.value)}
                placeholder="Add a title that describes your video"
                disabled={isUploading}
                maxLength={150}
                className="mt-1"
              />
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={cancelUpload}
              >
                {isUploading ? "Cancel upload" : "Cancel"}
              </Button>
              <Button
                type="button"
                onClick={() => void handleUpload()}
                disabled={isUploading || !videoTitle.trim()}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;
