import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "online.handway.app",
  appName: "손길",
  webDir: "dist",
  backgroundColor: "#fbfaf7",
  // 주의: CapacitorHttp 전역 fetch 패치는 supabase-js 인증 통신을 깨뜨릴 수 있어
  // 사용하지 않는다. handway.online API 호출은 api.ts 에서 CapacitorHttp.request 로
  // 명시적으로 네이티브 호출(CORS 회피)한다.
};

export default config;
