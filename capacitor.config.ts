import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "online.handway.songil",
  appName: "손길",
  webDir: "dist",
  backgroundColor: "#fbfaf7",
  plugins: {
    // 원격 API(handway.online) 호출 시 WebView CORS 제약을 피하도록
    // fetch/XHR 를 네이티브 HTTP 로 패치한다.
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
