import { defineConfig } from "vite";
import Wat from "vite-plugin-wat";

export default defineConfig({
  plugins: [Wat()],
});
