import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for Titan Solutions.
 *
 * Strategy: this app uses TanStack Start (SSR + server functions), so we do
 * NOT bundle the web app statically into the native shell. Instead the native
 * app loads the live published Lovable URL. All server functions, auth, and
 * Supabase access keep working with zero changes.
 *
 * Trade-off: the app needs an internet connection to launch. For full offline
 * support you would need to migrate to a SPA build and use @capacitor/preferences
 * for caching.
 */
const config: CapacitorConfig = {
  appId: "com.titancleaning.app",
  appName: "Titan Solutions",
  // webDir is required by Capacitor even when using server.url. Point it at a
  // small fallback directory so `npx cap sync` doesn't error.
  webDir: "public",
  server: {
    // Loads the live published site. Update this if you change your domain.
    url: "https://titan-cleaning-solutions.lovable.app",
    cleartext: false,
    // Allow navigation to your Supabase + auth endpoints.
    allowNavigation: [
      "*.lovable.app",
      "*.supabase.co",
      "accounts.google.com",
    ],
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0d0d0d",
  },
  android: {
    backgroundColor: "#0d0d0d",
  },
};

export default config;
