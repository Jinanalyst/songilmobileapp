import { useState } from "react";

type Slide = {
  emoji: string;
  title: string;
  desc: string;
};

const SLIDES: Slide[] = [
  {
    emoji: "🧺",
    title: "검증된 동네 청소 업체 중개",
    desc: "손길은 사업자·신원·리뷰까지 확인한 청소 파트너를 연결해 드리는 청소 예약 중개 플랫폼이에요.",
  },
  {
    emoji: "📅",
    title: "날짜만 고르면 예약 끝",
    desc: `원하는 서비스와 방문 날짜·시간을 캘린더에서 고르고, 예약금(견적의 7%)으로 일정을 확정해요. 잔금은 청소 완료 후 현장에서 결제합니다.`,
  },
  {
    emoji: "💬",
    title: "궁금하면 바로 상담",
    desc: "견적이 고민되면 카카오톡 채널이나 전화로 편하게 물어보세요. 무료로 방문·상담 후 합의된 견적을 안내드려요.",
  },
  {
    emoji: "🧹",
    title: "청소 업체도 함께해요",
    desc: "청소 업체라면 파트너로 등록해 심사를 받고, 손길을 통해 고객 예약을 연결받을 수 있어요.",
  },
];

export default function Intro({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  // 빠른 연타로 인덱스가 범위를 넘어가도(=undefined 슬라이드) 크래시하지 않게 clamp
  const idx = Math.min(i, SLIDES.length - 1);
  const last = idx === SLIDES.length - 1;
  const s = SLIDES[idx];

  return (
    // 한 화면에 담기는 인트로: 뷰포트 높이로 고정하고, 넘치면 가운데 영역만
    // 내부 스크롤 → 상단 로고·하단 버튼은 항상 화면에 보이게 고정된다.
    <div className="app-shell" style={{ height: "100dvh" }}>
      <div
        className="pad flex between center"
        style={{
          flexShrink: 0,
          paddingTop: "calc(20px + env(safe-area-inset-top))",
        }}
      >
        <img src="logo-mark.png" alt="" style={{ height: 28, width: 28 }} />
        <button
          className="tiny muted"
          style={{ border: "none", background: "transparent" }}
          onClick={onDone}
        >
          건너뛰기
        </button>
      </div>

      <div
        className="pad"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "safe center",
          textAlign: "center",
        }}
      >
        <div
          key={i}
          className="rise"
          style={{
            fontSize: "clamp(3rem, 14vh, 4.5rem)",
            lineHeight: 1,
            marginBottom: "clamp(12px, 3vh, 26px)",
          }}
        >
          {s.emoji}
        </div>
        <h1 key={`t${i}`} className="title-xl rise" style={{ fontSize: "1.6rem" }}>
          {s.title}
        </h1>
        <p key={`d${i}`} className="sub rise" style={{ maxWidth: 340, margin: "12px auto 0" }}>
          {s.desc}
        </p>
      </div>

      <div
        className="pad"
        style={{
          flexShrink: 0,
          paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex center" style={{ justifyContent: "center", gap: 7, marginBottom: 18 }}>
          {SLIDES.map((_, idx) => (
            <span
              key={idx}
              style={{
                height: 7,
                width: idx === i ? 22 : 7,
                borderRadius: 999,
                background: idx === i ? "var(--brand)" : "var(--line)",
                transition: "all 0.2s",
              }}
            />
          ))}
        </div>
        <button
          className="btn btn-brand btn-block"
          onClick={() => (last ? onDone() : setI((v) => Math.min(v + 1, SLIDES.length - 1)))}
        >
          {last ? "시작하기" : "다음"}
        </button>
      </div>
    </div>
  );
}
