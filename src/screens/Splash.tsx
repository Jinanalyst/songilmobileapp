import { useEffect } from "react";

export default function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1700);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="app-shell" onClick={onDone}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
        }}
      >
        <img
          src="logo-mark.png"
          alt="손길"
          className="rise"
          style={{ height: 108, width: 108 }}
        />
        <div className="rise-2" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
            손길
          </div>
          <div className="muted" style={{ marginTop: 4, fontWeight: 700, color: "var(--mint)" }}>
            마음을 담은 깨끗함
          </div>
        </div>
      </div>
      <p className="tiny muted center-text" style={{ paddingBottom: 28 }}>
        믿을 수 있는 청소, 사람이 이어드려요
      </p>
    </div>
  );
}
