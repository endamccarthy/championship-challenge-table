import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/championship-challenge-leaderboard/",
  plugins: [preact()],
});
