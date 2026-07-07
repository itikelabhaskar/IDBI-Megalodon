import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

// Standard TanStack Start + Vite config (no third-party build wrappers), so the
// toolchain is self-contained and auditable for a bank submission. The server
// entry is redirected to src/server.ts (our SSR error wrapper). Nitro emits the
// deployable server build: it targets Vercel by default and auto-detects the
// Vercel CI environment; override with NITRO_PRESET (e.g. `cloudflare-module`,
// `node-server`, `aws-lambda`) for other hosts.
export default defineConfig({
  server: { port: 8080 },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({ server: { entry: "server" } }),
    nitro({ preset: process.env.NITRO_PRESET || "vercel", noExternals: true }),
    viteReact(),
  ],
});
