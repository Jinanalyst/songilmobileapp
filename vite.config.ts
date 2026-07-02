import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Capacitor는 www 자산을 상대 경로로 로드하므로 base를 "" 로 둔다.
// 개발 프리뷰에서는 handway.online API 를 /api 로 프록시해 CORS 없이 호출한다.
// (실제 안드로이드 앱은 CapacitorHttp 가 CORS를 우회한다.)
export default defineConfig({
  plugins: [react()],
  base: "",
  build: {
    outDir: "dist",
  },
  server: {
    proxy: {
      "/api": {
        target: "https://www.handway.online",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
