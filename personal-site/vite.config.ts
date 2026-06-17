import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const FUNCTIONS_BASE =
  "https://us-east1-solanavote-devnet.cloudfunctions.net";

export default defineConfig({
  server: {
    host: "::",
    port: 8082,
    proxy: {
      "/api/personalChat": {
        target: FUNCTIONS_BASE,
        changeOrigin: true,
        rewrite: () => "/personalChat",
      },
      "/api/personalContact": {
        target: FUNCTIONS_BASE,
        changeOrigin: true,
        rewrite: () => "/personalContact",
      },
    },
  },
  plugins: [react()],
});
