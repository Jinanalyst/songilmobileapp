import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./store";
import { initDeepLinkAuth } from "./oauth";
import { usePartnerJobs } from "./partner";
import { usePartnerProfile } from "./partnerProfile";
import Splash from "./screens/Splash";
import Intro from "./screens/Intro";
import Login from "./screens/Login";
import RoleSelect from "./screens/RoleSelect";
import Book from "./screens/Book";
import Partners from "./screens/Partners";
import Consult from "./screens/Consult";
import Account from "./screens/Account";
import PartnerJobs from "./screens/PartnerJobs";
import PartnerQuotes from "./screens/PartnerQuotes";
import PartnerAccount from "./screens/PartnerAccount";
import AdminReservations from "./screens/AdminReservations";
import AdminConsultations from "./screens/AdminConsultations";
import AdminApplications from "./screens/AdminApplications";
import { ADMIN_EMAIL } from "./config";

/* ── 고객·게스트 모드 ── */
type Tab = "account" | "partners" | "book" | "consult";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "account", label: "계정", icon: "👤" },
  { id: "partners", label: "파트너", icon: "🧹" },
  { id: "book", label: "예약", icon: "📅" },
  { id: "consult", label: "상담", icon: "💬" },
];

function CustomerShell() {
  const { session } = useStore();
  const [tab, setTab] = useState<Tab>(session.pendingApply ? "account" : "book");
  const [bookKey, setBookKey] = useState(0);

  return (
    <div className="app-shell">
      {tab === "account" && <Account onLogout={() => setTab("book")} startApply={session.pendingApply} />}
      {tab === "partners" && <Partners onConsult={() => setTab("consult")} />}
      {tab === "book" && <Book key={bookKey} onDone={() => setTab("account")} />}
      {tab === "consult" && <Consult />}

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => {
              if (t.id === "book" && tab === "book") setBookKey((k) => k + 1);
              setTab(t.id);
            }}
          >
            <span className="ic">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ── 업체(파트너) 모드 ── */
type PTab = "jobs" | "quotes" | "account";

const PTABS: { id: PTab; label: string; icon: string }[] = [
  { id: "jobs", label: "예약", icon: "📅" },
  { id: "quotes", label: "견적", icon: "🧾" },
  { id: "account", label: "계정", icon: "👤" },
];

function PartnerShell() {
  const { submissions } = useStore();
  const jobsApi = usePartnerJobs(submissions.reservations);
  const profileApi = usePartnerProfile();
  const [tab, setTab] = useState<PTab>("jobs");

  return (
    <div className="app-shell">
      {tab === "jobs" && <PartnerJobs api={jobsApi} />}
      {tab === "quotes" && <PartnerQuotes api={profileApi} />}
      {tab === "account" && <PartnerAccount api={profileApi} onLogout={() => setTab("jobs")} />}

      <nav className="tabbar">
        {PTABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            <span className="ic">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ── 운영자(관리자) 모드 ── */
type ATab = "reservations" | "consultations" | "applications";

const ATABS: { id: ATab; label: string; icon: string }[] = [
  { id: "reservations", label: "예약", icon: "📅" },
  { id: "consultations", label: "상담", icon: "💬" },
  { id: "applications", label: "심사", icon: "🏢" },
];

function AdminShell() {
  const [tab, setTab] = useState<ATab>("reservations");
  return (
    <div className="app-shell">
      {tab === "reservations" && <AdminReservations />}
      {tab === "consultations" && <AdminConsultations />}
      {tab === "applications" && <AdminApplications />}

      <nav className="tabbar">
        {ATABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            <span className="ic">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Main() {
  const { session } = useStore();
  // 운영자 계정으로 로그인하면 관리자 콘솔 (사이트와 동일 데이터).
  if (session.email && session.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return <AdminShell />;
  }
  return session.role === "business" ? <PartnerShell /> : <CustomerShell />;
}

function Root() {
  const { session, seeIntro } = useStore();
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) return <Splash onDone={() => setSplashDone(true)} />;
  if (!session.seenIntro) return <Intro onDone={seeIntro} />;
  if (!session.loggedIn) return <Login />;
  if (!session.onboarded) return <RoleSelect />;
  return <Main />;
}

export default function App() {
  useEffect(() => {
    initDeepLinkAuth();
  }, []);
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}
