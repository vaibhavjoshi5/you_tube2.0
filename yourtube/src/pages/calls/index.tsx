import { useRouter } from "next/router";
import VideoCall from "@/components/VideoCall";

export default function CallsPage() {
  const router = useRouter();
  const room = typeof router.query.room === "string" ? router.query.room : "";

  return (
    <main className="w-full p-4 sm:p-6">
      <div className="mb-7 text-center">
        <h1 className="text-3xl font-bold">YourTube Together</h1>
        <p className="mt-2 text-gray-500">
          Video call a friend, share a YouTube tab and save the recording locally.
        </p>
      </div>
      <VideoCall initialRoom={room} />
    </main>
  );
}
