import type { ReactNode } from "react";

export function AppBar({
  onBack,
  title,
  showLogo,
}: {
  onBack?: () => void;
  title?: string;
  showLogo?: boolean;
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
