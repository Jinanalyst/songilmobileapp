import { useState } from "react";
import { useStore } from "../store";
import { supabase } from "../supabase";
import { deleteAccount } from "../api";
import { AppBar } from "../components/ui";

// 회원 탈퇴(계정 삭제) 화면.
//  · 소셜/이메일 로그인: 사이트 API 로 서버 계정·개인정보를 파기한 뒤 로컬 데이터 삭제.
//  · 간편/게스트 로그인: 서버 계정이 없으므로 이 기기의 로컬 데이터만 삭제.
export default function DeleteAccount({
  onBack,
  onDeleted,
}: {
  onBack: () => void;
  onDeleted: () => void;
}) {
  const { session, resetLocalData } = useStore();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 서버에 실제 인증 계정이 있는 로그인 방식(소셜/이메일)인지 여부.
  const hasServerAccount =
    session.provider === "google" ||
    session.provider === "kakao" ||
    session.provider === "email";

  async function confirmDelete() {
    if (!agreed || busy) return;
    setBusy(true);
    setError("");
    try {
      // 로그인 토큰이 있으면(소셜/이메일) 서버 계정·개인정보부터 파기.
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        await deleteAccount();
      }
      // 이 기기의 세션·제출 내역 모두 삭제 + 로그아웃.
      await resetLocalData();
      onDeleted();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "계정 삭제에 실패했어요. 잠시 후 다시 시도해 주세요."
      );
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <AppBar onBack={onBack} title="회원 탈퇴" />
      <div className="pad">
        <div className="card lg card-pad">
          <h3 style={{ fontWeight: 900, color: "var(--rose-600)" }}>
            정말 탈퇴하시겠어요?
          </h3>
          <p className="small muted" style={{ marginTop: 8, lineHeight: 1.7 }}>
            계정을 삭제하면 다음 정보가 처리되며, <b>되돌릴 수 없어요.</b>
          </p>
          <ul
            className="small"
            style={{ marginTop: 12, paddingLeft: 18, lineHeight: 1.9 }}
          >
            <li>이름·연락처·주소 등 <b>개인정보 즉시 삭제</b></li>
            <li>작성한 후기·프로필 삭제</li>
            <li>
              예약·상담 등 결제/계약 기록은 「전자상거래법」에 따라 5년간 보관되며,
              개인정보는 지우고 계정 연결만 해제해요.
            </li>
            {hasServerAccount && (
              <li>동일 계정({session.provider === "kakao" ? "카카오" : session.provider === "google" ? "구글" : "이메일"})으로는 다시 로그인할 수 없어요.</li>
            )}
          </ul>
          <p className="tiny muted" style={{ marginTop: 12, lineHeight: 1.7 }}>
            문의가 필요하면 탈퇴 전에 고객센터로 연락해 주세요.
          </p>
        </div>

        <label
          className="flex center gap-8"
          style={{ marginTop: 18, cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span className="small">위 내용을 확인했으며 계정을 삭제합니다.</span>
        </label>

        {error && (
          <p
            className="small"
            style={{ color: "var(--rose-600)", marginTop: 12 }}
          >
            {error}
          </p>
        )}

        <button
          className="btn btn-block"
          style={{
            marginTop: 16,
            background: "var(--rose-600)",
            color: "#fff",
          }}
          disabled={!agreed || busy}
          onClick={confirmDelete}
        >
          {busy ? "삭제 중…" : "계정 영구 삭제"}
        </button>
        <button
          className="btn btn-ghost btn-block"
          style={{ marginTop: 10 }}
          disabled={busy}
          onClick={onBack}
        >
          취소
        </button>
      </div>
    </div>
  );
}
