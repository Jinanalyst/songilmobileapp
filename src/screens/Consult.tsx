import { AppBar } from "../components/ui";
import { KAKAO_CHANNEL, SUPPORT_TEL } from "../config";
import { COMPANY, SERVICE_INFO, formatKRW } from "../data";

async function openExternal(url: string) {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url });
      return;
    }
  } catch {
    /* noop */
  }
  window.open(url, "_blank");
}

export default function Consult() {
  return (
    <div className="screen">
      <AppBar showLogo title="상담하기" />
      <div className="pad">
        <p className="eyebrow">무료 견적 상담</p>
        <h1 className="title-xl">궁금한 점, 편하게 물어보세요</h1>
        <p className="sub">
          청소 범위나 예상 비용이 고민되시나요? 카카오톡 채널이나 전화로 상담원과 바로
          이야기할 수 있어요. 상담은 무료이고, 온라인 선결제도 필요 없어요.
        </p>

        {/* 카카오 상담 */}
        <button
          className="card lg card-pad flex gap-12 center"
          style={{ width: "100%", textAlign: "left", marginTop: 20 }}
          onClick={() => openExternal(KAKAO_CHANNEL)}
        >
          <span className="tile" style={{ background: "#fee500" }}>💬</span>
          <span className="grow">
            <b style={{ display: "block", fontSize: "1.05rem" }}>카카오톡으로 상담하기</b>
            <span className="small muted">
              손길 카카오톡 채널에서 실시간으로 문의해요.
            </span>
          </span>
          <span style={{ color: "var(--ink-soft)" }}>›</span>
        </button>

        {/* 전화 상담 */}
        <a
          className="card lg card-pad flex gap-12 center"
          style={{ width: "100%", textAlign: "left", marginTop: 12, textDecoration: "none", color: "inherit" }}
          href={`tel:${SUPPORT_TEL}`}
        >
          <span className="tile" style={{ background: "var(--brand-50)" }}>📞</span>
          <span className="grow">
            <b style={{ display: "block", fontSize: "1.05rem" }}>전화로 상담하기</b>
            <span className="small muted">
              {SUPPORT_TEL} · {COMPANY.hours}
            </span>
          </span>
          <span style={{ color: "var(--ink-soft)" }}>›</span>
        </a>

        {/* 서비스별 시작가 안내 */}
        <h3 style={{ fontWeight: 900, marginTop: 26 }}>서비스별 예상 시작가</h3>
        <p className="small muted" style={{ marginTop: 2 }}>
          최종 금액은 공간 크기·오염도·요청사항에 따라 방문·상담 후 확정돼요.
        </p>
        <div className="card" style={{ marginTop: 12, overflow: "hidden" }}>
          {SERVICE_INFO.map((s, i) => (
            <div
              key={s.name}
              className="flex between center"
              style={{
                padding: "14px 16px",
                borderTop: i === 0 ? "none" : "1px solid var(--line)",
              }}
            >
              <div>
                <b className="small">{s.name}</b>
                <p className="tiny muted" style={{ marginTop: 2 }}>
                  {s.desc}
                </p>
              </div>
              <span className="price small" style={{ whiteSpace: "nowrap" }}>
                {formatKRW(s.startPrice)}~
              </span>
            </div>
          ))}
        </div>

        <div className="notice-info" style={{ marginTop: 16 }}>
          <span>💡</span>
          <span>
            바로 예약을 원하시면 <b>예약 탭</b>에서 날짜를 골라 예약금
            {" "}{formatKRW(30000)}으로 확정할 수 있어요.
          </span>
        </div>
      </div>
    </div>
  );
}
