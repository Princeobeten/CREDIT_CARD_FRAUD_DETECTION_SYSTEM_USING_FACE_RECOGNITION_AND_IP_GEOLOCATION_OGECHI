import "server-only";

// Centralised, validated access to server-side secrets.
// NEVER prefix these with NEXT_PUBLIC_ — they must not reach the browser bundle.

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Add it to web/.env.local (see web/.env.example).`,
    );
  }
  return value;
}

export const env = {
  get mongodbUri() {
    return required("MONGODB_URI");
  },
  get sessionSecret() {
    return required("SESSION_SECRET");
  },
  // Optional: base URL for the IP geolocation provider. Defaults to ipapi.co (no key needed).
  get geoApiBase() {
    return process.env.GEO_API_BASE?.trim() || "https://ipapi.co";
  },
};
