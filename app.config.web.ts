import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "FilmContract",
  slug: "filmcontract",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "automatic",
  extra: {
    apiUrl: process.env.API_URL || "https://3000-ia6sbgycqgi78h1m3wxmm-268d213c.us2.manus.computer",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
