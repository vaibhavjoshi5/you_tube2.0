import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { getMediaUrl } from "@/lib/media";
import type { ChannelVideo } from "./ChannelVideos";

interface RelatedVideosProps {
  videos: ChannelVideo[];
}

export default function RelatedVideos({ videos }: RelatedVideosProps) {
  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
        No related videos available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {videos.map((video) => (
        <Link
          key={video._id}
          href={`/watch/${video._id}`}
          className="group flex gap-2"
        >
          <div className="relative aspect-video w-36 flex-shrink-0 overflow-hidden rounded bg-gray-100 sm:w-40">
            <video
              src={getMediaUrl(video.filepath)}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              preload="metadata"
              muted
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-medium group-hover:text-blue-600">
              {video.videotitle}
            </h3>
            <p className="mt-1 truncate text-xs text-gray-600">
              {video.videochanel || "YourTube"}
            </p>
            <p className="text-xs text-gray-600">
              {(video.views || 0).toLocaleString()} views
              {video.createdAt
                ? ` • ${formatDistanceToNow(new Date(video.createdAt))} ago`
                : ""}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
