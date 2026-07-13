// 추천(레퍼럴) 코드 저장·캡처 — 앱(WebView) localStorage 기반.
//   • 웹 추천 링크(?ref=코드)가 딥링크로 앱을 열면 그 코드를 저장한다.
//   • 예약 화면에서 사용자가 직접 붙여넣은 코드도 저장한다.
//   저장된 코드는 예약/파트너신청 API 호출 시 자동으로 함께 전송돼 서버가 적립한다.
const KEY = "songil_ref";

export function setRef(code: string): void {
  const c = (code || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{4,16}$/.test(c)) return;
  try {
    localStorage.setItem(KEY, c);
  } catch {
    /* noop */
  }
}

export function getStoredRef(): string {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

// URL 문자열에서 ?ref= 를 파싱해 저장 (딥링크·초기 URL 공용).
export function captureRefFromUrlString(url: string): void {
  try {
    const q = url.includes("?") ? url.split("?")[1].split("#")[0] : "";
    const ref = new URLSearchParams(q).get("ref");
    if (ref) setRef(ref);
  } catch {
    /* noop */
  }
}

// 앱 실행 시 추천 코드 유입 캡처 — 현재 URL(프리뷰/웹) + 네이티브 딥링크(콜드/런타임).
export async function initRefCapture(): Promise<void> {
  if (typeof window !== "undefined") captureRefFromUrlString(window.location.href);

  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return;

  const { App } = await import("@capacitor/app");
  // 콜드 스타트: 앱이 링크로 처음 열린 경우
  try {
    const launch = await App.getLaunchUrl();
    if (launch?.url) captureRefFromUrlString(launch.url);
  } catch {
    /* noop */
  }
  // 실행 중 딥링크 수신
  App.addListener("appUrlOpen", ({ url }) => captureRefFromUrlString(url));
}
