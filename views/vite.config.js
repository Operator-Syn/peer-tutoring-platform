import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default ({ mode }) => {

  const rootDir = path.resolve(__dirname, "..");


  const env = loadEnv(mode, rootDir, "");

  const allowedHosts = env.ALLOWED_HOSTS?.split(",") || [];
  const apiTarget = env.VITE_API_BASE_URL || "http://localhost:5000";

  return defineConfig({
    plugins: [react()],


    envDir: rootDir,

    build: {
      outDir: "dist",
      emptyOutDir: true,
    },

    server: {
      host: true,
      allowedHosts,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  });
};
