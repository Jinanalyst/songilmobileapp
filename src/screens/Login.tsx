import { useState } from "react";
import { useStore } from "../store";
import { signInWithOAuth } from "../oauth";
import { Field } from "../components/ui";

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
  const { loginSimple } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validPhone = /\d{3}.?\d{3,4}.?\d{4}/.test(phone);
  const canSimple = name.trim().length > 0 && validPhone;

  async function oauth(provider: "google" | "kakao") {
    setBusy(provider);
    setError(null);
    try {
      await signInWithOAuth(provider);
      // 성공 시 리디렉트/딥링크로 세션이 설정되고 store 가 반영한다.
    } catch {
      setError(
        "소셜 로그인을 시작하지 못했어요. 간편 로그인으로 시작하거나 잠시 후 다시 시도해 주세요."
      );
      setBusy(null);
    }
  }

  return (
    <div className="app-shell">
      <div className="pad" style={{ paddingTop: "8vh" }}>
        <div className="center-text">
          <img
            src="logo-mark.svg"
            alt="손길"
            style={{ height: 60, width: 60, margin: "0 auto", display: "block" }}
          />
          <h1 className="title-xl" style={{ marginTop: 14 }}>
            손길 시작하기
          </h1>
          <p className="sub small">
            이름과 연락처만 넣으면 바로 시작할 수 있어요.
          </p>
        </div>

        <div className="card lg card-pad" style={{ marginTop: 20 }}>
          <Field label="이름" required>
            <input
              className="input"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="연락처" required>
            <input
              className="input"
              inputMode="tel"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <button
            className="btn btn-brand btn-block"
            disabled={!canSimple || busy !== null}
            onClick={() => {
              setBusy("simple");
              loginSimple(name, phone);
            }}
          >
            간편하게 시작하기
          </button>

          <div className="flex center gap-10" style={{ margin: "18px 0 14px" }}>
            <span className="grow" style={{ height: 1, background: "var(--line)" }} />
            <span className="tiny muted">또는 소셜 계정으로</span>
            <span className="grow" style={{ height: 1, background: "var(--line)" }} />
          </div>

          <button
            className="btn btn-kakao btn-block"
            disabled={busy !== null}
            onClick={() => oauth("kakao")}
          >
            <KakaoIcon />
            {busy === "kakao" ? "카카오로 이동 중…" : "카카오로 계속하기"}
          </button>
          <button
            className="btn btn-google btn-block"
            style={{ marginTop: 10 }}
            disabled={busy !== null}
            onClick={() => oauth("google")}
          >
            <GoogleIcon />
            {busy === "google" ? "구글로 이동 중…" : "Google 계정으로 계속하기"}
          </button>

          {error && (
            <p className="error-box" style={{ marginTop: 14 }}>
              {error}
            </p>
          )}
        </div>

        <p className="tiny muted center-text" style={{ marginTop: 16, lineHeight: 1.6 }}>
          계속 진행하면 손길 이용약관 및 개인정보 처리방침에
          <br />
          동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}
