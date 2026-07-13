import { useEffect, useMemo, useState } from "react";
import { AppBar } from "../components/ui";
import { formatKRW } from "../data";
import {
  fetchAdminReferrals,
  markCommission,
  createReferralPayout,
  type AdminReferralsData,
  type AdminCommission,
  type CommissionStatus,
} from "../api";

const STATUS_LABEL: Record<CommissionStatus, string> = {
  pending: "적립 예정",
  available: "정산 가능",
  paid: "지급 완료",
  canceled: "취소",
  deducted: "차감",
};
const STATUS_TONE: Record<CommissionStatus, string> = {
  pending: "tone-requested",
  available: "tone-quoted",
  paid: "tone-completed",
  canceled: "tone-requested",
  deducted: "tone-requested",
};

// 추천인(코드)별 집계 — 계좌 + 적립예정/정산가능/지급완료 금액.
type Group = {
  code: string;
  bank: string;
  account: string;
  holder: string;
  pending: number;
  available: number;
  deducted: number;
  paid: number;
  items: AdminCommission[];
};

function groupByReferrer(commissions: AdminCommission[]): Group[] {
  const map: Record<string, Group> = {};
  for (const c of commissions) {
    const g = (map[c.referrerCode] ??= {
      code: c.referrerCode,
      bank: c.bank,
      account: c.account,
      holder: c.holder,
      pending: 0,
      available: 0,
      deducted: 0,
      paid: 0,
      items: [],
    });
    if (c.bank) g.bank = c.bank;
    if (c.account) g.account = c.account;
    if (c.holder) g.holder = c.holder;
    if (c.status === "pending") g.pending += c.amount;
    else if (c.status === "available") g.available += c.amount;
    else if (c.status === "deducted") g.deducted += c.amount;
    else if (c.status === "paid") g.paid += c.amount;
    g.items.push(c);
  }
  return Object.values(map).sort(
    (a, b) => b.available + b.pending - (a.available + a.pending)
  );
}

export default function AdminAffiliate({ onLogout }: { onLogout?: () => void }) {
  const [data, setData] = useState<AdminReferralsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setData(await fetchAdminReferrals());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(
    () => (data ? groupByReferrer(data.commissions) : []),
    [data]
  );
  const totals = useMemo(() => {
    const t = { pending: 0, available: 0, paid: 0 };
    for (const c of data?.commissions ?? []) {
      if (c.status === "pending") t.pending += c.amount;
      else if (c.status === "available") t.available += c.amount;
      else if (c.status === "paid") t.paid += c.amount;
    }
    return t;
  }, [data]);

  const minPayout = data?.settings.minPayout ?? 10000;
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 이 추천인의 적립예정(pending) 커미션을 모두 정산가능(available)으로 확정.
  async function confirmAvailable(g: Group) {
    setBusy(g.code);
    try {
      const pendings = g.items.filter((c) => c.status === "pending");
      for (const c of pendings) await markCommission(c.id, "available");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "처리에 실패했어요.");
    } finally {
      setBusy(null);
    }
  }

  // 정산가능 커미션을 묶어 지급 완료 처리(배치 기록 생성).
  async function payout(g: Group) {
    setBusy(g.code);
    try {
      await createReferralPayout(g.code, period);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "정산에 실패했어요.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="screen">
      <AppBar showLogo title="제휴 정산" onLogout={onLogout} />
      <div className="pad">
        <div className="flex between center">
          <h1 className="title-xl">추천 정산</h1>
          <button className="btn btn-ghost" onClick={load}>↻ 새로고침</button>
        </div>
        <p className="sub small">
          추천·링크로 가입·예약이 이뤄지면 여기에 정산 대상과 계좌·금액이 떠요. 이체는 직접 하시고 "지급 완료"로 기록하세요.
        </p>

        {loading ? (
          <p className="muted center-text" style={{ padding: "40px 0" }}>불러오는 중…</p>
        ) : (
          <>
            {/* 요약 */}
            <div className="opt-grid" style={{ marginTop: 14 }}>
              <div className="card card-pad center-text">
                <b className="price" style={{ color: "var(--brand)" }}>{formatKRW(totals.available)}</b>
                <p className="tiny muted">정산 가능</p>
              </div>
              <div className="card card-pad center-text">
                <b className="price">{formatKRW(totals.pending)}</b>
                <p className="tiny muted">적립 예정</p>
              </div>
              <div className="card card-pad center-text">
                <b className="price">{formatKRW(totals.paid)}</b>
                <p className="tiny muted">지급 완료</p>
              </div>
              <div className="card card-pad center-text">
                <b className="price">{groups.length}</b>
                <p className="tiny muted">추천인 수</p>
              </div>
            </div>
            <p className="tiny muted" style={{ marginTop: 6 }}>
              최소 정산 금액 {formatKRW(minPayout)} · 이체는 수동, 지급 완료 처리는 기록용
            </p>

            {/* 정산 대상 (추천인별) */}
            <h3 style={{ fontWeight: 900, marginTop: 22 }}>정산 대상</h3>
            {groups.length === 0 ? (
              <p className="muted center-text" style={{ padding: "30px 0" }}>
                아직 적립된 커미션이 없어요. 추천 링크로 가입·완료 예약이 생기면 여기에 떠요.
              </p>
            ) : (
              <div className="stack" style={{ marginTop: 10 }}>
                {groups.map((g) => (
                  <div key={g.code} className="card lg card-pad">
                    <div className="flex between center wrap gap-8">
                      <div>
                        <b>추천코드 {g.code}</b>
                        <p className="tiny muted">
                          {g.bank && g.account
                            ? `${g.bank} ${g.account} (${g.holder})`
                            : "⚠️ 정산 계좌 미등록"}
                        </p>
                      </div>
                      <div className="right" style={{ whiteSpace: "nowrap" }}>
                        <b className="price" style={{ color: "var(--brand)" }}>{formatKRW(g.available)}</b>
                        <p className="tiny muted">정산 가능</p>
                      </div>
                    </div>

                    <div className="flex between mt-8">
                      <span className="muted small">적립 예정</span>
                      <b className="small">{formatKRW(g.pending)}</b>
                    </div>
                    {g.deducted > 0 && (
                      <div className="flex between mt-8">
                        <span className="muted small">차감</span>
                        <b className="small" style={{ color: "var(--rose-500, #e11d48)" }}>-{formatKRW(g.deducted)}</b>
                      </div>
                    )}
                    <div className="flex between mt-8">
                      <span className="muted small">지급 완료</span>
                      <b className="small">{formatKRW(g.paid)}</b>
                    </div>

                    <div className="flex gap-8 wrap" style={{ marginTop: 12 }}>
                      {g.pending > 0 && (
                        <button
                          className="btn btn-ghost grow"
                          disabled={busy === g.code}
                          onClick={() => confirmAvailable(g)}
                        >
                          정산 가능 확정 ({formatKRW(g.pending)})
                        </button>
                      )}
                      <button
                        className="btn btn-brand grow"
                        disabled={busy === g.code || g.available < minPayout || !g.account}
                        onClick={() => payout(g)}
                      >
                        {busy === g.code
                          ? "처리 중…"
                          : g.available < minPayout
                          ? "최소금액 미달"
                          : `지급 완료 처리 (${formatKRW(g.available)})`}
                      </button>
                    </div>

                    {/* 커미션 내역 */}
                    <hr className="hr" />
                    <div className="stack-sm">
                      {g.items.slice(0, 12).map((c) => (
                        <div key={c.id} className="flex between center gap-8">
                          <div className="grow" style={{ minWidth: 0 }}>
                            <span className="small">
                              {c.referredType === "customer" ? "🙋" : "🧹"} {c.referredName || "익명"}
                              {c.isFirst ? " · 첫예약" : ` · ${c.sequenceNo}번째`}
                            </span>
                            <p className="tiny muted">
                              {c.reservationId} · 거래 {formatKRW(c.baseAmount)} · {c.createdAt.slice(0, 10)}
                            </p>
                          </div>
                          <div className="right" style={{ whiteSpace: "nowrap" }}>
                            <b className="small">{formatKRW(c.amount)}</b>
                            <span className={`badge ${STATUS_TONE[c.status]}`} style={{ marginLeft: 6 }}>
                              <span className="dot" />{STATUS_LABEL[c.status]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 지급 내역 */}
            {data && data.payouts.length > 0 && (
              <>
                <h3 style={{ fontWeight: 900, marginTop: 24 }}>지급 내역</h3>
                <div className="stack-sm" style={{ marginTop: 10 }}>
                  {data.payouts.map((p) => (
                    <div key={p.id} className="card card-pad flex between center gap-8">
                      <div className="grow" style={{ minWidth: 0 }}>
                        <b className="small">{p.referrerCode} · {p.period || p.createdAt.slice(0, 10)}</b>
                        <p className="tiny muted">{p.count}건 · {p.bank} {p.account} ({p.holder})</p>
                      </div>
                      <div className="right" style={{ whiteSpace: "nowrap" }}>
                        <b className="price" style={{ color: "var(--brand)" }}>{formatKRW(p.amount)}</b>
                        <p className="tiny muted">{p.paidAt ? p.paidAt.slice(0, 10) + " 지급" : p.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
