import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
import type { ChannelVideo } from "@/components/ChannelVideos";
import VideoInfo from "@/components/VideoInfo";
import VideoPlayer from "@/components/Videopplayer";
import axiosInstance from "@/lib/axiosinstance";
import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const getLoadError = (error: unknown) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || "Video could not be loaded";
  }
  return "Video could not be loaded";
};

const WatchPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [currentVideo, setCurrentVideo] = useState<ChannelVideo | null>(null);
  const [allVideos, setAllVideos] = useState<ChannelVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const videoId = typeof id === "string" ? id : "";

  useEffect(() => {
    if (!router.isReady || !videoId) return;

    const fetchVideo = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get<ChannelVideo[]>("/video/getall");
        const selectedVideo = response.data.find(
          (video) => video._id === videoId
        );

        setCurrentVideo(selectedVideo || null);
        setAllVideos(response.data);
      } catch (error: unknown) {
        setCurrentVideo(null);
        setAllVideos([]);
        toast.error(getLoadError(error));
      } finally {
        setLoading(false);
      }
    };

    void fetchVideo();
  }, [router.isReady, videoId]);

  const relatedVideos = useMemo(
    () => allVideos.filter((video) => video._id !== currentVideo?._id),
    [allVideos, currentVideo?._id]
  );

  const handleNextVideo = () => {
    if (!currentVideo || relatedVideos.length === 0) return;
    const currentIndex = allVideos.findIndex(
      (video) => video._id === currentVideo._id
    );
    const nextVideo = allVideos[(currentIndex + 1) % allVideos.length];
    if (nextVideo) {
      void router.push(`/watch/${nextVideo._id}`);
    }
  };

  const openComments = () => {
    document.getElementById("comments")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (loading) {
    return <div className="p-8 text-center">Loading video...</div>;
  }

  if (!currentVideo) {
    return <div className="p-8 text-center">Video not found.</div>;
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <VideoPlayer
              video={currentVideo}
              onNext={handleNextVideo}
              onOpenComments={openComments}
            />
            <VideoInfo video={currentVideo} />
            <Comments videoId={videoId} />
          </div>
          <aside className="space-y-4">
            <RelatedVideos videos={relatedVideos} />
          </aside>
        </div>
      </div>
    </main>
  );
};

export default WatchPage;
