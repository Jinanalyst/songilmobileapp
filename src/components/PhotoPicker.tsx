import { useRef } from "react";

// 이미지를 최대 1024px, JPEG 0.8 data URL 로 리사이즈 (업로드 용량 절감)
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1024;
        let { width, height } = img;
        if (width > max || height > max) {
          const ratio = Math.min(max / width, max / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoPicker({
  photos,
  onChange,
  max = 4,
  label = "사진 추가",
}: {
  photos: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const room = max - photos.length;
    const chosen = files.slice(0, room);
    const urls: string[] = [];
    for (const f of chosen) {
      try {
        urls.push(await fileToDataUrl(f));
      } catch {
        /* skip */
      }
    }
    onChange([...photos, ...urls]);
    if (ref.current) ref.current.value = "";
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {photos.map((p, i) => (
          <div
            key={i}
            style={{ position: "relative", width: 76, height: 76, borderRadius: 12, overflow: "hidden" }}
          >
            <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              onClick={() => onChange(photos.filter((_, idx) => idx !== i))}
              aria-label="삭제"
              style={{
                position: "absolute",
                top: 3,
                right: 3,
                width: 20,
                height: 20,
                borderRadius: 999,
                border: "none",
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                fontSize: 12,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            onClick={() => ref.current?.click()}
            style={{
              width: 76,
              height: 76,
              borderRadius: 12,
              border: "1.5px dashed var(--line)",
              background: "var(--cream)",
              color: "var(--ink-soft)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              gap: 2,
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>＋</span>
            {label}
          </button>
        )}
      </div>
      <p className="tiny muted" style={{ marginTop: 6 }}>
        최대 {max}장 · {photos.length}/{max}
      </p>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={onPick} />
    </div>
  );
}
