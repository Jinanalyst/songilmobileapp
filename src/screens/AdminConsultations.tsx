import { useEffect, useMemo, useState } from "react";
import { CONSULTATION_STATUS_META, PARTNERS, serviceById, formatKRW } from "../data";
import {
  fetchAdminConsultations,
  patchConsultation,
  fetchAdminApprovedPartners,
  type AdminConsultation,
} from "../api";
import { AppBar } from "../components/ui";
import MessageThread from "../components/MessageThread";

const STATUS_ORDER = ["requested", "consulting", "quoted", "confirmed", "cancelled"];

export default function AdminConsultations({ onLogout }: { onLogout?: () => void }) {
  const [rows, setRows] = useState<AdminConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { price: string; note: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const partnerOptions = useMemo(
    () => [...PARTNERS.map((p) => ({ id: p.id, name: p.name })), ...partners],
    [partners]
  );

  async function load() {
    setLoading(true);
    try {
      const list = await fetchAdminConsultations();
      setRows(list);
      setDrafts((prev) => {
        const next = { ...prev };
        for (const c of list) {
          if (next[c.id] === undefined)
            next[c.id] = {
              price: c.quotedPrice != null ? String(c.quotedPrice) : "",
              note: c.quoteNote ?? "",
            };
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
    body: { status?: string; quotedPrice?: number | null; quoteNote?: string; partnerId?: string }
  ) {
    setBusy(id);
    try {
      const updated = await patchConsultation(id, body);
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      /* noop */
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="screen">
      <AppBar showLogo title="상담 관리" onLogout={onLogout} />
      <div className="pad">
        <div className="flex between center">
          <h1 className="title-xl">상담 {rows.length}건</h1>
          <button className="btn btn-ghost" onClick={load}>↻ 새로고침</button>
        </div>
        <p className="sub small">상담 신청을 확인하고, 업체 배정·합의 견적·소통을 관리하세요.</p>

        {loading ? (
          <p className="muted center-text" style={{ padding: "40px 0" }}>불러오는 중…</p>
        ) : rows.length === 0 ? (
          <p className="muted center-text" style={{ padding: "40px 0" }}>상담 신청이 없어요.</p>
        ) : (
          <div className="stack" style={{ marginTop: 12 }}>
            {rows.map((r) => {
              const svc = serviceById(r.serviceId);
              const meta = CONSULTATION_STATUS_META[r.status as keyof typeof CONSULTATION_STATUS_META];
              const isOpen = openId === r.id;
              const draft = drafts[r.id] ?? { price: "", note: "" };
              return (
                <div key={r.id} className="card lg card-pad">
                  <div className="flex between center wrap gap-8">
                    <div>
                      <b>{r.customerName}</b>
                      <p className="tiny muted">{r.id} · {r.phone}</p>
                    </div>
                    <span className="badge tone-quoted"><span className="dot" />{meta?.label ?? r.status}</span>
                  </div>
                  <hr className="hr" />
                  <div className="flex between"><span className="muted small">희망 서비스</span><b className="small">{svc ? `${svc.emoji} ${svc.name}` : "-"}{r.pyeong ? ` · ${r.pyeong}평` : ""}</b></div>
                  <div className="flex between mt-8"><span className="muted small">주소</span><b className="small">{[r.address, r.addressDetail].filter(Boolean).join(" ") || "-"}</b></div>
                  <div className="flex between mt-8"><span className="muted small">희망 방문일</span><b className="small">{r.preferredDate || "-"}</b></div>
                  {r.quotedPrice != null && (
                    <div className="flex between mt-8"><span className="muted small">합의 견적</span><b className="small price">{formatKRW(r.quotedPrice)}</b></div>
                  )}
                  {r.notes && <p className="notice" style={{ marginTop: 12 }}>💬 {r.notes}</p>}

                  <div className="flex gap-8 wrap" style={{ marginTop: 12 }}>
                    {STATUS_ORDER.map((s) => (
                      <button
                        key={s}
                        className={`opt${r.status === s ? " sel" : ""}`}
                        style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                        disabled={busy === r.id || r.status === s}
                        onClick={() => apply(r.id, { status: s })}
                      >
                        {CONSULTATION_STATUS_META[s as keyof typeof CONSULTATION_STATUS_META]?.label ?? s}
                      </button>
                    ))}
                  </div>

                  <button className="btn btn-ink btn-block" style={{ marginTop: 12 }} onClick={() => setOpenId(isOpen ? null : r.id)}>
                    {isOpen ? "관리 닫기" : "업체 배정 · 견적 · 소통"}
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
                        <option value="">미배정</option>
                        {partnerOptions.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>

                      <p className="tiny" style={{ fontWeight: 700, margin: "10px 0 4px" }}>합의 견적 (원)</p>
                      <input
                        className="input"
                        inputMode="numeric"
                        value={draft.price}
                        onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: { ...draft, price: e.target.value.replace(/[^\d]/g, "") } }))}
                        placeholder="예) 180000"
                      />
                      <textarea
                        className="input"
                        rows={2}
                        style={{ marginTop: 8 }}
                        value={draft.note}
                        onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: { ...draft, note: e.target.value } }))}
                        placeholder="합의 내용·방문 예정일·포함 범위 등"
                      />
                      <button
                        className="btn btn-brand btn-block"
                        style={{ marginTop: 8 }}
                        disabled={busy === r.id}
                        onClick={() => {
                          const digits = draft.price.replace(/[^\d]/g, "");
                          if (!digits) return;
                          apply(r.id, { quotedPrice: Number(digits), quoteNote: draft.note, status: "quoted" });
                        }}
                      >
                        견적 저장 (견적 확정)
                      </button>

                      <MessageThread type="consultation" id={r.id} audience="partner" me="admin" title="🏢 업체와 소통" />
                      <MessageThread type="consultation" id={r.id} audience="customer" me="admin" title="👤 고객과 소통" />
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
