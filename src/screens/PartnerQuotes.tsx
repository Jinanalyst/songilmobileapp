import { useState } from "react";
import { formatKRW } from "../data";
import { type PartnerProfileApi, type PriceItem } from "../partnerProfile";
import { AppBar, Field } from "../components/ui";

function PriceEditor({
  item,
  onSave,
  onClose,
}: {
  item: PriceItem;
  onSave: (patch: Partial<PriceItem>) => void;
  onClose: () => void;
}) {
  const [price, setPrice] = useState(String(item.startPrice));
  const [note, setNote] = useState(item.note);

  return (
    <div className="card lg card-pad" style={{ marginTop: 10, borderColor: "var(--brand-200)" }}>
      <b>{item.name} 견적 수정</b>
      <div style={{ marginTop: 12 }}>
        <Field label="시작 가격 (원)" required>
          <input className="input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="예) 60000" />
        </Field>
        <Field label="안내 문구">
          <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="고객에게 보여줄 설명" />
        </Field>
        <div className="flex gap-8">
          <button className="btn btn-ghost grow" onClick={onClose}>취소</button>
          <button
            className="btn btn-brand grow"
            onClick={() => {
              const n = parseInt(price.replace(/[^0-9]/g, ""), 10) || 0;
              onSave({ startPrice: n, note: note.trim() });
              onClose();
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PartnerQuotes({ api }: { api: PartnerProfileApi }) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="screen">
      <AppBar showLogo title="견적 안내" />
      <div className="pad">
        <p className="eyebrow">고객 안내용 견적표</p>
        <h1 className="title-xl">우리 팀 시작가 안내</h1>
        <p className="sub small">
          서비스별 시작 가격을 정리해 두면, 고객이 예약 전에 대략적인 견적을 미리 확인할 수 있어요.
          최종 금액은 방문·상담 후 확정돼요.
        </p>

        <div className="notice-info" style={{ marginTop: 16 }}>
          <span>👀</span>
          <span>아래 표는 <b>고객에게 보이는 화면</b>이에요. 각 항목을 눌러 가격과 문구를 수정하세요.</span>
        </div>

        <div className="stack" style={{ marginTop: 16 }}>
          {api.prices.map((p) => (
            <div key={p.id}>
              <button
                className="card lg card-pad"
                style={{ width: "100%", textAlign: "left", display: "block" }}
                onClick={() => setEditing(editing === p.id ? null : p.id)}
              >
                <div className="flex between center gap-8">
                  <div className="grow" style={{ minWidth: 0 }}>
                    <b>{p.name}</b>
                    <p className="tiny muted" style={{ marginTop: 2 }}>{p.note}</p>
                  </div>
                  <div className="right" style={{ whiteSpace: "nowrap" }}>
                    <span className="price">{formatKRW(p.startPrice)}~</span>
                    <p className="tiny" style={{ color: "var(--brand)", marginTop: 2 }}>수정 ›</p>
                  </div>
                </div>
              </button>
              {editing === p.id && (
                <PriceEditor
                  item={p}
                  onSave={(patch) => api.updatePrice(p.id, patch)}
                  onClose={() => setEditing(null)}
                />
              )}
            </div>
          ))}
        </div>

        <p className="tiny muted center-text" style={{ marginTop: 18, lineHeight: 1.6 }}>
          시작가는 공간 크기·오염도·요청사항에 따라 달라질 수 있으며,
          <br />실제 견적은 예약 요청 상세에서 개별로 발송돼요.
        </p>
      </div>
    </div>
  );
}
