import { useState } from "react";
import { COMPANY } from "../data";
import { useStore, type Role } from "../store";
import {
  PARTNER_REVIEWS,
  type PartnerProfileApi,
} from "../partnerProfile";
import { AppBar, Field, Stars } from "../components/ui";
import PhotoPicker from "../components/PhotoPicker";

const ROLE_LABEL: Record<Role, string> = {
  customer: "고객",
  business: "청소 파트너(업체)",
  guest: "둘러보는 중",
};

/* 업체 정보 편집 */
function ProfileEditor({ api, onClose }: { api: PartnerProfileApi; onClose: () => void }) {
  const [f, setF] = useState(api.profile);
  return (
    <div className="card lg card-pad" style={{ marginTop: 12, borderColor: "var(--brand-200)" }}>
      <b>업체 정보 편집</b>
      <div style={{ marginTop: 12 }}>
        <Field label="업체명" required>
          <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="서비스 지역">
          <input className="input" value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} placeholder="서울 강남구, 서초구" />
        </Field>
        <Field label="전문 분야">
          <input className="input" value={f.specialties} onChange={(e) => setF({ ...f, specialties: e.target.value })} placeholder="가정 정기청소, 입주청소" />
        </Field>
        <Field label="업체 소개">
          <textarea className="input" rows={3} value={f.intro} onChange={(e) => setF({ ...f, intro: e.target.value })} />
        </Field>
        <div className="field">
          <span className="label" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: 7 }}>
            업체 사진
          </span>
          <p className="tiny muted" style={{ margin: "0 0 8px" }}>
            작업 사진·시공 전후·팀 사진을 올리면 고객에게 신뢰를 줄 수 있어요.
          </p>
          <PhotoPicker photos={f.photos} onChange={(next) => setF({ ...f, photos: next })} max={6} label="업체 사진" />
        </div>
        <div className="flex gap-8">
          <button className="btn btn-ghost grow" onClick={onClose}>취소</button>
          <button className="btn btn-brand grow" onClick={() => { api.updateProfile(f); onClose(); }}>저장</button>
        </div>
      </div>
    </div>
  );
}

/* 후기 답변 */
function ReviewReply({ api }: { api: PartnerProfileApi }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  return (
    <div className="stack" style={{ marginTop: 12 }}>
      {PARTNER_REVIEWS.map((rv) => {
        const reply = api.replies[rv.id];
        const draft = drafts[rv.id] ?? "";
        return (
          <div key={rv.id} className="card lg card-pad">
            <div className="flex between center">
              <b className="small">{rv.author}</b>
              <span className="tiny muted">{rv.date}</span>
            </div>
            <div className="flex center gap-6" style={{ marginTop: 2 }}>
              <Stars n={rv.rating} />
              <span className="tiny muted">{rv.service}</span>
            </div>
            <p className="small" style={{ marginTop: 8, lineHeight: 1.6 }}>{rv.text}</p>

            {reply ? (
              <div className="notice" style={{ marginTop: 12 }}>
                <b className="tiny" style={{ color: "var(--brand)" }}>사장님 답변</b>
                <p style={{ margin: "4px 0 0" }}>{reply}</p>
                <button
                  className="tiny"
                  style={{ border: "none", background: "transparent", color: "var(--ink-soft)", marginTop: 6, padding: 0, textDecoration: "underline" }}
                  onClick={() => setDrafts((d) => ({ ...d, [rv.id]: reply }))}
                >
                  답변 수정
                </button>
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <textarea
                  className="input"
                  rows={2}
                  value={draft}
                  onChange={(e) => setDrafts((d) => ({ ...d, [rv.id]: e.target.value }))}
                  placeholder="고객 후기에 감사 인사를 남겨보세요."
                />
                <button
                  className="btn btn-outline btn-block"
                  style={{ marginTop: 8 }}
                  disabled={!draft.trim()}
                  onClick={() => { api.setReply(rv.id, draft.trim()); setDrafts((d) => ({ ...d, [rv.id]: "" })); }}
                >
                  답변 등록
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* 소식통(공지) */
function News({ api }: { api: PartnerProfileApi }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  return (
    <div style={{ marginTop: 12 }}>
      <div className="card lg card-pad">
        <b>새 소식 작성</b>
        <div style={{ marginTop: 12 }}>
          <Field label="제목" required>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 7월 입주청소 예약 오픈" />
          </Field>
          <Field label="내용">
            <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="고객에게 전할 소식을 적어주세요." />
          </Field>
          <button
            className="btn btn-brand btn-block"
            disabled={!title.trim()}
            onClick={() => { api.addAnnouncement(title.trim(), text.trim()); setTitle(""); setText(""); }}
          >
            소식 발행하기
          </button>
        </div>
      </div>

      {api.announcements.length > 0 && (
        <div className="stack" style={{ marginTop: 12 }}>
          {api.announcements.map((a) => (
            <div key={a.id} className="card card-pad">
              <div className="flex between center">
                <b className="small">📣 {a.title}</b>
                <span className="tiny muted">{a.date}</span>
              </div>
              {a.text && <p className="small muted" style={{ marginTop: 6, lineHeight: 1.6 }}>{a.text}</p>}
              <button
                className="tiny"
                style={{ border: "none", background: "transparent", color: "var(--rose-600)", marginTop: 8, padding: 0, textDecoration: "underline" }}
                onClick={() => api.removeAnnouncement(a.id)}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PartnerAccount({
  api,
  onLogout,
}: {
  api: PartnerProfileApi;
  onLogout: () => void;
}) {
  const { session, chooseRole, logout } = useStore();
  const [editing, setEditing] = useState(false);

  async function handleLogout() {
    await logout();
    onLogout();
  }

  return (
    <div className="screen">
      <AppBar showLogo title="업체 계정" />
      <div className="pad">
        {/* 업체 프로필 */}
        <div className="card lg card-pad">
          <div className="flex gap-12 center">
            <span className="avatar acc-emerald" style={{ height: 56, width: 56, borderRadius: 999 }}>
              {(api.profile.name || "손")[0]}
            </span>
            <div className="grow" style={{ minWidth: 0 }}>
              <b style={{ fontSize: "1.1rem" }}>{api.profile.name}</b>
              <p className="tiny muted" style={{ marginTop: 2 }}>청소 파트너(업체) · {session.name || "사장님"}</p>
              <p className="tiny muted">📍 {api.profile.region}</p>
            </div>
          </div>
          <p className="small muted" style={{ marginTop: 12, lineHeight: 1.6 }}>{api.profile.intro}</p>
          <div className="opt-grid" style={{ marginTop: 10 }}>
            {api.profile.specialties.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
              <span key={s} className="chip">{s}</span>
            ))}
          </div>
          {api.profile.photos.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto" }}>
              {api.profile.photos.map((p, i) => (
                <img
                  key={i}
                  src={p}
                  alt=""
                  style={{ width: 92, height: 92, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                />
              ))}
            </div>
          )}
          {!editing && (
            <button className="btn btn-ghost btn-block" style={{ marginTop: 14 }} onClick={() => setEditing(true)}>
              업체 정보 편집
            </button>
          )}
        </div>
        {editing && <ProfileEditor api={api} onClose={() => setEditing(false)} />}

        {/* 후기 관리 */}
        <h3 style={{ fontWeight: 900, marginTop: 24 }}>후기 관리</h3>
        <p className="small muted" style={{ marginTop: 2 }}>고객 후기에 답변을 남기면 신뢰도가 올라가요.</p>
        <ReviewReply api={api} />

        {/* 소식통 */}
        <h3 style={{ fontWeight: 900, marginTop: 24 }}>소식통</h3>
        <p className="small muted" style={{ marginTop: 2 }}>이벤트·휴무·예약 오픈 소식을 고객에게 전해요.</p>
        <News api={api} />

        {/* 이용 유형 전환 */}
        <h3 style={{ fontWeight: 900, marginTop: 24 }}>이용 유형</h3>
        <p className="small muted" style={{ marginTop: 2 }}>언제든 다른 유형으로 바꿀 수 있어요.</p>
        <div className="opt-grid" style={{ marginTop: 10 }}>
          {(["customer", "business", "guest"] as Role[]).map((r) => (
            <button key={r} className={`opt${session.role === r ? " sel" : ""}`} onClick={() => chooseRole(r)}>
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>

        <button className="btn btn-ghost btn-block" style={{ marginTop: 18 }} onClick={handleLogout}>로그아웃</button>
        <p className="tiny muted center-text" style={{ marginTop: 14 }}>© 2026 {COMPANY.service} · {COMPANY.bizName}</p>
      </div>
    </div>
  );
}
