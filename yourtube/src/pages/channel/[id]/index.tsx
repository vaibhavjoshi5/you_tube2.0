import ChannelHeader from "@/components/ChannelHeader";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideos, {
  ChannelVideo,
} from "@/components/ChannelVideos";
import VideoUploader from "@/components/VideoUploader";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface ChannelProfile {
  _id: string;
  name?: string;
  channelname?: string;
  description?: string;
  image?: string;
}

const getRequestError = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
};

const ChannelPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [channel, setChannel] = useState<ChannelProfile | null>(null);
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const channelId = useMemo(
    () => (typeof id === "string" ? id : ""),
    [id]
  );

  const signedInUserId =
    user?._id === undefined || user?._id === null
      ? ""
      : String(user._id);
  const isOwner = Boolean(channelId && signedInUserId === channelId);

  useEffect(() => {
    if (!router.isReady || !channelId) return;

    const loadChannel = async () => {
      setLoading(true);
      try {
        const [profileResponse, videosResponse] = await Promise.all([
          axiosInstance.get<ChannelProfile>(`/user/profile/${channelId}`),
          axiosInstance.get<ChannelVideo[]>(`/video/channel/${channelId}`),
        ]);

        setChannel(profileResponse.data);
        setVideos(videosResponse.data);
      } catch (error: unknown) {
        setChannel(null);
        setVideos([]);
        toast.error(getRequestError(error, "Channel could not be loaded"));
      } finally {
        setLoading(false);
      }
    };

    void loadChannel();
  }, [router.isReady, channelId]);

  if (loading) {
    return <div className="p-8 text-center">Loading channel...</div>;
  }

  if (!channel) {
    return <div className="p-8 text-center">Channel not found.</div>;
  }

  return (
    <div className="min-h-screen flex-1 bg-white">
      <div className="mx-auto max-w-full">
        <ChannelHeader channel={channel} user={user} />
        <Channeltabs />

        {isOwner && (
          <div className="px-4 pb-8">
            <VideoUploader
              channelId={channelId}
              channelName={
                channel.channelname || channel.name || "My channel"
              }
              onUploaded={(newVideo) =>
                setVideos((currentVideos) => [
                  newVideo,
                  ...currentVideos.filter(
                    (video) => video._id !== newVideo._id
                  ),
                ])
              }
            />
          </div>
        )}

        <div className="px-4 pb-8">
          <ChannelVideos
            videos={videos}
            isOwner={isOwner}
            onDeleted={(videoId) =>
              setVideos((currentVideos) =>
                currentVideos.filter((video) => video._id !== videoId)
              )
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ChannelPage;
