import { useState } from "react";
import { SERVICES, BANKS } from "../data";
import { createApplication } from "../api";
import { useStore } from "../store";
import { AppBar, Field } from "../components/ui";
import PhotoPicker from "../components/PhotoPicker";

const SERVICE_NAMES = SERVICES.map((s) => s.name);

export default function PartnerApply({ onBack }: { onBack: () => void }) {
  const { session, saveApplication } = useStore();
  const [f, setF] = useState({
    companyName: "",
    ownerName: session.name || "",
    bizNumber: "",
    phone: session.phone || "",
    email: session.email || "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    regions: "",
    experience: "",
    teamSize: "",
    intro: "",
  });
  const [services, setServices] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  function set(patch: Partial<typeof f>) {
    setF((p) => ({ ...p, ...patch }));
  }
  function toggleService(name: string) {
    setServices((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));
  }

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const app = await createApplication({ ...f, services, photos });
      saveApplication({
        id: app.id,
        createdAt: new Date().toISOString().slice(0, 10),
        companyName: f.companyName,
        services,
      });
      setDoneId(app.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "신청에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  if (doneId) {
    return (
      <div className="screen">
        <AppBar onBack={onBack} title="파트너 등록" />
        <div className="pad center-text">
          <div className="card lg card-pad rise" style={{ marginTop: 20 }}>
            <div className="tile" style={{ margin: "0 auto", background: "var(--emerald-50)" }}>
              ✅
            </div>
            <h1 className="title-xl">심사 신청 완료!</h1>
            <p className="sub small">
              신청이 정상 접수됐어요. 제출하신 사업자 정보와 정산 계좌를
              확인한 뒤 담당자가 연락드릴게요.
            </p>
            <div className="notice" style={{ marginTop: 16 }}>
              <span className="muted small">신청 접수번호</span>
              <div className="price" style={{ fontSize: "1.5rem", letterSpacing: 2, marginTop: 4 }}>
                {doneId}
              </div>
            </div>
            <button className="btn btn-brand btn-block" style={{ marginTop: 16 }} onClick={onBack}>
              계정으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <AppBar onBack={onBack} title="파트너 등록 (심사)" />
      <div className="pad">
        <p className="eyebrow">청소 업체 파트너 모집</p>
        <h1 className="title-xl">손길 파트너로 등록하기</h1>
        <p className="sub small">
          아래 정보를 남겨주시면 서류 심사 후 승인해 드려요. 승인되면 파트너 리스트에
          노출되고 고객 예약을 연결받을 수 있어요.
        </p>

        <div className="card lg card-pad" style={{ marginTop: 18 }}>
          <div className="row-2">
            <Field label="업체명" required>
              <input className="input" value={f.companyName} onChange={(e) => set({ companyName: e.target.value })} placeholder="OO클린" />
            </Field>
            <Field label="대표자명" required>
              <input className="input" value={f.ownerName} onChange={(e) => set({ ownerName: e.target.value })} placeholder="홍길동" />
            </Field>
          </div>
          <Field label="사업자등록번호 (10자리)" required>
            <input className="input" inputMode="numeric" value={f.bizNumber} onChange={(e) => set({ bizNumber: e.target.value })} placeholder="123-45-67890" />
          </Field>
          <div className="row-2">
            <Field label="연락처" required>
              <input className="input" inputMode="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="010-1234-5678" />
            </Field>
            <Field label="이메일" required>
              <input className="input" inputMode="email" value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="team@clean.com" />
            </Field>
          </div>

          <span className="label" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: 7 }}>
            전문 청소 분야 <span className="req" style={{ color: "var(--brand)" }}>*</span>
          </span>
          <div className="opt-grid" style={{ marginBottom: 16 }}>
            {SERVICE_NAMES.map((n) => (
              <button key={n} className={`opt${services.includes(n) ? " sel" : ""}`} onClick={() => toggleService(n)}>
                {n}
              </button>
            ))}
          </div>

          <Field label="서비스 가능 지역">
            <input className="input" value={f.regions} onChange={(e) => set({ regions: e.target.value })} placeholder="서울 강남구, 서초구 / 성남 분당구" />
          </Field>
          <div className="row-2">
            <Field label="경력">
              <input className="input" value={f.experience} onChange={(e) => set({ experience: e.target.value })} placeholder="예) 5년" />
            </Field>
            <Field label="인력 규모">
              <input className="input" value={f.teamSize} onChange={(e) => set({ teamSize: e.target.value })} placeholder="예) 3명" />
            </Field>
          </div>

          <hr className="hr" />
          <p className="small" style={{ fontWeight: 700 }}>정산 계좌</p>
          <Field label="정산 은행" required>
            <select className="input" value={f.bankName} onChange={(e) => set({ bankName: e.target.value })}>
              <option value="">은행 선택</option>
              {BANKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </Field>
          <div className="row-2">
            <Field label="계좌번호" required>
              <input className="input" inputMode="numeric" value={f.accountNumber} onChange={(e) => set({ accountNumber: e.target.value })} placeholder="숫자만" />
            </Field>
            <Field label="예금주" required>
              <input className="input" value={f.accountHolder} onChange={(e) => set({ accountHolder: e.target.value })} placeholder="홍길동" />
            </Field>
          </div>

          <Field label="업체 소개">
            <textarea className="input" rows={3} value={f.intro} onChange={(e) => set({ intro: e.target.value })} placeholder="어떤 청소를 어떻게 하는 팀인지 소개해 주세요." />
          </Field>

          {/* 업체 대표 사진 — 신뢰용 */}
          <div className="field">
            <span className="label" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: 7 }}>
              업체 사진
            </span>
            <p className="tiny muted" style={{ margin: "0 0 8px" }}>
              작업 사진·시공 전후·팀 사진을 올리면 고객에게 신뢰를 줄 수 있어요. 승인되면 파트너 목록에 함께 노출됩니다.
            </p>
            <PhotoPicker photos={photos} onChange={setPhotos} max={6} label="업체 사진" />
          </div>

          {error && <p className="error-box" style={{ marginBottom: 12 }}>{error}</p>}

          <button className="btn btn-brand btn-block" disabled={busy} onClick={submit}>
            {busy ? "신청 중…" : "심사 신청하기"}
          </button>
          <p className="tiny muted center-text" style={{ marginTop: 12, lineHeight: 1.6 }}>
            신청 시 심사를 위한 사업자·정산 정보 수집·이용에 동의하는 것으로 간주돼요.
          </p>
        </div>
      </div>
    </div>
  );
}
