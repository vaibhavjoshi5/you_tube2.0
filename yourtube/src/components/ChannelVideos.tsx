import axios from "axios";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosinstance";
import VideoCard from "./videocard";
import { Button } from "./ui/button";

export interface ChannelVideo {
  _id: string;
  videotitle: string;
  filename?: string;
  filetype?: string;
  filepath: string;
  filesize?: number;
  videochanel?: string;
  Like?: number;
  Dislike?: number;
  views?: number;
  uploader?: string;
  createdAt?: string;
}

interface ChannelVideosProps {
  videos: ChannelVideo[];
  isOwner?: boolean;
  onDeleted?: (videoId: string) => void;
}

const getDeleteError = (error: unknown) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || "Video could not be deleted";
  }
  return "Video could not be deleted";
};

export default function ChannelVideos({
  videos,
  isOwner = false,
  onDeleted,
}: ChannelVideosProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (video: ChannelVideo) => {
    const confirmed = window.confirm(
      `Delete "${video.videotitle}" permanently?\n\nIts comments, likes, history, watch-later and download records will also be removed.`
    );

    if (!confirmed) return;

    setDeletingId(video._id);
    try {
      await axiosInstance.delete(`/video/${video._id}`);
      toast.success("Video deleted permanently");
      onDeleted?.(video._id);
    } catch (error: unknown) {
      toast.error(getDeleteError(error));
    } finally {
      setDeletingId(null);
    }
  };

  if (videos.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600">No videos uploaded yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Videos</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <div key={video._id} className="space-y-2">
            <VideoCard video={video} />
            {isOwner && (
              <Button
                type="button"
                variant="outline"
                className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={deletingId === video._id}
                onClick={() => void handleDelete(video)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deletingId === video._id ? "Deleting..." : "Delete video"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
