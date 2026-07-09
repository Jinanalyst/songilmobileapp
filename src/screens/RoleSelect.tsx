import { useStore, type Role } from "../store";

function RoleCard({
  emoji,
  title,
  desc,
  bullets,
  cta,
  variant,
  onClick,
}: {
  emoji: string;
  title: string;
  desc: string;
  bullets: string[];
  cta: string;
  variant: "brand" | "ink" | "ghost";
  onClick: () => void;
}) {
  const btnCls =
    variant === "brand" ? "btn-brand" : variant === "ink" ? "btn-ink" : "btn-ghost";
  return (
    <div
      className="card lg card-pad rise-2"
      style={
        variant === "brand"
          ? { borderColor: "var(--brand-200)", boxShadow: "0 0 0 1px var(--brand-100)" }
          : undefined
      }
    >
      <div className="tile">{emoji}</div>
      <h2 className="title-lg" style={{ marginTop: 12, fontSize: "1.2rem" }}>
        {title}
      </h2>
      <p className="small muted" style={{ marginTop: 4 }}>
        {desc}
      </p>
      <ul className="stack-sm" style={{ margin: "14px 0 0", padding: 0, listStyle: "none" }}>
        {bullets.map((b) => (
          <li key={b} className="small muted flex gap-8">
            <span style={{ color: "var(--brand)" }}>✓</span>
            {b}
          </li>
        ))}
      </ul>
      <button className={`btn ${btnCls} btn-block`} style={{ marginTop: 18 }} onClick={onClick}>
        {cta}
      </button>
    </div>
  );
}

export default function RoleSelect() {
  const { session, chooseRole, requestPartnerApply } = useStore();
  const greeting = session.name || "회원";

  function pick(role: Role) {
    // 업체는 사업자 등록(심사) 후에만 이용 가능 → 등록 화면으로 유도
    if (role === "business") {
      requestPartnerApply();
      return;
    }
    chooseRole(role);
  }

  return (
    <div className="app-shell">
      <div className="pad">
        <div className="rise" style={{ textAlign: "center", marginTop: 12 }}>
          <p className="eyebrow">환영해요 👋</p>
          <h1 className="title-xl">{greeting}님, 어떻게 이용하실 건가요?</h1>
          <p className="sub">선택에 따라 딱 맞는 화면으로 안내해 드릴게요.</p>
        </div>

        <div className="stack" style={{ marginTop: 22 }}>
          <RoleCard
            emoji="🧑‍💼"
            title="고객으로 시작"
            desc="청소를 예약하고 진행 상태를 확인해요."
            bullets={["원하는 날짜에 청소 예약", "예약금 간편 결제", "예약 현황 조회"]}
            cta="고객으로 시작하기"
            variant="brand"
            onClick={() => pick("customer")}
          />
          <RoleCard
            emoji="🧹"
            title="청소 업체로 등록"
            desc="파트너 계정을 만들고 마켓플레이스에 입점해요."
            bullets={["업체 정보·정산 계좌 등록", "서류 심사 후 승인", "고객 예약 연결"]}
            cta="업체로 등록하기"
            variant="ink"
            onClick={() => pick("business")}
          />
          <RoleCard
            emoji="👀"
            title="아직 잘 모르겠어요"
            desc="먼저 앱을 구경하면서 천천히 둘러볼래요."
            bullets={["서비스·가격 둘러보기", "청소 파트너 후기 확인", "언제든 역할 전환 가능"]}
            cta="구경해 볼래요"
            variant="ghost"
            onClick={() => pick("guest")}
          />
        </div>

        <p className="tiny muted center-text" style={{ marginTop: 18 }}>
          나중에 언제든 계정 탭에서 다른 유형으로 바꿀 수 있어요.
        </p>
      </div>
    </div>
  );
}
