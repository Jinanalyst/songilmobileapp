import { useEffect, useState } from "react";
import { formatKRW } from "../data";
import { type PartnerProfileApi } from "../partnerProfile";
import { AppBar, Field } from "../components/ui";
import {
  fetchPartnerPriceLists,
  savePartnerPrices,
  type PartnerPrice,
  type PartnerPriceList,
} from "../api";

function PriceEditor({
  item,
  saving,
  onSave,
  onClose,
}: {
  item: PartnerPrice;
  saving?: boolean;
  onSave: (patch: Partial<PartnerPrice>) => void;
  onClose: () => void;
}) {
  const [price, setPrice] = useState(String(item.startPrice));
  const [note, setNote] = useState(item.note);

  return (
    <div className="card lg card-pad" style={{ marginTop: 10, borderColor: "var(--brand-200)" }}>
      <b>{item.name} 단가 수정</b>
      <div style={{ marginTop: 12 }}>
        <Field label="시작 가격 (원)" required>
          <input className="input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="예) 60000" />
        </Field>
        <Field label="안내 문구">
          <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="고객에게 보여줄 설명" />
        </Field>
        <div className="flex gap-8">
          <button className="btn btn-ghost grow" onClick={onClose} disabled={saving}>취소</button>
          <button
            className="btn btn-brand grow"
            disabled={saving}
            onClick={() => {
              const n = parseInt(price.replace(/[^0-9]/g, ""), 10) || 0;
              onSave({ startPrice: n, note: note.trim() });
            }}
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PriceRow({
  item,
  busy,
  open,
  onToggle,
  onSave,
  onClose,
}: {
  item: PartnerPrice;
  busy?: boolean;
  open: boolean;
  onToggle: () => void;
  onSave: (patch: Partial<PartnerPrice>) => void;
  onClose: () => void;
}) {
  return (
    <div>
      <button
        className="card lg card-pad"
        style={{ width: "100%", textAlign: "left", display: "block" }}
        onClick={onToggle}
      >
        <div className="flex between center gap-8">
          <div className="grow" style={{ minWidth: 0 }}>
            <b>{item.name}</b>
            <p className="tiny muted" style={{ marginTop: 2 }}>{item.note}</p>
          </div>
          <div className="right" style={{ whiteSpace: "nowrap" }}>
            <span className="price">{formatKRW(item.startPrice)}~</span>
            <p className="tiny" style={{ color: "var(--brand)", marginTop: 2 }}>
              {busy ? "저장 중…" : "수정 ›"}
            </p>
          </div>
        </div>
      </button>
      {open && <PriceEditor item={item} saving={busy} onSave={onSave} onClose={onClose} />}
    </div>
  );
}

// 서버 연동 모드 — 승인된 파트너: 단가를 사이트와 동일한 DB 에 저장한다.
function ServerPriceList({ list }: { list: PartnerPriceList }) {
  const [prices, setPrices] = useState<PartnerPrice[]>(list.prices);
  const [editing, setEditing] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveItem(id: string, patch: Partial<PartnerPrice>) {
    const next = prices.map((p) => (p.id === id ? { ...p, ...patch } : p));
    setPrices(next);
    setEditing(null);
    setSavingId(id);
    setError(null);
    try {
      const saved = await savePartnerPrices(list.partnerId, next);
      setPrices(saved.prices);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <p className="eyebrow" style={{ marginBottom: 6 }}>{list.companyName}</p>
      <div className="notice-info">
        <span>👀</span>
        <span>아래 표는 <b>고객에게 보이는 화면</b>이에요. 각 항목을 눌러 가격과 문구를 수정하면 바로 저장돼요.</span>
      </div>
      {error && (
        <p className="tiny" style={{ color: "var(--danger, #d14343)", marginTop: 10 }}>{error}</p>
      )}
      <div className="stack" style={{ marginTop: 16 }}>
        {prices.map((p) => (
          <PriceRow
            key={p.id}
            item={p}
            busy={savingId === p.id}
            open={editing === p.id}
            onToggle={() => setEditing(editing === p.id ? null : p.id)}
            onSave={(patch) => saveItem(p.id, patch)}
            onClose={() => setEditing(null)}
          />
        ))}
      </div>
    </div>
  );
}

// 로컬 폴백 모드 — 아직 승인 파트너가 아닌 계정(데모): 이 기기에만 저장한다.
function LocalPriceList({ api }: { api: PartnerProfileApi }) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div style={{ marginTop: 20 }}>
      <div className="notice-info">
        <span>💾</span>
        <span>
          아직 승인된 파트너 계정이 아니라 단가가 <b>이 기기에만</b> 저장돼요.
          심사 승인 후 로그인하면 고객에게 실제로 노출됩니다.
        </span>
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        {api.prices.map((p) => (
          <PriceRow
            key={p.id}
            item={p}
            open={editing === p.id}
            onToggle={() => setEditing(editing === p.id ? null : p.id)}
            onSave={(patch) => {
              api.updatePrice(p.id, patch);
              setEditing(null);
            }}
            onClose={() => setEditing(null)}
          />
        ))}
      </div>
    </div>
  );
}

export default function PartnerQuotes({ api }: { api: PartnerProfileApi }) {
  const [loading, setLoading] = useState(true);
  const [serverLists, setServerLists] = useState<PartnerPriceList[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { lists, approved } = await fetchPartnerPriceLists();
        if (!alive) return;
        setServerLists(approved && lists.length > 0 ? lists : null);
      } catch {
        if (alive) setServerLists(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="screen">
      <AppBar showLogo title="단가 설정" />
      <div className="pad">
        <p className="eyebrow">고객 안내용 단가표</p>
        <h1 className="title-xl">우리 팀 시작가 안내</h1>
        <p className="sub small">
          서비스별 시작 가격을 정리해 두면, 고객이 예약 전에 대략적인 견적을 미리 확인할 수 있어요.
          최종 금액은 방문·상담 후 확정돼요.
        </p>

        {loading && <p className="sub small" style={{ marginTop: 16 }}>불러오는 중…</p>}

        {!loading && serverLists &&
          serverLists.map((list) => <ServerPriceList key={list.partnerId} list={list} />)}

        {!loading && !serverLists && <LocalPriceList api={api} />}

        <p className="tiny muted center-text" style={{ marginTop: 18, lineHeight: 1.6 }}>
          시작가는 공간 크기·오염도·요청사항에 따라 달라질 수 있으며,
          <br />실제 견적은 예약 요청 상세에서 개별로 발송돼요.
        </p>
      </div>
    </div>
  );
}
