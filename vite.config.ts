import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["effector/babel-plugin"],
        babelrc: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@lib": path.resolve(__dirname, "./src/lib"),
    },
  },
});
