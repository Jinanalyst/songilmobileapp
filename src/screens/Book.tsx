import { useMemo, useState } from "react";
import {
  SERVICES,
  PARTNERS,
  TIME_SLOTS,
  DEPOSIT,
  PAYMENT_NOTICE,
  PROPERTY_TYPES,
  ROOM_OPTIONS,
  BATH_OPTIONS,
  SPACE_TYPES,
  PARTIAL_AREAS,
  formatKRW,
  serviceById,
  categoryOf,
  propertyLabelOf,
} from "../data";
import { DIFFICULTY, OPTIONS, computeEstimate } from "../pricing";
import { createReservation } from "../api";
import { useStore } from "../store";
import { AppBar, Field } from "../components/ui";

const STEPS = ["서비스", "공간 정보", "날짜·업체", "정보 입력", "예약금 결제"];
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function upcomingDays(count: number) {
  const days: Date[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(d);
  }
  return days;
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Prop = {
  propertyType: string;
  rooms: string;
  bathrooms: string;
  hasPet: boolean;
  companyName: string;
  spaceType: string;
  bizNumber: string;
  areas: string[];
  floorInfo: string;
};
const EMPTY_PROP: Prop = {
  propertyType: "",
  rooms: "",
  bathrooms: "",
  hasPet: false,
  companyName: "",
  spaceType: "",
  bizNumber: "",
  areas: [],
  floorInfo: "",
};

export default function Book({ onDone }: { onDone: () => void }) {
  const { session, saveReservation } = useStore();
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState("");
  const [pyeong, setPyeong] = useState("");
  const [prop, setProp] = useState<Prop>(EMPTY_PROP);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [name, setName] = useState(session.name || "");
  const [phone, setPhone] = useState(session.phone || "");
  const [address, setAddress] = useState(session.address || "");
  const [addressDetail, setAddressDetail] = useState(session.addressDetail || "");
  const [notes, setNotes] = useState("");
  const [difficulty, setDifficulty] = useState("normal");
  const [options, setOptions] = useState<string[]>([]);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const days = useMemo(() => upcomingDays(21), []);
  const svc = serviceById(serviceId);
  const cat = categoryOf(serviceId);
  const py = parseInt(pyeong || "0", 10) || 0;
  // 견적 계산 (평수 × 평당단가 vs 구간 최소금액, 난이도·주거유형·일정 계수 + 옵션비)
  const est = computeEstimate({
    pyeong: py,
    difficulty,
    propertyType: prop.propertyType,
    date,
    options,
  });

  function toggleOption(id: string) {
    setOptions((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  }

  function setP(patch: Partial<Prop>) {
    setProp((p) => ({ ...p, ...patch }));
  }
  function toggleArea(a: string) {
    setProp((p) => ({
      ...p,
      areas: p.areas.includes(a) ? p.areas.filter((x) => x !== a) : [...p.areas, a],
    }));
  }

  const propOk =
    cat === "commercial"
      ? !!prop.companyName.trim()
      : cat === "partial"
      ? prop.areas.length > 0
      : cat === "residential"
      ? !!prop.propertyType
      : false;

  const canNext =
    step === 0
      ? !!serviceId && py > 0
      : step === 1
      ? propOk
      : step === 2
      ? !!date && !!time && !!partnerId
      : step === 3
      ? name.trim() && /\d{3}.?\d{3,4}.?\d{4}/.test(phone) && address.trim()
      : true;

  function buildProperty() {
    if (cat === "commercial")
      return {
        companyName: prop.companyName,
        spaceType: prop.spaceType,
        bizNumber: prop.bizNumber,
        floorInfo: prop.floorInfo,
      };
    if (cat === "partial")
      return { areas: prop.areas, propertyType: prop.propertyType, floorInfo: prop.floorInfo };
    return {
      propertyType: prop.propertyType,
      rooms: prop.rooms,
      bathrooms: prop.bathrooms,
      hasPet: prop.hasPet,
      floorInfo: prop.floorInfo,
    };
  }

  // 견적 세부(난이도·옵션·예상금액)를 요청사항에 함께 기록해 업체가 참고하도록 한다.
  function buildNotes() {
    const parts: string[] = [];
    if (notes.trim()) parts.push(notes.trim());
    const diff = DIFFICULTY.find((d) => d.id === difficulty);
    if (diff && diff.id !== "normal") parts.push(`오염 정도: ${diff.label}`);
    if (options.length) {
      const labels = options.map((id) => OPTIONS.find((o) => o.id === id)?.label).filter(Boolean);
      parts.push(`추가 옵션: ${labels.join(", ")}`);
    }
    parts.push(`앱 예상 견적: ${formatKRW(est.final)}`);
    return parts.join(" / ");
  }

  async function pay() {
    setError(null);
    setPaying(true);
    try {
      const r = await createReservation({
        partnerId,
        serviceId,
        pyeong: py,
        date,
        timeSlot: time,
        customerName: name,
        phone,
        address,
        addressDetail,
        notes: buildNotes(),
        property: buildProperty(),
      });
      saveReservation({
        id: r.id,
        createdAt: ymd(new Date()),
        serviceId,
        partnerId,
        date,
        timeSlot: time,
        pyeong: py,
        customerName: name,
      });
      setDoneId(r.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "예약에 실패했어요.");
    } finally {
      setPaying(false);
    }
  }

  if (doneId) {
    const partner = PARTNERS.find((p) => p.id === partnerId);
    return (
      <div className="screen">
        <AppBar showLogo title="청소 예약" />
        <div className="pad center-text">
          <div className="card lg card-pad rise" style={{ marginTop: 20 }}>
            <div className="tile" style={{ margin: "0 auto", background: "var(--emerald-50)" }}>✅</div>
            <h1 className="title-xl">예약이 확정됐어요!</h1>
            <p className="sub small">
              예약금 결제가 완료됐어요. 방문 하루 전 담당 업체가 다시 안내드릴게요.
            </p>
            <div className="notice" style={{ marginTop: 18, textAlign: "left" }}>
              <div className="flex between"><span className="muted small">예약번호</span><b>{doneId}</b></div>
              <div className="flex between mt-8"><span className="muted small">서비스</span><b>{svc?.emoji} {svc?.name}</b></div>
              <div className="flex between mt-8"><span className="muted small">방문일</span><b>{date} {time}</b></div>
              <div className="flex between mt-8"><span className="muted small">담당 업체</span><b>{partner?.name}</b></div>
              <div className="flex between mt-8"><span className="muted small">결제한 예약금</span><b className="price">{formatKRW(DEPOSIT)}</b></div>
            </div>
            <button className="btn btn-brand btn-block" style={{ marginTop: 18 }} onClick={onDone}>
              내 예약 보기 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <AppBar showLogo title="청소 예약" />
      <div className="stepbar">
        {STEPS.map((_, i) => (
          <span key={i} className={`seg${i <= step ? " on" : ""}`} />
        ))}
      </div>

      <div className="pad">
        <p className="eyebrow">STEP {step + 1} / {STEPS.length} · {STEPS[step]}</p>

        {/* STEP 0 — 서비스 + 평수 */}
        {step === 0 && (
          <div className="stack" style={{ marginTop: 14 }}>
            <h2 className="title-lg">어떤 청소가 필요하세요?</h2>
            {SERVICES.map((s) => {
              const sel = serviceId === s.id;
              return (
                <button
                  key={s.id}
                  className="card card-pad flex gap-12 center"
                  style={{ textAlign: "left", width: "100%", border: sel ? "1px solid var(--brand)" : undefined, background: sel ? "var(--brand-50)" : "#fff" }}
                  onClick={() => setServiceId(s.id)}
                >
                  <span className="tile">{s.emoji}</span>
                  <span className="grow">
                    <b style={{ display: "block" }}>{s.name}</b>
                    <span className="tiny muted">{s.blurb}</span>
                    <span className="tiny" style={{ display: "block", marginTop: 4 }}>
                      <span className="muted">{s.duration} · 시작</span> <span className="price">{formatKRW(s.minPrice)}~</span>
                    </span>
                  </span>
                  {sel && <span style={{ color: "var(--brand)", fontWeight: 900 }}>✓</span>}
                </button>
              );
            })}
            <Field label="평수" required>
              <input className="input" inputMode="numeric" placeholder="예) 24" value={pyeong} onChange={(e) => setPyeong(e.target.value.replace(/[^\d]/g, ""))} />
            </Field>
            {svc && py > 0 && (
              <div className="notice-info">
                <span>ⓘ</span>
                <span>
                  <b>{py}평 기본 예상 견적</b>{" "}
                  <b className="price">{formatKRW(est.base)}</b>
                  <br />
                  오염 정도·주거 형태·방문 일정·추가 옵션에 따라 최종 견적이 달라져요.
                </span>
              </div>
            )}
          </div>
        )}

        {/* STEP 1 — 공간 정보 */}
        {step === 1 && (
          <div style={{ marginTop: 14 }}>
            <h2 className="title-lg">{propertyLabelOf(serviceId)}</h2>
            {cat === "residential" && (
              <div style={{ marginTop: 14 }}>
                <p className="small" style={{ fontWeight: 700 }}>주거 형태 <span className="req" style={{ color: "var(--brand)" }}>*</span></p>
                <div className="opt-grid" style={{ marginTop: 8 }}>
                  {PROPERTY_TYPES.map((t) => (
                    <button key={t} className={`opt${prop.propertyType === t ? " sel" : ""}`} onClick={() => setP({ propertyType: t })}>{t}</button>
                  ))}
                </div>
                <p className="small" style={{ fontWeight: 700, marginTop: 16 }}>방 개수</p>
                <div className="opt-grid" style={{ marginTop: 8 }}>
                  {ROOM_OPTIONS.map((t) => (
                    <button key={t} className={`opt${prop.rooms === t ? " sel" : ""}`} onClick={() => setP({ rooms: t })}>{t}</button>
                  ))}
                </div>
                <p className="small" style={{ fontWeight: 700, marginTop: 16 }}>화장실</p>
                <div className="opt-grid" style={{ marginTop: 8 }}>
                  {BATH_OPTIONS.map((t) => (
                    <button key={t} className={`opt${prop.bathrooms === t ? " sel" : ""}`} onClick={() => setP({ bathrooms: t })}>{t}</button>
                  ))}
                </div>
                <button className={`opt${prop.hasPet ? " sel" : ""}`} style={{ marginTop: 16 }} onClick={() => setP({ hasPet: !prop.hasPet })}>
                  🐾 반려동물이 있어요
                </button>
              </div>
            )}
            {cat === "commercial" && (
              <div style={{ marginTop: 14 }}>
                <Field label="상호(회사)명" required>
                  <input className="input" value={prop.companyName} onChange={(e) => setP({ companyName: e.target.value })} placeholder="손길카페" />
                </Field>
                <p className="small" style={{ fontWeight: 700 }}>공간 형태</p>
                <div className="opt-grid" style={{ margin: "8px 0 16px" }}>
                  {SPACE_TYPES.map((t) => (
                    <button key={t} className={`opt${prop.spaceType === t ? " sel" : ""}`} onClick={() => setP({ spaceType: t })}>{t}</button>
                  ))}
                </div>
                <Field label="사업자등록번호 (선택)">
                  <input className="input" inputMode="numeric" value={prop.bizNumber} onChange={(e) => setP({ bizNumber: e.target.value })} placeholder="123-45-67890" />
                </Field>
              </div>
            )}
            {cat === "partial" && (
              <div style={{ marginTop: 14 }}>
                <p className="small" style={{ fontWeight: 700 }}>청소할 공간 <span className="req" style={{ color: "var(--brand)" }}>*</span> (여러 개 선택 가능)</p>
                <div className="opt-grid" style={{ marginTop: 8 }}>
                  {PARTIAL_AREAS.map((a) => (
                    <button key={a} className={`opt${prop.areas.includes(a) ? " sel" : ""}`} onClick={() => toggleArea(a)}>{a}</button>
                  ))}
                </div>
              </div>
            )}
            <Field label="층수·엘리베이터·주차 (선택)">
              <input className="input" value={prop.floorInfo} onChange={(e) => setP({ floorInfo: e.target.value })} placeholder="예) 3층, 엘리베이터 있음, 주차 가능" />
            </Field>

            {/* 오염 정도 (난이도 계수) */}
            <p className="small" style={{ fontWeight: 700, marginTop: 6 }}>오염 정도</p>
            <p className="tiny muted" style={{ margin: "2px 0 8px" }}>오염이 심할수록 작업 시간·인력이 늘어 견적에 반영돼요.</p>
            <div className="opt-grid">
              {DIFFICULTY.map((d) => (
                <button key={d.id} className={`opt${difficulty === d.id ? " sel" : ""}`} onClick={() => setDifficulty(d.id)}>
                  {d.label}
                  <span className="tiny muted" style={{ marginLeft: 4 }}>×{d.factor}</span>
                </button>
              ))}
            </div>
            <p className="tiny muted" style={{ marginTop: 6 }}>
              {DIFFICULTY.find((d) => d.id === difficulty)?.desc}
            </p>

            {/* 추가 옵션 (옵션비) */}
            <p className="small" style={{ fontWeight: 700, marginTop: 18 }}>추가 옵션 (선택)</p>
            <div className="stack-sm" style={{ marginTop: 8 }}>
              {OPTIONS.map((o) => {
                const sel = options.includes(o.id);
                return (
                  <button
                    key={o.id}
                    className="card card-pad flex between center"
                    style={{ width: "100%", textAlign: "left", border: sel ? "1px solid var(--brand)" : undefined, background: sel ? "var(--brand-50)" : "#fff" }}
                    onClick={() => toggleOption(o.id)}
                  >
                    <span className="flex center gap-8">
                      <span style={{ color: sel ? "var(--brand)" : "var(--line)", fontWeight: 900 }}>{sel ? "☑" : "☐"}</span>
                      <span className="small"><b>{o.label}</b></span>
                    </span>
                    <span className="small price">+{formatKRW(o.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2 — 날짜·시간·업체 */}
        {step === 2 && (
          <div style={{ marginTop: 14 }}>
            <h2 className="title-lg">언제, 어느 업체로?</h2>
            <p className="small muted" style={{ marginTop: 4 }}>방문 날짜와 시간, 담당 업체를 골라주세요.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 14 }}>
              {days.map((d) => {
                const key = ymd(d);
                const sel = date === key;
                return (
                  <button key={key} onClick={() => setDate(key)} className="card"
                    style={{ padding: "8px 0", textAlign: "center", border: sel ? "1px solid var(--brand)" : undefined, background: sel ? "var(--brand)" : "#fff", color: sel ? "#fff" : "var(--ink)" }}>
                    <div className="tiny" style={{ opacity: 0.7 }}>{WEEK[d.getDay()]}</div>
                    <div style={{ fontWeight: 800 }}>{d.getDate()}</div>
                  </button>
                );
              })}
            </div>
            <p className="small" style={{ fontWeight: 700, marginTop: 18 }}>방문 시간대</p>
            <div className="opt-grid" style={{ marginTop: 8 }}>
              {TIME_SLOTS.map((t) => (
                <button key={t} className={`opt${time === t ? " sel" : ""}`} onClick={() => setTime(t)}>{t}</button>
              ))}
            </div>
            <p className="small" style={{ fontWeight: 700, marginTop: 18 }}>담당 업체 선택</p>
            <div className="stack-sm" style={{ marginTop: 8 }}>
              {PARTNERS.map((p) => {
                const sel = partnerId === p.id;
                return (
                  <button key={p.id} className="card card-pad flex gap-10 center" style={{ width: "100%", textAlign: "left", border: sel ? "1px solid var(--brand)" : undefined, background: sel ? "var(--brand-50)" : "#fff" }} onClick={() => setPartnerId(p.id)}>
                    <span className={`avatar ${p.accent}`} style={{ height: 40, width: 40, fontSize: "1rem", borderRadius: 12 }}>{p.name.slice(0, 1)}</span>
                    <span className="grow">
                      <b className="small" style={{ display: "block" }}>{p.name} <span className="star tiny">★ {p.rating}</span></b>
                      <span className="tiny muted">{p.region}</span>
                    </span>
                    {sel && <span style={{ color: "var(--brand)", fontWeight: 900 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3 — 정보 입력 */}
        {step === 3 && (
          <div style={{ marginTop: 14 }}>
            <h2 className="title-lg">연락처와 주소</h2>
            <div className="row-2" style={{ marginTop: 14 }}>
              <Field label="이름" required>
                <input className="input" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="연락처" required>
                <input className="input" inputMode="tel" placeholder="010-1234-5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
            </div>
            <Field label="주소" required>
              <input className="input" placeholder="서울 마포구 월드컵북로 120" value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
            <Field label="상세 주소 (선택)">
              <input className="input" placeholder="302동 1104호" value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} />
            </Field>
            <Field label="요청사항 (선택)">
              <textarea className="input" rows={3} placeholder="청소 범위, 오염 정도 등을 알려주세요." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </div>
        )}

        {/* STEP 4 — 결제 */}
        {step === 4 && (
          <div style={{ marginTop: 14 }}>
            <h2 className="title-lg">예약금 결제</h2>
            <div className="card card-pad" style={{ marginTop: 14 }}>
              <div className="flex between"><span className="muted small">서비스</span><b>{svc?.emoji} {svc?.name}</b></div>
              <div className="flex between mt-8"><span className="muted small">방문일</span><b>{date} {time}</b></div>
              <div className="flex between mt-8"><span className="muted small">담당 업체</span><b>{PARTNERS.find((p) => p.id === partnerId)?.name}</b></div>
            </div>

            {/* 견적 상세 */}
            <div className="card card-pad" style={{ marginTop: 12 }}>
              <p className="small" style={{ fontWeight: 700, marginBottom: 8 }}>예상 견적 상세</p>
              <div className="flex between"><span className="muted small">기본 견적 ({py}평)</span><b className="small">{formatKRW(est.base)}</b></div>
              {est.difficulty !== 1 && (
                <div className="flex between mt-8"><span className="muted small">난이도</span><b className="small">×{est.difficulty}</b></div>
              )}
              {est.housing !== 1 && (
                <div className="flex between mt-8"><span className="muted small">주거유형 ({prop.propertyType})</span><b className="small">×{est.housing}</b></div>
              )}
              {est.schedule !== 1 && (
                <div className="flex between mt-8"><span className="muted small">{est.scheduleLabel} 방문</span><b className="small">×{est.schedule}</b></div>
              )}
              {est.optionsFee > 0 && (
                <div className="flex between mt-8"><span className="muted small">추가 옵션 {options.length}개</span><b className="small">+{formatKRW(est.optionsFee)}</b></div>
              )}
              <hr className="hr" />
              <div className="flex between center">
                <span style={{ fontWeight: 700 }}>최종 예상 견적</span>
                <span className="price" style={{ fontSize: "1.25rem" }}>{formatKRW(est.final)}</span>
              </div>
              <p className="tiny muted" style={{ marginTop: 8 }}>최종 금액은 현장 확인 후 확정될 수 있어요.</p>
            </div>

            {/* 결제 */}
            <div className="card card-pad" style={{ marginTop: 12, background: "var(--brand-50)", border: "1px solid var(--brand-100)" }}>
              <div className="flex between center">
                <span style={{ fontWeight: 700 }}>지금 결제 (예약금)</span>
                <span className="price" style={{ fontSize: "1.3rem" }}>{formatKRW(DEPOSIT)}</span>
              </div>
              <p className="tiny muted" style={{ marginTop: 6 }}>잔금 {formatKRW(Math.max(0, est.final - DEPOSIT))}은 청소 완료 후 현장에서 결제해요.</p>
            </div>
            <div className="notice" style={{ marginTop: 14 }}>{PAYMENT_NOTICE}</div>
            <div className="notice-info" style={{ marginTop: 12 }}>
              <span>🧪</span>
              <span>결제는 <b>목업(테스트)</b>이며 실제 카드 결제가 이뤄지지 않아요. 단, 예약 정보는 handway.online 과 같은 DB에 실제로 저장됩니다.</span>
            </div>
            {error && <p className="error-box" style={{ marginTop: 12 }}>{error}</p>}
          </div>
        )}
      </div>

      <div className="pad" style={{ paddingTop: 0 }}>
        <div className="flex gap-10">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>이전</button>
          )}
          {step < 4 ? (
            <button className="btn btn-brand grow" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>다음</button>
          ) : (
            <button className="btn btn-brand grow" disabled={paying} onClick={pay}>
              {paying ? "결제 처리 중…" : `${formatKRW(DEPOSIT)} 결제하고 예약 확정`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
