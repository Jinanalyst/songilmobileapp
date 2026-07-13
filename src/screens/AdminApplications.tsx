import { useEffect, useState } from "react";
import {
  fetchAdminApplications,
  patchApplication,
  type AdminApplication,
} from "../api";
import { AppBar } from "../components/ui";

const STATUS_LABEL: Record<string, string> = {
  submitted: "접수 완료",
  reviewing: "서류 심사중",
  approved: "승인 완료",
  rejected: "반려",
};
const STATUS_ORDER = ["reviewing", "approved", "rejected"];

export default function AdminApplications({ onLogout }: { onLogout?: () => void }) {
  const [rows, setRows] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setRows(await fetchAdminApplications());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function review(id: string, status: string) {
    setBusy(id);
    const reviewNote = notes[id] ?? rows.find((r) => r.id === id)?.reviewNote ?? "";
    try {
      const updated = await patchApplication(id, { status, reviewNote });
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      /* noop */
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="screen">
      <AppBar showLogo title="파트너 심사" onLogout={onLogout} />
      <div className="pad">
        <div className="flex between center">
          <h1 className="title-xl">파트너 신청 {rows.length}건</h1>
          <button className="btn btn-ghost" onClick={load}>↻ 새로고침</button>
        </div>
        <p className="sub small">업체가 낸 파트너 등록 신청을 심사하세요.</p>

        {loading ? (
          <p className="muted center-text" style={{ padding: "40px 0" }}>불러오는 중…</p>
        ) : rows.length === 0 ? (
          <p className="muted center-text" style={{ padding: "40px 0" }}>신청이 없어요.</p>
        ) : (
          <div className="stack" style={{ marginTop: 12 }}>
            {rows.map((r) => (
              <div key={r.id} className="card lg card-pad">
                <div className="flex between center wrap gap-8">
                  <div>
                    <b>{r.companyName}</b>
                    <p className="tiny muted">{r.id} · {r.ownerName}</p>
                  </div>
                  <span className="badge tone-quoted"><span className="dot" />{STATUS_LABEL[r.status] ?? r.status}</span>
                </div>
                <hr className="hr" />
                <div className="flex between"><span className="muted small">사업자번호</span><b className="small">{r.bizNumber}</b></div>
                <div className="flex between mt-8"><span className="muted small">연락처</span><b className="small">{r.phone}</b></div>
                <div className="flex between mt-8"><span className="muted small">이메일</span><b className="small">{r.email}</b></div>
                <div className="flex between mt-8"><span className="muted small">지역/규모</span><b className="small">{[r.regions, r.teamSize, r.experience].filter(Boolean).join(" · ") || "-"}</b></div>
                {r.services.length > 0 && (
                  <div className="flex gap-8 wrap" style={{ marginTop: 8 }}>
                    {r.services.map((s) => (
                      <span key={s} className="chip">{s}</span>
                    ))}
                  </div>
                )}
                {r.intro && <p className="notice" style={{ marginTop: 12 }}>💬 {r.intro}</p>}

                <textarea
                  className="input"
                  rows={2}
                  style={{ marginTop: 12 }}
                  defaultValue={r.reviewNote}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  placeholder="심사 메모 / 반려 사유"
                />
                <div className="flex gap-8 wrap" style={{ marginTop: 10 }}>
                  {STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      className={`opt${r.status === s ? " sel" : ""}`}
                      style={{ padding: "8px 14px" }}
                      disabled={busy === r.id}
                      onClick={() => review(r.id, s)}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
