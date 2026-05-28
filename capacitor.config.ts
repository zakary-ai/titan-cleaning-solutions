import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.deleoai.titansolution",
  appName: "Titan Solutions",
  webDir: "dist",
  // Load the live Lovable-hosted web app so updates ship instantly
  // without an App Store re-submission for every change.
  server: {
    url: "https://titan-cleaning-solutions.lovable.app",
    cleartext: false,
  },
  ios: {
    contentInset: "never",
    backgroundColor: "#0b0b0b",
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0b0b0b",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0b0b0b",
    },
  },
};

export default config;
