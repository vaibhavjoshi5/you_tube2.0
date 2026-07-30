import { useState } from "react";

const formatDuration = (duration: number) => {
  if (!Number.isFinite(duration) || duration <= 0) return "";

  const totalSeconds = Math.floor(duration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export default function VideoDurationBadge({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  const [duration, setDuration] = useState("");

  return (
    <>
      <video
        src={src}
        preload="metadata"
        className="hidden"
        onLoadedMetadata={(event) =>
          setDuration(formatDuration(event.currentTarget.duration))
        }
      />
      {duration ? (
        <div
          className={`absolute bottom-2 right-2 rounded bg-black/80 px-1 text-xs text-white ${className}`}
        >
          {duration}
        </div>
      ) : null}
    </>
  );
}
