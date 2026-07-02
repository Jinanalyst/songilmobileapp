import { useState } from "react";
import { formatKRW, DEPOSIT } from "../data";

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
    desc: `원하는 서비스와 방문 날짜·시간을 캘린더에서 고르고, 예약금 ${formatKRW(
      DEPOSIT
    )}으로 일정을 확정해요. 잔금은 청소 완료 후 현장에서 결제합니다.`,
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
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i];

  return (
    <div className="app-shell">
      <div className="pad flex between center">
        <img src="logo-mark.svg" alt="" style={{ height: 28, width: 28 }} />
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
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          key={i}
          className="rise"
          style={{
            fontSize: "4.5rem",
            lineHeight: 1,
            marginBottom: 26,
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

      <div className="pad">
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
          onClick={() => (last ? onDone() : setI((v) => v + 1))}
        >
          {last ? "시작하기" : "다음"}
        </button>
      </div>
    </div>
  );
}
