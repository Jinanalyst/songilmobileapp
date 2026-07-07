import { useRef, useState } from "react";
import { useStore } from "../store";
import { AppBar, Field } from "../components/ui";

// 이미지를 정사각형 ~256px JPEG data URL 로 리사이즈 (localStorage 용량 절약)
function fileToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfileEdit({ onBack }: { onBack: () => void }) {
  const { session, updateProfile } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(session.name);
  const [phone, setPhone] = useState(session.phone);
  const [address, setAddress] = useState(session.address);
  const [addressDetail, setAddressDetail] = useState(session.addressDetail);
  const [photo, setPhoto] = useState(session.photo);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isCustomer = session.role === "customer";

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const url = await fileToAvatar(file);
      setPhoto(url);
    } catch {
      setError("사진을 불러오지 못했어요. 다른 사진으로 시도해 주세요.");
    }
  }

  function save() {
    updateProfile({ name: name.trim(), phone: phone.trim(), address, addressDetail, photo });
    setSaved(true);
    setTimeout(onBack, 600);
  }

  return (
    <div className="screen">
      <AppBar onBack={onBack} title="프로필 편집" />
      <div className="pad">
        {/* 사진 */}
        <div className="center-text">
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              height: 104,
              width: 104,
              borderRadius: 999,
              margin: "0 auto",
              overflow: "hidden",
              background: "var(--brand-100)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              position: "relative",
            }}
          >
            {photo ? (
              <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "2.4rem", fontWeight: 900, color: "var(--brand-700)" }}>
                {(name || "손")[0]}
              </span>
            )}
          </div>
          <button
            className="tiny"
            style={{ border: "none", background: "transparent", color: "var(--brand)", fontWeight: 700, marginTop: 8 }}
            onClick={() => fileRef.current?.click()}
          >
            사진 {photo ? "변경" : "추가"}
          </button>
          {photo && (
            <button
              className="tiny muted"
              style={{ border: "none", background: "transparent", marginLeft: 10 }}
              onClick={() => setPhoto("")}
            >
              삭제
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
        </div>

        <div className="card lg card-pad" style={{ marginTop: 18 }}>
          <Field label="이름" required>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
          </Field>
          <Field label="연락처">
            <input className="input" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" />
          </Field>

          {isCustomer && (
            <>
              <Field label="주소">
                <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="서울 마포구 월드컵북로 120" />
              </Field>
              <Field label="상세 주소">
                <input className="input" value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} placeholder="302동 1104호" />
              </Field>
              <p className="tiny muted">저장한 주소는 예약할 때 자동으로 채워져요.</p>
            </>
          )}

          {error && <p className="error-box" style={{ marginTop: 12 }}>{error}</p>}

          <button
            className="btn btn-brand btn-block"
            style={{ marginTop: 16 }}
            disabled={!name.trim() || saved}
            onClick={save}
          >
            {saved ? "저장됐어요 ✓" : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
