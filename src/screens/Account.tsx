import { COMPANY, serviceById, partnerById } from "../data";
import { useStore, type Role } from "../store";
import { AppBar } from "../components/ui";

const ROLE_LABEL: Record<Role, string> = {
  customer: "고객",
  business: "청소 파트너(업체)",
  guest: "둘러보는 중",
};
const PROVIDER_LABEL: Record<string, string> = {
  kakao: "카카오 로그인",
  google: "구글 로그인",
  simple: "간편 로그인",
};

export default function Account({
  onLogout,
  onOpenApply,
}: {
  onLogout: () => void;
  onOpenApply: () => void;
}) {
  const { session, submissions, chooseRole, logout } = useStore();

  async function handleLogout() {
    await logout();
    onLogout();
  }

  return (
    <div className="screen">
      <AppBar showLogo title="계정" />
      <div className="pad">
        {/* 프로필 */}
        <div className="card lg card-pad flex gap-12 center">
          <div className="avatar acc-sky" style={{ height: 56, width: 56 }}>
            {(session.name || "손")[0]}
          </div>
          <div className="grow" style={{ minWidth: 0 }}>
            <b style={{ fontSize: "1.1rem" }}>{session.name || "손길 회원"}</b>
            <p className="tiny muted" style={{ marginTop: 2 }}>
              {PROVIDER_LABEL[session.provider ?? ""] ?? "게스트"} · {ROLE_LABEL[session.role]}
            </p>
            {session.email && <p className="tiny muted">{session.email}</p>}
            {session.phone && <p className="tiny muted">{session.phone}</p>}
          </div>
        </div>

        {/* 이용 유형 전환 */}
        <h3 style={{ fontWeight: 900, marginTop: 22 }}>이용 유형</h3>
        <p className="small muted" style={{ marginTop: 2 }}>언제든 다른 유형으로 바꿀 수 있어요.</p>
        <div className="opt-grid" style={{ marginTop: 10 }}>
          {(["customer", "business", "guest"] as Role[]).map((r) => (
            <button key={r} className={`opt${session.role === r ? " sel" : ""}`} onClick={() => chooseRole(r)}>
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>

        {/* 파트너 등록(심사) */}
        <button
          className="card lg card-pad flex gap-12 center"
          style={{ width: "100%", textAlign: "left", marginTop: 16 }}
          onClick={onOpenApply}
        >
          <span className="tile">🧹</span>
          <span className="grow">
            <b style={{ display: "block" }}>청소 업체로 등록하기</b>
            <span className="small muted">사업자 정보로 심사를 신청하고 파트너가 되세요.</span>
          </span>
          <span style={{ color: "var(--ink-soft)" }}>›</span>
        </button>

        {/* 내 예약 */}
        <h3 style={{ fontWeight: 900, marginTop: 24 }}>내 예약 {submissions.reservations.length}건</h3>
        {submissions.reservations.length === 0 ? (
          <p className="small muted" style={{ marginTop: 8 }}>아직 예약이 없어요. 예약 탭에서 청소를 예약해 보세요.</p>
        ) : (
          <div className="stack" style={{ marginTop: 10 }}>
            {submissions.reservations.map((r) => {
              const svc = serviceById(r.serviceId);
              const p = partnerById(r.partnerId);
              return (
                <div key={r.id} className="card card-pad">
                  <div className="flex between center wrap gap-8">
                    <b>{r.id}</b>
                    <span className="badge tone-pending"><span className="dot" />접수 완료</span>
                  </div>
                  <p className="small muted" style={{ marginTop: 8 }}>
                    {svc?.emoji} {svc?.name} · {r.date} {r.timeSlot}
                    {p ? ` · ${p.name}` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* 내 상담·신청 (파트너) */}
        {submissions.applications.length > 0 && (
          <>
            <h3 style={{ fontWeight: 900, marginTop: 24 }}>파트너 심사 신청 {submissions.applications.length}건</h3>
            <div className="stack" style={{ marginTop: 10 }}>
              {submissions.applications.map((a) => (
                <div key={a.id} className="card card-pad">
                  <div className="flex between center wrap gap-8">
                    <b>{a.id}</b>
                    <span className="badge tone-requested"><span className="dot" />접수 완료</span>
                  </div>
                  <p className="small muted" style={{ marginTop: 8 }}>{a.companyName} · {a.services.join(", ")}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 고객센터·사업자 정보 */}
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
            <p>통신판매업 신고번호 {COMPANY.mailOrderNumber}</p>
            <p>{COMPANY.address}</p>
          </div>
        </div>

        <p className="notice" style={{ marginTop: 14 }}>
          손길은 고객과 청소 파트너를 연결하는 청소 예약 중개 플랫폼입니다. 청소 서비스는
          제휴 청소 파트너가 수행하며, 손길은 예약 접수·일정 조율·파트너 배정·고객 응대 및
          예약 관리를 제공합니다.
        </p>

        <button className="btn btn-ghost btn-block" style={{ marginTop: 18 }} onClick={handleLogout}>로그아웃</button>
        <p className="tiny muted center-text" style={{ marginTop: 14 }}>© 2026 {COMPANY.service} · {COMPANY.bizName}</p>
      </div>
    </div>
  );
}
