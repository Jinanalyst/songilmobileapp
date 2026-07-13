import { useEffect, useState } from "react";
import { BANKS, formatKRW } from "../data";
import { AppBar, Field } from "../components/ui";
import {
  fetchReferral,
  saveReferralPayout,
  type ReferralData,
} from "../api";

const RATE = 0.035;
const CALC_PRESETS = [300000, 500000, 1000000];

// 예상 적립금 계산기 — 비율(3.5%)이 아니라 실제 지급 금액을 보여준다.
function ReferralCalc() {
  const [amount, setAmount] = useState(300000);
  const payout = Math.round(amount * RATE);
  return (
    <div className="card lg card-pad" style={{ marginTop: 16, borderColor: "var(--brand-200)" }}>
      <b>💰 얼마를 벌 수 있나요?</b>
      <div className="flex between center" style={{ marginTop: 10 }}>
        <div>
          <p className="tiny muted">청소 계약 금액</p>
          <b>{formatKRW(amount)}</b>
        </div>
        <div className="right" style={{ whiteSpace: "nowrap" }}>
          <p className="tiny muted">예상 적립금</p>
          <b className="price" style={{ color: "var(--brand)" }}>약 {formatKRW(payout)}</b>
        </div>
      </div>
      <input
        type="range"
        min={100000}
        max={2000000}
        step={50000}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        style={{ width: "100%", marginTop: 12 }}
      />
      <div className="flex gap-8" style={{ marginTop: 10, flexWrap: "wrap" }}>
        {CALC_PRESETS.map((p) => (
          <button
            key={p}
            className="btn btn-ghost"
            style={{ padding: "6px 10px", fontSize: "0.8rem" }}
            onClick={() => setAmount(p)}
          >
            {Math.round(p / 10000)}만원 → {formatKRW(Math.round(p * RATE))}
          </button>
        ))}
      </div>
      <p className="tiny muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
        추천 링크 첫 예약 1회, 견적의 {(RATE * 100).toFixed(1)}%가 적립돼요. 금액이 클수록 적립금도 커집니다.
      </p>
    </div>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function Referral({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState<"" | "code" | "link">("");

  // 정산 계좌 폼
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [holder, setHolder] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const d = await fetchReferral();
      if (!alive) return;
      setData(d);
      if (d?.payout) {
        setBank(d.payout.bank);
        setAccount(d.payout.account);
        setHolder(d.payout.holder);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function doCopy(text: string, which: "code" | "link") {
    const ok = await copyText(text);
    if (ok) {
      setCopied(which);
      setTimeout(() => setCopied(""), 1600);
    }
  }

  async function share(link: string) {
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({ title: "손길 추천 링크", text: "손길에서 청소 예약하고 함께 혜택 받아요!", url: link });
        return;
      } catch {
        /* 취소/미지원 → 복사로 폴백 */
      }
    }
    doCopy(link, "link");
  }

  const canSave = !!bank && account.replace(/\D/g, "").length >= 6 && !!holder.trim();

  async function savePayout() {
    setMsg(null);
    setSaving(true);
    try {
      await saveReferralPayout(bank, account, holder);
      setMsg("✓ 정산 계좌가 저장됐어요.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <AppBar onBack={onBack} title="추천·제휴" />
      <div className="pad">
        <p className="eyebrow">추천하고 함께 벌기</p>
        <h1 className="title-xl">내 추천 링크</h1>
        <p className="sub small">
          고객이나 청소 업체를 소개하고, 추천 링크로 들어온 분의 <b>첫 예약</b>마다 적립받으세요.
          <br />
          <b>30만원 계약이면 약 10,500원, 100만원이면 약 35,000원</b>이 내 적립금이에요.
        </p>

        <ReferralCalc />

        {loading && <p className="sub small" style={{ marginTop: 16 }}>불러오는 중…</p>}

        {!loading && !data && (
          <div className="card lg card-pad" style={{ marginTop: 16 }}>
            <b>로그인이 필요해요</b>
            <p className="tiny muted" style={{ marginTop: 4 }}>
              로그인하면 나만의 추천 코드·링크가 발급돼요.
            </p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* 추천 코드 · 링크 */}
            <div className="card lg card-pad" style={{ marginTop: 16 }}>
              <p className="tiny muted">내 추천 코드</p>
              <div className="flex between center gap-8" style={{ marginTop: 4 }}>
                <b className="price" style={{ letterSpacing: 2 }}>{data.code}</b>
                <button className="btn btn-ghost" style={{ padding: "6px 14px" }} onClick={() => doCopy(data.code, "code")}>
                  {copied === "code" ? "복사됨 ✓" : "코드 복사"}
                </button>
              </div>

              <p className="tiny muted" style={{ marginTop: 14 }}>추천 링크</p>
              <input
                className="input"
                readOnly
                value={data.link}
                onFocus={(e) => e.currentTarget.select()}
                style={{ marginTop: 4 }}
              />
              <div className="flex gap-8" style={{ marginTop: 8 }}>
                <button className="btn btn-ghost grow" onClick={() => doCopy(data.link, "link")}>
                  {copied === "link" ? "복사됨 ✓" : "링크 복사"}
                </button>
                <button className="btn btn-brand grow" onClick={() => share(data.link)}>공유하기</button>
              </div>
            </div>

            {/* 적립 요약 */}
            <div className="opt-grid" style={{ marginTop: 16 }}>
              <div className="card card-pad center-text">
                <b className="price">{data.summary.referredCustomers}명</b>
                <p className="tiny muted">추천 고객</p>
              </div>
              <div className="card card-pad center-text">
                <b className="price">{data.summary.referredPartners}곳</b>
                <p className="tiny muted">추천 업체</p>
              </div>
              <div className="card card-pad center-text">
                <b className="price">{formatKRW(data.summary.pending)}</b>
                <p className="tiny muted">지급 대기</p>
              </div>
              <div className="card card-pad center-text">
                <b className="price">{formatKRW(data.summary.paid)}</b>
                <p className="tiny muted">지급 완료</p>
              </div>
            </div>

            {/* 정산 계좌 */}
            <h3 style={{ fontWeight: 900, marginTop: 24 }}>💳 정산 계좌</h3>
            <p className="small muted" style={{ marginTop: 2 }}>적립금을 지급받을 계좌예요.</p>
            <div className="card lg card-pad" style={{ marginTop: 10 }}>
              <Field label="은행" required>
                <select className="input" value={bank} onChange={(e) => setBank(e.target.value)}>
                  <option value="">은행 선택</option>
                  {BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </Field>
              <Field label="예금주" required>
                <input className="input" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="예금주명" />
              </Field>
              <Field label="계좌번호" required>
                <input className="input" inputMode="numeric" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="'-' 없이 숫자만" />
              </Field>
              {msg && <p className="tiny" style={{ color: "var(--brand)", marginTop: 4 }}>{msg}</p>}
              <button className="btn btn-brand btn-block" style={{ marginTop: 8 }} disabled={!canSave || saving} onClick={savePayout}>
                {saving ? "저장 중…" : "정산 계좌 저장"}
              </button>
            </div>

            {/* 적립 내역 */}
            <h3 style={{ fontWeight: 900, marginTop: 24 }}>적립 내역</h3>
            {data.earnings.length === 0 ? (
              <div className="card card-pad center-text" style={{ marginTop: 10 }}>
                <p className="small muted">아직 적립 내역이 없어요. 링크를 공유해 첫 추천을 만들어보세요!</p>
              </div>
            ) : (
              <div className="stack-sm" style={{ marginTop: 10 }}>
                {data.earnings.map((e) => (
                  <div key={e.id} className="card card-pad flex between center gap-8">
                    <div className="grow" style={{ minWidth: 0 }}>
                      <b className="small">{e.sourceType === "customer" ? "🙋 고객" : "🧹 업체"} · {e.referredName || "익명"}</b>
                      <p className="tiny muted">{e.reservationId} · 견적 {formatKRW(e.quoteAmount)}</p>
                    </div>
                    <div className="right" style={{ whiteSpace: "nowrap" }}>
                      <b className="price">{formatKRW(e.amount)}</b>
                      <p className="tiny" style={{ color: e.status === "paid" ? "var(--brand)" : "var(--ink-soft)" }}>
                        {e.status === "paid" ? "지급 완료" : "지급 대기"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="tiny muted center-text" style={{ marginTop: 18, lineHeight: 1.6 }}>
              추천 대상당 첫 예약 1회 적립되며, 지급은 손길 운영팀이 정산 계좌로 처리해요.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
