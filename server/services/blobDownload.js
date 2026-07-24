const PUBLIC_BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

export const getPublicBlobDownloadUrl = (filepath) => {
  try {
    const url = new URL(filepath);
    if (
      url.protocol !== "https:" ||
      !url.hostname.endsWith(PUBLIC_BLOB_HOST_SUFFIX)
    ) {
      return null;
    }

    url.searchParams.set("download", "1");
    return url.toString();
  } catch {
    return null;
  }
};
