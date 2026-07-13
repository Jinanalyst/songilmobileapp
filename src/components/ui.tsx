import type { ReactNode } from "react";

export function AppBar({
  onBack,
  title,
  showLogo,
  onLogout,
}: {
  onBack?: () => void;
  title?: string;
  showLogo?: boolean;
  onLogout?: () => void;
}) {
  return (
    <div className="appbar">
      {onBack && (
        <button className="back" onClick={onBack} aria-label="뒤로">
          ‹
        </button>
      )}
      {showLogo && <img className="logo" src="logo-mark.png" alt="" />}
      <span className="title">{title ?? "손길"}</span>
      {onLogout && (
        <button
          className="btn btn-ghost"
          style={{ marginLeft: "auto", padding: "6px 14px", fontSize: "0.85rem" }}
          onClick={onLogout}
        >
          로그아웃
        </button>
      )}
    </div>
  );
}

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="label">
        {label}
        {required && <span className="req">*</span>}
      </span>
      {children}
    </label>
  );
}

export function Stars({ n }: { n: number }) {
  return <span className="star">{"★".repeat(Math.round(n))}</span>;
}

// 상태 진행 트래커
export function Tracker({ flow, current }: { flow: string[]; current: string }) {
  const idx = flow.indexOf(current);
  return (
    <div className="tracker">
      {flow.map((_, i) => (
        <span key={i} className={`step${i <= idx ? " on" : ""}`} />
      ))}
    </div>
  );
}
