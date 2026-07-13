import { useEffect, useMemo, useState } from "react";
import { STATUS_META, PARTNERS, serviceById, formatKRW } from "../data";
import {
  fetchAdminReservations,
  patchReservation,
  fetchAdminApprovedPartners,
  type AdminReservation,
} from "../api";
import { AppBar } from "../components/ui";
import MessageThread from "../components/MessageThread";

const STATUS_ORDER = ["pending", "confirmed", "in_progress", "completed", "cancelled"];

export default function AdminReservations({ onLogout }: { onLogout?: () => void }) {
  const [rows, setRows] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const partnerOptions = useMemo(
    () => [...PARTNERS.map((p) => ({ id: p.id, name: p.name })), ...partners],
    [partners]
  );
  const partnerNameOf = (id: string) =>
    partnerOptions.find((p) => p.id === id)?.name ?? "미배정";

  async function load() {
    setLoading(true);
    try {
      const list = await fetchAdminReservations();
      setRows(list);
      setPriceDraft((prev) => {
        const next = { ...prev };
        for (const r of list) {
          if (next[r.id] === undefined)
            next[r.id] = r.agreedPrice != null ? String(r.agreedPrice) : "";
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    fetchAdminApprovedPartners().then(setPartners).catch(() => setPartners([]));
  }, []);

  async function apply(
    id: string,
    body: { status?: string; partnerId?: string; agreedPrice?: number | null }
  ) {
    setBusy(id);
    try {
      const updated = await patchReservation(id, body);
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      /* noop */
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="screen">
      <AppBar showLogo title="예약 관리" onLogout={onLogout} />
      <div className="pad">
        <div className="flex between center">
          <h1 className="title-xl">예약 {rows.length}건</h1>
          <button className="btn btn-ghost" onClick={load}>↻ 새로고침</button>
        </div>
        <p className="sub small">들어온 예약을 확인하고 업체 배정·협의가·소통을 관리하세요.</p>

        {loading ? (
          <p className="muted center-text" style={{ padding: "40px 0" }}>불러오는 중…</p>
        ) : rows.length === 0 ? (
          <p className="muted center-text" style={{ padding: "40px 0" }}>예약이 없어요.</p>
        ) : (
          <div className="stack" style={{ marginTop: 12 }}>
            {rows.map((r) => {
              const svc = serviceById(r.serviceId);
              const meta = STATUS_META[r.status as keyof typeof STATUS_META];
              const isOpen = openId === r.id;
              return (
                <div key={r.id} className="card lg card-pad">
                  <div className="flex between center wrap gap-8">
                    <div className="flex center gap-8">
                      <span className="tile" style={{ height: 40, width: 40, fontSize: "1.2rem", borderRadius: 12 }}>{svc?.emoji}</span>
                      <div>
                        <b>{svc?.name} · {r.pyeong}평</b>
                        <p className="tiny muted">{r.id} · {r.date} {r.timeSlot}</p>
                      </div>
                    </div>
                    <span className="badge tone-pending"><span className="dot" />{meta?.label ?? r.status}</span>
                  </div>
                  <hr className="hr" />
                  <div className="flex between"><span className="muted small">고객</span><b className="small">{r.customerName} · {r.phone}</b></div>
                  <div className="flex between mt-8"><span className="muted small">주소</span><b className="small">{r.address} {r.addressDetail}</b></div>
                  <div className="flex between mt-8"><span className="muted small">담당 업체</span><b className="small">{partnerNameOf(r.partnerId)}</b></div>
                  <div className="flex between mt-8"><span className="muted small">예상가 / 협의가</span><b className="small price">{formatKRW(r.price)}{r.agreedPrice != null ? ` → ${formatKRW(r.agreedPrice)}` : ""}</b></div>
                  {r.partnerQuote != null && (
                    <div className="flex between mt-8"><span className="muted small">업체 제안가</span><b className="small" style={{ color: "var(--brand)" }}>{formatKRW(r.partnerQuote)}</b></div>
                  )}

                  {/* 상태 변경 */}
                  <div className="flex gap-8 wrap" style={{ marginTop: 12 }}>
                    {STATUS_ORDER.map((s) => (
                      <button
                        key={s}
                        className={`opt${r.status === s ? " sel" : ""}`}
                        style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                        disabled={busy === r.id || r.status === s}
                        onClick={() => apply(r.id, { status: s })}
                      >
                        {STATUS_META[s as keyof typeof STATUS_META]?.label ?? s}
                      </button>
                    ))}
                  </div>

                  <button className="btn btn-ink btn-block" style={{ marginTop: 12 }} onClick={() => setOpenId(isOpen ? null : r.id)}>
                    {isOpen ? "관리 닫기" : "업체 배정 · 협의가 · 소통"}
                  </button>

                  {isOpen && (
                    <div style={{ marginTop: 12 }}>
                      <p className="tiny" style={{ fontWeight: 700, margin: "0 0 4px" }}>담당 업체 배정</p>
                      <select
                        className="input"
                        value={r.partnerId}
                        disabled={busy === r.id}
                        onChange={(e) => apply(r.id, { partnerId: e.target.value })}
                      >
                        {!partnerOptions.some((p) => p.id === r.partnerId) && (
                          <option value={r.partnerId}>{r.partnerId} (미등록)</option>
                        )}
                        {partnerOptions.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>

                      <p className="tiny" style={{ fontWeight: 700, margin: "10px 0 4px" }}>협의 확정가 (원)</p>
                      <div className="flex gap-8">
                        <input
                          className="input"
                          inputMode="numeric"
                          value={priceDraft[r.id] ?? ""}
                          onChange={(e) => setPriceDraft((d) => ({ ...d, [r.id]: e.target.value.replace(/[^\d]/g, "") }))}
                          placeholder="예) 180000"
                          style={{ flex: 1 }}
                        />
                        <button
                          className="btn btn-brand"
                          disabled={busy === r.id}
                          onClick={() => {
                            const digits = (priceDraft[r.id] ?? "").replace(/[^\d]/g, "");
                            apply(r.id, { agreedPrice: digits ? Number(digits) : null });
                          }}
                        >
                          저장
                        </button>
                      </div>

                      <MessageThread type="reservation" id={r.id} audience="partner" me="admin" title="🏢 업체와 소통" />
                      <MessageThread type="reservation" id={r.id} audience="customer" me="admin" title="👤 고객과 소통" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
