import { PointerEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Lock, RotateCcw, RotateCw } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import { useUser } from "@/lib/AuthContext";
import { Button } from "./ui/button";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
  onNext: () => void;
  onOpenComments: () => void;
}

const watchLimits: Record<string, number | null> = {
  free: 5 * 60,
  bronze: 7 * 60,
  silver: 10 * 60,
  gold: null,
};

export default function VideoPlayer({
  video,
  onNext,
  onOpenComments,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapTimer = useRef<number | null>(null);
  const tapState = useRef({ zone: "", count: 0 });
  const [gestureLabel, setGestureLabel] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const { user } = useUser();
  const plan = user?.plan || "free";
  const watchLimit = watchLimits[plan] ?? watchLimits.free;

  useEffect(() => {
    setLimitReached(false);
    tapState.current = { zone: "", count: 0 };
  }, [video._id, plan]);

  const showGesture = (label: string) => {
    setGestureLabel(label);
    window.setTimeout(() => setGestureLabel(""), 900);
  };

  const runGesture = (zone: string, count: number) => {
    const player = videoRef.current;
    if (!player) return;

    if (count >= 3) {
      if (zone === "center") {
        showGesture("Next video");
        onNext();
      } else if (zone === "left") {
        showGesture("Opening comments");
        onOpenComments();
      } else {
        showGesture("Closing YourTube");
        window.close();
        window.setTimeout(() => {
          window.location.assign("/exit");
        }, 150);
      }
      return;
    }

    if (count === 2 && zone === "left") {
      player.currentTime = Math.max(0, player.currentTime - 10);
      showGesture("10 seconds back");
    } else if (count === 2 && zone === "right") {
      player.currentTime = Math.min(player.duration || Infinity, player.currentTime + 10);
      showGesture("10 seconds forward");
    } else if (count === 1 && zone === "center") {
      if (player.paused) {
        player.play();
        showGesture("Play");
      } else {
        player.pause();
        showGesture("Pause");
      }
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = (event.clientX - bounds.left) / bounds.width;
    const zone = position < 0.34 ? "left" : position > 0.66 ? "right" : "center";

    if (tapState.current.zone !== zone) {
      tapState.current = { zone, count: 0 };
    }
    tapState.current.count += 1;

    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => {
      runGesture(tapState.current.zone, tapState.current.count);
      tapState.current = { zone: "", count: 0 };
    }, 320);
  };

  const enforceWatchLimit = () => {
    const player = videoRef.current;
    if (!player || watchLimit === null) return;
    if (player.currentTime >= watchLimit) {
      player.pause();
      player.currentTime = watchLimit;
      setLimitReached(true);
    }
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        preload="metadata"
        onTimeUpdate={enforceWatchLimit}
        onPlay={enforceWatchLimit}
      >
        <source src={getMediaUrl(video?.filepath)} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div
        className="absolute inset-x-0 top-0 bottom-12 z-10 touch-manipulation"
        onPointerUp={handlePointerUp}
        aria-label="Gesture control area"
      />

      {gestureLabel && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-black/75 px-4 py-2 text-sm text-white">
          {gestureLabel.includes("back") && <RotateCcw className="h-4 w-4" />}
          {gestureLabel.includes("forward") && <RotateCw className="h-4 w-4" />}
          {gestureLabel}
        </div>
      )}

      {limitReached && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 p-6 text-center text-white">
          <div>
            <Lock className="mx-auto mb-3 h-9 w-9 text-amber-400" />
            <h2 className="text-xl font-semibold">Viewing limit reached</h2>
            <p className="mt-2 max-w-md text-sm text-gray-300">
              Your {plan} plan allows {Math.floor((watchLimit || 0) / 60)} minutes
              per video. Upgrade for longer or unlimited viewing.
            </p>
            <Button asChild className="mt-5">
              <Link href="/premium">View premium plans</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
