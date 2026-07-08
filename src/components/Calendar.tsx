import { useState } from "react";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export type DateStatus = "open" | "some" | "full";

export default function Calendar({
  value,
  onChange,
  minDate,
  monthsAhead = 6,
  dateStatus,
}: {
  value: string;
  onChange: (date: string) => void;
  minDate: Date; // 예약 가능한 최소 날짜 (자정 기준)
  monthsAhead?: number; // 앞으로 이동 가능한 개월 수
  dateStatus?: (dateStr: string) => DateStatus; // 날짜별 예약 가능 상태
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [view, setView] = useState(() => ({
    y: minDate.getFullYear(),
    m: minDate.getMonth(),
  }));

  const viewStart = new Date(view.y, view.m, 1);
  const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const maxMonth = new Date(today.getFullYear(), today.getMonth() + monthsAhead, 1);

  const prevDisabled = viewStart <= minMonth;
  const nextDisabled = viewStart >= maxMonth;

  const startWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function go(delta: number) {
    const nm = new Date(view.y, view.m + delta, 1);
    setView({ y: nm.getFullYear(), m: nm.getMonth() });
  }

  return (
    <div className="card lg card-pad" style={{ marginTop: 14 }}>
      {/* 월 헤더 */}
      <div className="flex between center">
        <button
          onClick={() => go(-1)}
          disabled={prevDisabled}
          aria-label="이전 달"
          style={{
            border: "none",
            background: "transparent",
            fontSize: "1.3rem",
            color: prevDisabled ? "var(--line)" : "var(--ink)",
            padding: "4px 10px",
          }}
        >
          ‹
        </button>
        <b style={{ fontSize: "1.05rem" }}>
          {view.y}년 {view.m + 1}월
        </b>
        <button
          onClick={() => go(1)}
          disabled={nextDisabled}
          aria-label="다음 달"
          style={{
            border: "none",
            background: "transparent",
            fontSize: "1.3rem",
            color: nextDisabled ? "var(--line)" : "var(--ink)",
            padding: "4px 10px",
          }}
        >
          ›
        </button>
      </div>

      {/* 요일 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginTop: 10 }}>
        {WEEK.map((w, i) => (
          <div
            key={w}
            className="tiny"
            style={{
              textAlign: "center",
              fontWeight: 700,
              padding: "4px 0",
              color: i === 0 ? "var(--rose-600)" : i === 6 ? "var(--brand)" : "var(--ink-soft)",
            }}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 날짜 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 4 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={`b${i}`} />;
          const date = new Date(view.y, view.m, d);
          const key = ymd(date);
          const beforeMin = date < minDate;
          const status = !beforeMin && dateStatus ? dateStatus(key) : "open";
          const isFull = status === "full";
          const disabled = beforeMin || isFull;
          const selected = !!value && sameDay(date, new Date(`${value}T00:00:00`));
          const weekday = date.getDay();
          const dotColor =
            status === "some"
              ? "var(--amber-400)"
              : status === "full"
              ? "var(--rose-400)"
              : "var(--emerald-400)";
          return (
            <button
              key={d}
              onClick={() => !disabled && onChange(key)}
              disabled={disabled}
              style={{
                aspectRatio: "1",
                border: "none",
                borderRadius: 12,
                background: selected ? "var(--brand)" : "transparent",
                color: beforeMin
                  ? "var(--line)"
                  : selected
                  ? "#fff"
                  : isFull
                  ? "var(--ink-soft)"
                  : weekday === 0
                  ? "var(--rose-600)"
                  : "var(--ink)",
                fontWeight: selected ? 800 : 600,
                fontSize: "0.9rem",
                position: "relative",
                textDecoration: isFull ? "line-through" : "none",
                cursor: disabled ? "default" : "pointer",
              }}
            >
              {d}
              {!beforeMin && !selected && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 5,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: dotColor,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex gap-12" style={{ marginTop: 10, flexWrap: "wrap" }}>
        <span className="tiny muted flex center gap-6">
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--emerald-400)" }} /> 여유
        </span>
        <span className="tiny muted flex center gap-6">
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--amber-400)" }} /> 일부 예약
        </span>
        <span className="tiny muted flex center gap-6">
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--rose-400)" }} /> 마감
        </span>
      </div>
      <p className="tiny muted" style={{ marginTop: 6 }}>
        예약은 <b>{ymd(minDate).replace(/-/g, ".")}</b>부터 가능해요 (당일·긴급 예약 제외).
      </p>
    </div>
  );
}
