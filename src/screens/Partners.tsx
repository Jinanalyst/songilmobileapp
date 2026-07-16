import { useEffect, useState } from "react";
import { PARTNERS, reviewsFor, type Partner, type Review } from "../data";
import { fetchApprovedPartners, fetchReviews, type ApprovedPartner } from "../api";
import { AppBar, Stars } from "../components/ui";

function WorkPhotos({ labels }: { labels: string[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
      {labels.slice(0, 3).map((label, i) => (
        <div key={label} className={`photo p${(i % 3) + 1}`}>
          {label}
        </div>
      ))}
    </div>
  );
}

function PartnerCard({ p, onOpen }: { p: Partner; onOpen: () => void }) {
  return (
    <div className="card lg card-pad">
      <div className="flex gap-12">
        <div className={`avatar ${p.accent}`}>{p.name.slice(0, 1)}</div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="flex wrap center gap-8">
            <b style={{ fontSize: "1.05rem" }}>{p.name}</b>
            <span className="star small">★ {p.rating}</span>
            <span className="tiny muted">후기 {p.reviews}개</span>
          </div>
          <p className="small" style={{ color: "var(--brand-600)", fontWeight: 600, marginTop: 2 }}>
            {p.tagline}
          </p>
        </div>
      </div>
      <div className="flex wrap gap-6" style={{ marginTop: 12 }}>
        {p.verifications.map((v) => (
          <span key={v} className="badge badge-verify">✓ {v}</span>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <WorkPhotos labels={p.photos} />
      </div>
      <div className="small" style={{ marginTop: 12 }}>
        <b>활동 지역</b>
        <p className="muted" style={{ margin: "2px 0 0" }}>{p.regions.join(", ")}</p>
      </div>
      <div className="flex wrap gap-6" style={{ marginTop: 10 }}>
        {p.specialties.map((s) => (
          <span key={s} className="chip">{s}</span>
        ))}
      </div>
      <button className="btn btn-ink btn-block" style={{ marginTop: 16 }} onClick={onOpen}>
        업체 보기
      </button>
    </div>
  );
}

function ApprovedCard({ p }: { p: ApprovedPartner }) {
  return (
    <div className="card lg card-pad">
      <div className="flex gap-12">
        <div className="avatar acc-emerald">{p.companyName.slice(0, 1)}</div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="flex wrap center gap-8">
            <b style={{ fontSize: "1.05rem" }}>{p.companyName}</b>
            <span className="badge badge-verify">✓ 인증 완료</span>
          </div>
          {p.regions && <p className="small muted" style={{ marginTop: 2 }}>📍 {p.regions}</p>}
        </div>
      </div>
      {p.intro && <p className="small" style={{ marginTop: 10, lineHeight: 1.6 }}>{p.intro}</p>}
      {p.photos.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto" }}>
          {p.photos.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              style={{ width: 108, height: 108, objectFit: "cover", borderRadius: 12, flexShrink: 0 }}
            />
          ))}
        </div>
      )}
      <div className="flex wrap gap-6" style={{ marginTop: 10 }}>
        {p.services.map((s) => (
          <span key={s} className="chip">{s}</span>
        ))}
      </div>
    </div>
  );
}

function Detail({ p, onBack, onConsult }: { p: Partner; onBack: () => void; onConsult: () => void }) {
  const [reviews, setReviews] = useState<Review[]>(reviewsFor(p.id));
  useEffect(() => {
    let alive = true;
    fetchReviews(p.id).then((live) => {
      if (alive && live.length) setReviews(live);
    });
    return () => {
      alive = false;
    };
  }, [p.id]);

  return (
    <div className="screen">
      <AppBar onBack={onBack} title="업체 상세" />
      <div className="pad">
        <div className="flex gap-12 center">
          <div className={`avatar ${p.accent}`} style={{ height: 64, width: 64, fontSize: "1.5rem" }}>
            {p.name.slice(0, 1)}
          </div>
          <div>
            <h1 className="title-lg">{p.name}</h1>
            <p className="small" style={{ color: "var(--brand-600)", fontWeight: 600 }}>{p.tagline}</p>
          </div>
        </div>

        <div className="flex wrap gap-6" style={{ marginTop: 14 }}>
          {p.verifications.map((v) => (
            <span key={v} className="badge badge-verify">✓ {v}</span>
          ))}
        </div>

        <div className="card card-pad" style={{ marginTop: 14 }}>
          <div className="flex between center-text">
            <div className="grow">
              <div className="star" style={{ fontSize: "1.2rem" }}>{p.rating}</div>
              <div className="tiny muted">평점</div>
            </div>
            <div className="grow">
              <div style={{ fontWeight: 900, fontSize: "1.2rem" }}>{p.jobs.toLocaleString()}</div>
              <div className="tiny muted">누적 작업</div>
            </div>
            <div className="grow">
              <div style={{ fontWeight: 900, fontSize: "1.2rem" }}>{p.reviews}</div>
              <div className="tiny muted">후기</div>
            </div>
            <div className="grow">
              <div style={{ fontWeight: 900, fontSize: "1.2rem" }}>{p.since}</div>
              <div className="tiny muted">시작 연도</div>
            </div>
          </div>
        </div>

        <p className="sub" style={{ marginTop: 14 }}>{p.intro}</p>

        <h3 style={{ fontWeight: 900, marginTop: 20 }}>대표 작업 사진</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          {p.photos.map((label, i) => (
            <div key={label} className={`photo p${(i % 3) + 1}`} style={{ aspectRatio: "4/3" }}>{label}</div>
          ))}
        </div>

        <h3 style={{ fontWeight: 900, marginTop: 20 }}>가능한 서비스</h3>
        <div className="flex wrap gap-6" style={{ marginTop: 10 }}>
          {p.specialties.map((s) => (
            <span key={s} className="chip">{s}</span>
          ))}
        </div>

        {(p.phone || p.linkedin) && (
          <>
            <h3 style={{ fontWeight: 900, marginTop: 20 }}>연락처</h3>
            <div className="stack" style={{ marginTop: 10 }}>
              {p.phone && (
                <a
                  className="card card-pad"
                  href={`tel:${p.phone.replace(/-/g, "")}`}
                  style={{ fontWeight: 700, color: "var(--brand-600)", textDecoration: "none" }}
                >
                  📞 {p.phone}
                </a>
              )}
              {p.linkedin && (
                <a
                  className="card card-pad"
                  href={p.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: 700, color: "var(--brand-600)", textDecoration: "none" }}
                >
                  🔗 링크드인 프로필 보기
                </a>
              )}
            </div>
          </>
        )}

        <h3 style={{ fontWeight: 900, marginTop: 20 }}>고객 후기 {reviews.length}건</h3>
        <div className="stack" style={{ marginTop: 10 }}>
          {reviews.map((r, i) => (
            <div key={i} className="card card-pad">
              <div className="flex between center">
                <b>{r.author}</b>
                <span className="tiny muted">{r.date}</span>
              </div>
              <div className="flex gap-8 center" style={{ marginTop: 2 }}>
                <Stars n={r.rating} />
                <span className="tiny muted">{r.service}</span>
              </div>
              <p className="small" style={{ marginTop: 8, lineHeight: 1.6 }}>{r.text}</p>
              {r.photos && r.photos.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto" }}>
                  {r.photos.map((src, j) => (
                    <img key={j} src={src} alt="" style={{ width: 92, height: 92, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="btn btn-outline btn-block" style={{ marginTop: 18 }} onClick={onConsult}>
          견적이 궁금하면 상담하기
        </button>
      </div>
    </div>
  );
}

export default function Partners({ onConsult }: { onConsult: () => void }) {
  const [open, setOpen] = useState<Partner | null>(null);
  const [approved, setApproved] = useState<ApprovedPartner[]>([]);

  useEffect(() => {
    fetchApprovedPartners().then(setApproved);
  }, []);

  if (open) return <Detail p={open} onBack={() => setOpen(null)} onConsult={onConsult} />;

  return (
    <div className="screen">
      <AppBar showLogo title="청소 파트너" />
      <div className="pad">
        <p className="eyebrow">청소 파트너</p>
        <h1 className="title-xl">손길이 직접 검증한 업체들</h1>
        <p className="sub">
          후기와 이력을 확인하고 마음에 드는 팀을 지정할 수 있어요. 모든 파트너는
          사업자·신원·리뷰 검증을 거쳤어요.
        </p>
        <div className="stack" style={{ marginTop: 18 }}>
          {PARTNERS.map((p) => (
            <PartnerCard key={p.id} p={p} onOpen={() => setOpen(p)} />
          ))}
          {approved.map((p) => (
            <ApprovedCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
