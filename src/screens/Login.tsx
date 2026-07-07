import { useState } from "react";
import { useStore } from "../store";
import { signInWithOAuth } from "../oauth";

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#191600"
        d="M12 3C6.48 3 2 6.48 2 10.77c0 2.77 1.86 5.2 4.65 6.57-.2.72-.74 2.66-.85 3.07-.13.51.19.5.4.37.16-.11 2.6-1.77 3.66-2.49.7.1 1.42.16 2.14.16 5.52 0 10-3.48 10-7.68C22 6.48 17.52 3 12 3z"
      />
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function Login() {
  const { guestBrowse } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function oauth(provider: "google" | "kakao") {
    setBusy(provider);
    setError(null);
    try {
      await signInWithOAuth(provider);
      // 성공 시 시스템 브라우저 인증 → 딥링크 콜백으로 세션이 설정되고 화면 전환됨.
    } catch {
      setError("로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setBusy(null);
    }
  }

  return (
    <div className="app-shell">
      <div className="pad" style={{ paddingTop: "12vh" }}>
        <div className="center-text">
          <img src="logo-mark.svg" alt="손길" style={{ height: 64, width: 64, margin: "0 auto", display: "block" }} />
          <h1 className="title-xl" style={{ marginTop: 14 }}>손길 시작하기</h1>
          <p className="sub small">
            카카오 또는 구글 계정으로 3초 만에
            <br />
            가입하고 바로 시작하세요.
          </p>
        </div>

        <div className="card lg card-pad" style={{ marginTop: 24 }}>
          <button className="btn btn-kakao btn-block" disabled={busy !== null} onClick={() => oauth("kakao")}>
            <KakaoIcon />
            {busy === "kakao" ? "카카오로 이동 중…" : "카카오로 시작하기"}
          </button>
          <button className="btn btn-google btn-block" style={{ marginTop: 12 }} disabled={busy !== null} onClick={() => oauth("google")}>
            <GoogleIcon />
            {busy === "google" ? "구글로 이동 중…" : "Google로 시작하기"}
          </button>

          {error && <p className="error-box" style={{ marginTop: 14 }}>{error}</p>}

          <p className="tiny muted center-text" style={{ marginTop: 16, lineHeight: 1.6 }}>
            처음이면 자동으로 회원가입되고, 이미 계정이 있으면 로그인돼요.
          </p>
        </div>

        <button
          onClick={guestBrowse}
          style={{ border: "none", background: "transparent", display: "block", margin: "18px auto 0", color: "var(--ink-soft)", fontWeight: 700, fontSize: "0.85rem" }}
        >
          로그인 없이 둘러보기 →
        </button>
        <p className="tiny muted center-text" style={{ marginTop: 12, lineHeight: 1.6 }}>
          계속 진행하면 손길 이용약관 및 개인정보 처리방침에
          <br />
          동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}
