export interface UserLocation {
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

const southernStates = new Set([
  "tamil nadu",
  "kerala",
  "karnataka",
  "andhra pradesh",
  "telangana",
]);

export const isSouthernState = (state = "") =>
  southernStates.has(state.trim().toLowerCase());

export const getCurrentLocation = (): Promise<UserLocation> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const endpoint =
            process.env.NEXT_PUBLIC_REVERSE_GEOCODE_URL ||
            "https://api.bigdatacloud.net/data/reverse-geocode-client";
          const url = new URL(endpoint);
          url.searchParams.set("latitude", String(coords.latitude));
          url.searchParams.set("longitude", String(coords.longitude));
          url.searchParams.set("localityLanguage", "en");
          const response = await fetch(url);
          if (!response.ok) throw new Error("Unable to resolve city");
          const data = await response.json();

          resolve({
            city: data.city || data.locality || data.localityInfo?.administrative?.[2]?.name,
            state: data.principalSubdivision,
            country: data.countryName || "India",
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        } catch (error) {
          reject(error);
        }
      },
      () => reject(new Error("Location permission was not granted")),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5 * 60 * 1000,
      }
    );
  });

export const shouldUseDarkTheme = (state = "") => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  return !(isSouthernState(state) && hour >= 10 && hour < 12);
};
