import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Standard TanStack Start + Vite config (no third-party build wrappers), so the
// toolchain is self-contained and auditable for a bank submission. The server
// entry is redirected to src/server.ts (our SSR error wrapper); Nitro emits the
// server build (Cloudflare by default; set NITRO_PRESET for other targets).
export default defineConfig({
  server: { port: 8080 },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({ server: { entry: "server" } }),
    viteReact(),
  ],
});
