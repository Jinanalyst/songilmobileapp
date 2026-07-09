import { useMemo, useState } from "react";
import { serviceById, formatKRW } from "../data";
import { computeEstimate, DIFFICULTY } from "../pricing";
import {
  JOB_STATUS_META,
  type JobStatus,
  type PartnerJob,
  type PartnerJobsApi,
} from "../partner";
import { AppBar, Field, Tracker } from "../components/ui";
import MessageThread from "../components/MessageThread";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const JOB_FLOW: JobStatus[] = ["new", "quoted", "confirmed", "in_progress", "completed"];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function StatusBadge({ status }: { status: JobStatus }) {
  const m = JOB_STATUS_META[status];
  return (
    <span className={`badge ${m.tone}`}>
      <span className="dot" />
      {m.label}
    </span>
  );
}

/* ──────────────────────────────── 요청 상세 + 견적 입력 ──────────────────────────────── */
function JobDetail({
  job,
  api,
  onBack,
}: {
  job: PartnerJob;
  api: PartnerJobsApi;
  onBack: () => void;
}) {
  const svc = serviceById(job.serviceId);
  const suggested = useMemo(
    () =>
      computeEstimate({
        pyeong: job.pyeong,
        difficulty: job.difficulty,
        propertyType: job.propertyType,
        date: job.date,
        options: [],
      }).final,
    [job],
  );
  const [amount, setAmount] = useState<string>(
    job.quote ? String(job.quote.amount) : String(suggested),
  );
  const [memo, setMemo] = useState<string>(job.quote?.memo ?? "");
  const diffLabel = DIFFICULTY.find((d) => d.id === job.difficulty)?.label ?? "보통";
  const meta = JOB_STATUS_META[job.status];

  function submitQuote() {
    const n = parseInt(amount.replace(/[^0-9]/g, ""), 10);
    if (!n) return;
    api.sendQuote(job.id, n, memo.trim());
    onBack();
  }

  return (
    <div className="screen">
      <AppBar onBack={onBack} title={`요청 ${job.id}`} />
      <div className="pad">
        <div className="flex between center">
          <div className="flex center gap-8">
            <span className="tile" style={{ height: 44, width: 44, fontSize: "1.3rem", borderRadius: 13 }}>
              {svc?.emoji}
            </span>
            <div>
              <b style={{ fontSize: "1.05rem" }}>{svc?.name}</b>
              <p className="tiny muted">{job.region}</p>
            </div>
          </div>
          <StatusBadge status={job.status} />
        </div>

        {job.status !== "declined" && (
          <div style={{ marginTop: 16 }}>
            <Tracker flow={JOB_FLOW} current={job.status} />
            <p className="tiny muted" style={{ marginTop: 6 }}>{meta.desc}</p>
          </div>
        )}

        {/* 요청 상세 */}
        <div className="card lg card-pad" style={{ marginTop: 16 }}>
          <div className="flex between"><span className="muted small">고객</span><b className="small">{job.customerName}</b></div>
          <div className="flex between mt-8"><span className="muted small">방문 희망</span><b className="small">{job.date} {job.timeSlot}</b></div>
          <div className="flex between mt-8"><span className="muted small">장소</span><b className="small">{job.address}</b></div>
          <div className="flex between mt-8"><span className="muted small">주거 형태</span><b className="small">{job.propertyType}</b></div>
          <div className="flex between mt-8"><span className="muted small">평수</span><b className="small">{job.pyeong}평</b></div>
          <div className="flex between mt-8"><span className="muted small">오염도</span><b className="small">{diffLabel}</b></div>
          {job.note && (
            <>
              <hr className="hr" />
              <p className="muted small" style={{ lineHeight: 1.6 }}>“{job.note}”</p>
            </>
          )}
        </div>

        {/* 견적 입력 */}
        {(job.status === "new" || job.status === "quoted") && (
          <div className="card lg card-pad" style={{ marginTop: 16 }}>
            <b>{job.status === "quoted" ? "견적 수정" : "견적 보내기"}</b>
            <p className="small muted" style={{ marginTop: 2 }}>
              추천 견적 <b className="price">{formatKRW(suggested)}</b> · 평수·오염도 기준 자동 계산값이에요.
            </p>
            <div style={{ marginTop: 14 }}>
              <Field label="견적 금액 (원)" required>
                <input
                  className="input"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="예) 180000"
                />
              </Field>
              <Field label="고객 안내 메모">
                <textarea
                  className="input"
                  rows={3}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="포함 범위·추가 옵션·방문 안내 등을 적어 주세요."
                />
              </Field>
              <button className="btn btn-brand btn-block" onClick={submitQuote}>
                {job.status === "quoted" ? "견적 다시 보내기" : "견적 보내기"}
              </button>
              {job.status === "new" && (
                <button
                  className="btn btn-ghost btn-block"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    api.setStatus(job.id, "declined");
                    onBack();
                  }}
                >
                  요청 거절
                </button>
              )}
            </div>
          </div>
        )}

        {/* 발송된 견적 요약 */}
        {job.quote && job.status !== "new" && (
          <div className="notice-info" style={{ marginTop: 16 }}>
            <span>🧾</span>
            <span>
              보낸 견적 <b className="price">{formatKRW(job.quote.amount)}</b> · {job.quote.sentAt}
              {job.quote.memo && <><br />{job.quote.memo}</>}
            </span>
          </div>
        )}

        {/* 상태 진행 액션 */}
        {job.status === "confirmed" && (
          <button className="btn btn-ink btn-block" style={{ marginTop: 16 }} onClick={() => api.setStatus(job.id, "in_progress")}>
            청소 시작하기
          </button>
        )}
        {job.status === "in_progress" && (
          <button className="btn btn-brand btn-block" style={{ marginTop: 16 }} onClick={() => api.setStatus(job.id, "completed")}>
            청소 완료 처리
          </button>
        )}
        {job.status === "declined" && (
          <button className="btn btn-ghost btn-block" style={{ marginTop: 16 }} onClick={() => api.setStatus(job.id, "new")}>
            거절 취소 (다시 신규로)
          </button>
        )}

        {/* 손길 운영팀과 소통 (배정된 실제 예약만 열람 가능) */}
        <MessageThread
          type="reservation"
          id={job.id}
          audience="partner"
          me="partner"
          title="💬 손길 운영팀과 소통"
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────── 예약 캘린더 (메인) ──────────────────────────────── */
function StatTile({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className="card card-pad" style={{ flex: 1, textAlign: "center", padding: "16px 8px" }}>
      <div style={{ fontSize: "1.6rem", fontWeight: 900, color: tone }}>{n}</div>
      <div className="tiny muted" style={{ marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function PartnerJobs({ api }: { api: PartnerJobsApi }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState(() => ({ y: 2026, m: 6 })); // 2026-07 (0-index)
  const [selected, setSelected] = useState<string>("2026-07-12");

  // 날짜별 요청 그룹
  const byDate = useMemo(() => {
    const m = new Map<string, PartnerJob[]>();
    for (const j of api.jobs) {
      const arr = m.get(j.date) ?? [];
      arr.push(j);
      m.set(j.date, arr);
    }
    return m;
  }, [api.jobs]);

  const open = openId ? api.jobs.find((j) => j.id === openId) ?? null : null;
  if (open) return <JobDetail job={open} api={api} onBack={() => setOpenId(null)} />;

  const total = api.jobs.length;
  const quotedCount = api.jobs.filter((j) => j.quote).length;
  const confirmedCount = api.jobs.filter((j) =>
    ["confirmed", "in_progress", "completed"].includes(j.status),
  ).length;

  const startWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function go(delta: number) {
    const nm = new Date(view.y, view.m + delta, 1);
    setView({ y: nm.getFullYear(), m: nm.getMonth() });
  }

  const dayJobs = (byDate.get(selected) ?? []).slice().sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  return (
    <div className="screen">
      <AppBar showLogo title="예약 관리" />
      <div className="pad">
        {/* 통계 */}
        <div className="flex gap-10">
          <StatTile n={total} label="전체 요청" tone="var(--ink)" />
          <StatTile n={quotedCount} label="견적 발송" tone="var(--violet-700)" />
          <StatTile n={confirmedCount} label="예약 확정" tone="var(--brand)" />
        </div>

        {/* 캘린더 */}
        <div className="card lg card-pad" style={{ marginTop: 14 }}>
          <div className="flex between center">
            <button onClick={() => go(-1)} aria-label="이전 달" style={{ border: "none", background: "transparent", fontSize: "1.3rem", color: "var(--ink)", padding: "4px 10px" }}>‹</button>
            <b style={{ fontSize: "1.05rem" }}>{view.y}년 {view.m + 1}월</b>
            <button onClick={() => go(1)} aria-label="다음 달" style={{ border: "none", background: "transparent", fontSize: "1.3rem", color: "var(--ink)", padding: "4px 10px" }}>›</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginTop: 10 }}>
            {WEEK.map((w, i) => (
              <div key={w} className="tiny" style={{ textAlign: "center", fontWeight: 700, padding: "4px 0", color: i === 0 ? "var(--rose-600)" : i === 6 ? "var(--brand)" : "var(--ink-soft)" }}>
                {w}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 4 }}>
            {cells.map((d, i) => {
              if (d === null) return <div key={`b${i}`} />;
              const date = new Date(view.y, view.m, d);
              const key = ymd(date);
              const jobs = byDate.get(key) ?? [];
              const hasNew = jobs.some((j) => j.status === "new");
              const selectedDay = key === selected;
              const weekday = date.getDay();
              return (
                <button
                  key={d}
                  onClick={() => setSelected(key)}
                  style={{
                    aspectRatio: "1",
                    border: "none",
                    borderRadius: 12,
                    background: selectedDay ? "var(--brand)" : jobs.length ? "var(--brand-50)" : "transparent",
                    color: selectedDay ? "#fff" : weekday === 0 ? "var(--rose-600)" : "var(--ink)",
                    fontWeight: selectedDay ? 800 : 600,
                    fontSize: "0.9rem",
                    position: "relative",
                    cursor: "pointer",
                  }}
                >
                  {d}
                  {jobs.length > 0 && !selectedDay && (
                    <span style={{ position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: 999, background: hasNew ? "var(--amber-400)" : "var(--brand)" }} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-12" style={{ marginTop: 10, flexWrap: "wrap" }}>
            <span className="tiny muted flex center gap-6">
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--amber-400)" }} /> 견적 대기
            </span>
            <span className="tiny muted flex center gap-6">
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--brand)" }} /> 처리됨
            </span>
          </div>
        </div>

        {/* 선택한 날짜의 예약 */}
        <h3 style={{ fontWeight: 900, marginTop: 22 }}>
          {selected.replace(/-/g, ".")} 예약 {dayJobs.length}건
        </h3>
        {dayJobs.length === 0 ? (
          <div className="card lg card-pad center-text" style={{ marginTop: 12 }}>
            <div className="tile" style={{ margin: "0 auto" }}>📅</div>
            <p className="muted small" style={{ marginTop: 10 }}>이 날짜에 예약이 없어요.</p>
          </div>
        ) : (
          <div className="stack" style={{ marginTop: 12 }}>
            {dayJobs.map((j) => {
              const svc = serviceById(j.serviceId);
              return (
                <button
                  key={j.id}
                  className="card lg card-pad"
                  style={{ width: "100%", textAlign: "left", display: "block" }}
                  onClick={() => setOpenId(j.id)}
                >
                  <div className="flex between center wrap gap-8">
                    <div className="flex center gap-8">
                      <span className="tile" style={{ height: 40, width: 40, fontSize: "1.2rem", borderRadius: 12 }}>
                        {svc?.emoji}
                      </span>
                      <div>
                        <b>{svc?.name}</b>
                        <p className="tiny muted">{j.timeSlot} · {j.customerName} · {j.pyeong}평</p>
                      </div>
                    </div>
                    <StatusBadge status={j.status} />
                  </div>
                  <hr className="hr" />
                  <div className="flex between center">
                    <span className="small muted">{j.region}</span>
                    {j.quote ? (
                      <b className="small price">{formatKRW(j.quote.amount)}</b>
                    ) : (
                      <span className="small" style={{ color: "var(--brand)", fontWeight: 700 }}>견적 보내기 ›</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
