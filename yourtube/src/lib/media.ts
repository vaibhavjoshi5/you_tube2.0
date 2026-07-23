const backendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export const getMediaUrl = (path?: string) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${backendUrl}/${path.replace(/^\/+/, "")}`;
};
