import { useState } from "react";
import { STATUS_META, serviceById, partnerById, formatKRW, DEPOSIT } from "../data";
import { useStore, type SavedReservation } from "../store";
import { AppBar } from "../components/ui";
import ReviewWrite from "./ReviewWrite";

export default function MyReservations({ onBack }: { onBack: () => void }) {
  const { submissions } = useStore();
  const rows = submissions.reservations;
  const [reviewing, setReviewing] = useState<SavedReservation | null>(null);

  if (reviewing) {
    return <ReviewWrite reservation={reviewing} onBack={() => setReviewing(null)} />;
  }

  return (
    <div className="screen">
      <AppBar onBack={onBack} title="내 예약" />
      <div className="pad">
        <h1 className="title-xl">내 예약 {rows.length}건</h1>
        <p className="sub small">이 기기에서 신청한 예약이에요. 상태는 접수 후 업체 배정에 따라 업데이트돼요.</p>

        {rows.length === 0 ? (
          <div className="card lg card-pad center-text" style={{ marginTop: 20 }}>
            <div className="tile" style={{ margin: "0 auto" }}>📅</div>
            <p className="muted small" style={{ marginTop: 10 }}>
              아직 예약이 없어요.
              <br />
              예약 탭에서 청소를 예약해 보세요.
            </p>
          </div>
        ) : (
          <div className="stack" style={{ marginTop: 16 }}>
            {rows.map((r) => {
              const svc = serviceById(r.serviceId);
              const p = partnerById(r.partnerId);
              const meta = STATUS_META.pending;
              return (
                <div key={r.id} className="card lg card-pad">
                  <div className="flex between center wrap gap-8">
                    <div className="flex center gap-8">
                      <span className="tile" style={{ height: 40, width: 40, fontSize: "1.2rem", borderRadius: 12 }}>
                        {svc?.emoji}
                      </span>
                      <div>
                        <b>{svc?.name}</b>
                        <p className="tiny muted">{r.id}</p>
                      </div>
                    </div>
                    <span className="badge tone-pending"><span className="dot" />{meta.label}</span>
                  </div>
                  <hr className="hr" />
                  <div className="flex between"><span className="muted small">방문일</span><b className="small">{r.date} {r.timeSlot}</b></div>
                  <div className="flex between mt-8"><span className="muted small">담당 업체</span><b className="small">{p?.name ?? "배정 중"}</b></div>
                  <div className="flex between mt-8"><span className="muted small">평수</span><b className="small">{r.pyeong}평</b></div>
                  <div className="flex between mt-8"><span className="muted small">예약금</span><b className="small price">{formatKRW(DEPOSIT)}</b></div>
                  <p className="notice" style={{ marginTop: 12 }}>{meta.desc}</p>
                  <button className="btn btn-outline btn-block" style={{ marginTop: 12 }} onClick={() => setReviewing(r)}>
                    ⭐ 후기 작성하기
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
