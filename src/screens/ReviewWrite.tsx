import { useState } from "react";
import { partnerById, serviceById } from "../data";
import { createReview } from "../api";
import type { SavedReservation } from "../store";
import { AppBar, Field } from "../components/ui";
import PhotoPicker from "../components/PhotoPicker";

export default function ReviewWrite({
  reservation,
  onBack,
}: {
  reservation: SavedReservation;
  onBack: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const svc = serviceById(reservation.serviceId);
  const partner = partnerById(reservation.partnerId);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await createReview({ reservationId: reservation.id, rating, body: text.trim(), photos });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "후기 등록에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="screen">
        <AppBar onBack={onBack} title="후기 작성" />
        <div className="pad center-text">
          <div className="card lg card-pad rise" style={{ marginTop: 20 }}>
            <div className="tile" style={{ margin: "0 auto", background: "var(--emerald-50)" }}>💚</div>
            <h1 className="title-xl">후기 감사해요!</h1>
            <p className="sub small">
              소중한 후기가 등록됐어요. 다른 고객들이 믿고 예약하는 데 큰 도움이 돼요.
            </p>
            <button className="btn btn-brand btn-block" style={{ marginTop: 16 }} onClick={onBack}>
              내 예약으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <AppBar onBack={onBack} title="후기 작성" />
      <div className="pad">
        <div className="card card-pad flex gap-10 center">
          <span className="tile" style={{ height: 40, width: 40, fontSize: "1.2rem", borderRadius: 12 }}>{svc?.emoji}</span>
          <div>
            <b className="small">{svc?.name}</b>
            <p className="tiny muted">{partner?.name ?? ""} · {reservation.date}</p>
          </div>
        </div>

        <h2 className="title-lg" style={{ marginTop: 18 }}>서비스는 어떠셨나요?</h2>

        {/* 별점 */}
        <div className="flex gap-6" style={{ marginTop: 12, fontSize: "2.2rem", lineHeight: 1 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              style={{ border: "none", background: "transparent", padding: 0, color: n <= rating ? "var(--amber-400)" : "var(--line)" }}
              aria-label={`${n}점`}
            >
              ★
            </button>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 4 }}>
          {["", "아쉬워요", "그저 그래요", "괜찮아요", "좋아요", "최고예요"][rating]}
        </p>

        <div style={{ marginTop: 16 }}>
          <Field label="후기 (5자 이상)">
            <textarea
              className="input"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="어떤 점이 좋았는지, 청소 결과는 어땠는지 알려주세요."
            />
          </Field>

          <span className="label" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: 7 }}>
            사진 첨부
          </span>
          <p className="tiny muted" style={{ margin: "0 0 8px" }}>청소 전후 사진을 올리면 더 생생한 후기가 돼요.</p>
          <PhotoPicker photos={photos} onChange={setPhotos} max={4} label="후기 사진" />
        </div>

        {error && <p className="error-box" style={{ marginTop: 14 }}>{error}</p>}

        <button
          className="btn btn-brand btn-block"
          style={{ marginTop: 18 }}
          disabled={busy || text.trim().length < 5}
          onClick={submit}
        >
          {busy ? "등록 중…" : "후기 등록하기"}
        </button>
      </div>
    </div>
  );
}
