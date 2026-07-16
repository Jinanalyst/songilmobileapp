import { useEffect, useState } from "react";
import { COMPANY, serviceById, partnerById } from "../data";
import { useStore, type Role } from "../store";
import { AppBar } from "../components/ui";
import ProfileEdit from "./ProfileEdit";
import MyReservations from "./MyReservations";
import PartnerApply from "./PartnerApply";
import Referral from "./Referral";
import DeleteAccount from "./DeleteAccount";

const ROLE_LABEL: Record<Role, string> = {
  customer: "고객",
  business: "청소 파트너(업체)",
  guest: "둘러보는 중",
};
const PROVIDER_LABEL: Record<string, string> = {
  kakao: "카카오 로그인",
  google: "구글 로그인",
  email: "이메일 로그인",
  simple: "간편 로그인",
};

type View = "home" | "edit" | "reservations" | "apply" | "referral" | "delete";

function Avatar({ photo, name, size = 56 }: { photo: string; name: string; size?: number }) {
  if (photo) {
    return (
      <div style={{ height: size, width: size, borderRadius: 999, overflow: "hidden", flexShrink: 0 }}>
        <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div className="avatar acc-sky" style={{ height: size, width: size, borderRadius: 999 }}>
      {(name || "손")[0]}
    </div>
  );
}

export default function Account({
  onLogout,
  startApply = false,
}: {
  onLogout: () => void;
  startApply?: boolean;
}) {
  const { session, submissions, chooseRole, logout, clearPendingApply } = useStore();
  const [view, setView] = useState<View>(startApply ? "apply" : "home");

  // 온보딩에서 '업체' 선택으로 넘어온 경우 등록 화면을 한 번 열고 플래그를 해제
  useEffect(() => {
    if (startApply) clearPendingApply();
  }, [startApply, clearPendingApply]);

  if (view === "edit") return <ProfileEdit onBack={() => setView("home")} />;
  if (view === "reservations") return <MyReservations onBack={() => setView("home")} />;
  if (view === "apply") return <PartnerApply onBack={() => setView("home")} />;
  if (view === "referral") return <Referral onBack={() => setView("home")} />;
  if (view === "delete")
    return <DeleteAccount onBack={() => setView("home")} onDeleted={onLogout} />;

  async function handleLogout() {
    await logout();
    onLogout();
  }

  // 사업자 등록(파트너 심사 신청)을 한 적이 있어야 업체로 전환 가능.
  const registered = submissions.applications.length > 0;
  function pickRole(r: Role) {
    if (r === "business" && !registered) {
      // 아직 미등록 → 사업자 등록 화면으로 안내
      setView("apply");
      return;
    }
    chooseRole(r);
  }

  const recent = submissions.reservations.slice(0, 2);

  return (
    <div className="screen">
      <AppBar showLogo title="계정" />
      <div className="pad">
        {/* 프로필 카드 */}
        <div className="card lg card-pad">
          <div className="flex gap-12 center">
            <Avatar photo={session.photo} name={session.name} />
            <div className="grow" style={{ minWidth: 0 }}>
              <b style={{ fontSize: "1.1rem" }}>{session.name || "손길 회원"}</b>
              <p className="tiny muted" style={{ marginTop: 2 }}>
                {PROVIDER_LABEL[session.provider ?? ""] ?? "게스트"} · {ROLE_LABEL[session.role]}
              </p>
              {session.email && <p className="tiny muted">{session.email}</p>}
              {session.phone && <p className="tiny muted">{session.phone}</p>}
              {session.role === "customer" && session.address && (
                <p className="tiny muted">📍 {session.address} {session.addressDetail}</p>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-block" style={{ marginTop: 14 }} onClick={() => setView("edit")}>
            프로필 편집
          </button>
        </div>

        {/* 내 예약 페이지 진입 */}
        <button
          className="card lg card-pad flex gap-12 center"
          style={{ width: "100%", textAlign: "left", marginTop: 16 }}
          onClick={() => setView("reservations")}
        >
          <span className="tile">📅</span>
          <span className="grow">
            <b style={{ display: "block" }}>내 예약</b>
            <span className="small muted">예약 {submissions.reservations.length}건 · 진행 상태 확인</span>
          </span>
          <span style={{ color: "var(--ink-soft)" }}>›</span>
        </button>

        {/* 최근 예약 미리보기 */}
        {recent.length > 0 && (
          <div className="stack-sm" style={{ marginTop: 10 }}>
            {recent.map((r) => {
              const svc = serviceById(r.serviceId);
              const p = partnerById(r.partnerId);
              return (
                <div key={r.id} className="card card-pad flex between center" onClick={() => setView("reservations")} style={{ cursor: "pointer" }}>
                  <div className="flex center gap-8">
                    <span>{svc?.emoji}</span>
                    <span className="small"><b>{svc?.name}</b> · {r.date} {r.timeSlot}</span>
                  </div>
                  <span className="badge tone-pending"><span className="dot" />접수</span>
                </div>
              );
            })}
          </div>
        )}

        {/* 추천·제휴 파트너 */}
        <button
          className="card lg card-pad flex gap-12 center"
          style={{ width: "100%", textAlign: "left", marginTop: 16 }}
          onClick={() => setView("referral")}
        >
          <span className="tile">🎁</span>
          <span className="grow">
            <b style={{ display: "block" }}>추천·제휴 파트너</b>
            <span className="small muted">추천 링크 공유하고 견적의 3.5% 적립받기</span>
          </span>
          <span style={{ color: "var(--ink-soft)" }}>›</span>
        </button>

        {/* 이용 유형 */}
        <h3 style={{ fontWeight: 900, marginTop: 24 }}>이용 유형</h3>
        <p className="small muted" style={{ marginTop: 2 }}>언제든 다른 유형으로 바꿀 수 있어요.</p>
        <div className="opt-grid" style={{ marginTop: 10 }}>
          {(["customer", "business", "guest"] as Role[]).map((r) => (
            <button key={r} className={`opt${session.role === r ? " sel" : ""}`} onClick={() => pickRole(r)}>
              {ROLE_LABEL[r]}
              {r === "business" && !registered && " 🔒"}
            </button>
          ))}
        </div>
        {!registered && (
          <p className="tiny muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
            🔒 업체로 전환하려면 먼저 <b>사업자 등록(파트너 심사 신청)</b>이 필요해요. 업체를 선택하면 등록 화면으로 이동해요.
          </p>
        )}

        {/* 파트너 등록(심사) */}
        <button
          className="card lg card-pad flex gap-12 center"
          style={{ width: "100%", textAlign: "left", marginTop: 16 }}
          onClick={() => setView("apply")}
        >
          <span className="tile">🧹</span>
          <span className="grow">
            <b style={{ display: "block" }}>청소 업체로 등록하기</b>
            <span className="small muted">사업자 정보로 심사를 신청하고 파트너가 되세요.</span>
          </span>
          <span style={{ color: "var(--ink-soft)" }}>›</span>
        </button>

        {submissions.applications.length > 0 && (
          <div className="stack-sm" style={{ marginTop: 10 }}>
            {submissions.applications.map((a) => (
              <div key={a.id} className="card card-pad flex between center">
                <span className="small"><b>{a.companyName}</b> · {a.id}</span>
                <span className="badge tone-requested"><span className="dot" />접수</span>
              </div>
            ))}
          </div>
        )}

        {/* 고객센터 */}
        <h3 style={{ fontWeight: 900, marginTop: 24 }}>고객센터</h3>
        <div className="card card-pad" style={{ marginTop: 10 }}>
          <a href={`tel:${COMPANY.tel}`} className="price" style={{ fontSize: "1.3rem", textDecoration: "none" }}>{COMPANY.tel}</a>
          <p className="small muted" style={{ marginTop: 2 }}>운영시간 {COMPANY.hours}</p>
          <p className="small muted" style={{ marginTop: 2 }}>이메일 {COMPANY.email}</p>
          <hr className="hr" />
          <div className="tiny muted stack-sm">
            <p>상호 {COMPANY.bizName} · 서비스명 {COMPANY.service}</p>
            <p>대표자 {COMPANY.ceo}</p>
            <p>사업자등록번호 {COMPANY.bizNumber}</p>
            <p>{COMPANY.address}</p>
          </div>
        </div>

        <button className="btn btn-ghost btn-block" style={{ marginTop: 18 }} onClick={handleLogout}>로그아웃</button>
        <button
          style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)", fontSize: "0.85rem", textDecoration: "underline" }}
          onClick={() => setView("delete")}
        >
          회원 탈퇴
        </button>
        <p className="tiny muted center-text" style={{ marginTop: 14 }}>© 2026 {COMPANY.service} · {COMPANY.bizName}</p>
      </div>
    </div>
  );
}
