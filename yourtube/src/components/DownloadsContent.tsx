import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosinstance";
import { getMediaUrl } from "@/lib/media";
import { Button } from "./ui/button";

export default function DownloadsContent() {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/download")
      .then((response) => setDownloads(response.data))
      .catch(() => toast.error("Download history could not be loaded"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading downloads...</p>;

  return (
    <div className="space-y-4">
      {downloads.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-gray-500">
          <Download className="mx-auto mb-3 h-8 w-8" />
          Your downloaded videos will appear here.
        </div>
      ) : (
        downloads.map((item) => (
          <article
            key={item._id}
            className="flex flex-col gap-4 rounded-xl border p-3 sm:flex-row"
          >
            <video
              src={getMediaUrl(item.video?.filepath)}
              className="aspect-video w-full rounded-lg object-cover sm:w-56"
              muted
              preload="metadata"
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">{item.video?.videotitle}</h2>
              <p className="text-sm text-gray-500">{item.video?.videochanel}</p>
              <p className="mt-1 text-xs text-gray-500">
                Downloaded{" "}
                {formatDistanceToNow(new Date(item.downloadedAt))} ago
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href={`/watch/${item.video?._id}`}>
                  <Play className="mr-2 h-4 w-4" />
                  Watch
                </Link>
              </Button>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
