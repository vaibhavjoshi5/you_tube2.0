import { useEffect, useState } from "react";
import Videocard from "@/components/videocard";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

export default function SubscriptionsPage() {
  const { user, handlegooglesignin } = useUser();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setVideos([]);
      return;
    }

    setLoading(true);
    axiosInstance
      .get("/user/subscriptions/videos")
      .then((response) => setVideos(response.data))
      .catch((error) => {
        console.error("Unable to load subscriptions:", error);
        setVideos([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <main className="w-full p-3 sm:p-4 lg:p-6">
      <div className="mb-6 rounded-2xl border bg-white p-5">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="mt-1 text-sm text-slate-500">
          {user
            ? "Fresh videos from channels you follow and recommendations for you."
            : "Sign in to follow channels and keep your favourite creators together."}
        </p>
        {!user && (
          <button
            type="button"
            onClick={() => void handlegooglesignin()}
            className="mt-4 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Sign in
          </button>
        )}
      </div>
      {user && loading && <p className="text-sm text-slate-500">Loading subscriptions...</p>}
      {user && !loading && videos.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
          Subscribe to channels to see their latest videos here.
        </div>
      )}
      {user && !loading && videos.length > 0 && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {videos.map((video) => (
            <Videocard key={video._id} video={video} />
          ))}
        </div>
      )}
    </main>
  );
}
