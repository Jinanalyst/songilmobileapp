// 구글/카카오 OAuth (Supabase). 네이티브 앱에서는 시스템 브라우저 + 딥링크로 콜백을 받고,
// 웹(개발 프리뷰)에서는 표준 리디렉트를 사용한다.
import { Capacitor } from "@capacitor/core";
import { supabase } from "./supabase";
import { APP_REDIRECT } from "./config";

// ── 이메일/비밀번호 회원가입 ──
// 반환: { needsConfirm: true } 이면 이메일 인증 후 로그인 필요(Supabase에서 이메일 확인 ON).
//       { needsConfirm: false } 이면 즉시 세션 발급 → onAuthStateChange 가 로그인 처리.
export async function signUpEmail(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) throw error;
  return { needsConfirm: !data.session };
}

// ── 이메일/비밀번호 로그인 ──
export async function signInEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signInWithOAuth(provider: "google" | "kakao") {
  const native = Capacitor.isNativePlatform();

  if (!native) {
    // 웹: 현재 오리진으로 리디렉트 (Supabase Redirect URLs 에 오리진 등록 필요)
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    return;
  }

  // 네이티브: 앱 딥링크로 콜백
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: APP_REDIRECT, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (data?.url) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: data.url });
  }
}

// 앱이 딥링크(online.handway.app://auth/callback?...)로 열릴 때 세션 교환.
export async function initDeepLinkAuth() {
  if (!Capacitor.isNativePlatform()) return;
  const { App } = await import("@capacitor/app");
  const { Browser } = await import("@capacitor/browser");
  App.addListener("appUrlOpen", async ({ url }) => {
    if (!url.includes("auth/callback")) return;
    // 시스템 브라우저(커스텀 탭) 닫기
    try {
      await Browser.close();
    } catch {
      /* noop */
    }
    try {
      // PKCE 흐름: ?code=... / 구형 흐름: #access_token=...&refresh_token=...
      const q = url.split("?")[1]?.split("#")[0] ?? "";
      const params = new URLSearchParams(q);
      const code = params.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        return;
      }
      const hash = url.split("#")[1] ?? "";
      const hp = new URLSearchParams(hash);
      const access_token = hp.get("access_token");
      const refresh_token = hp.get("refresh_token");
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    } catch {
      /* onAuthStateChange 가 반영, 실패 시 로그인 화면 유지 */
    }
  });
}
