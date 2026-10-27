import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [react()],
  resolve: {
    // The product carousel is shared from personal-site/ (dagangilat.com):
    // its imports must use this package's copies, never a second React.
    dedupe: ["react", "react-dom", "lucide-react"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
