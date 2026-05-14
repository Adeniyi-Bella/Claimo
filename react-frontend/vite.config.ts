import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,

  },
  optimizeDeps: {
    // Keep these excluded to prevent Vite from messing with the internal WASM logic
    exclude: ['@thatopen/components', '@thatopen/fragments', 'web-ifc']
  },
   build: {
    target: "esnext"
  }
});
