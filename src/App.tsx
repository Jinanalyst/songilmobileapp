import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./store";
import { initDeepLinkAuth } from "./oauth";
import Splash from "./screens/Splash";
import Intro from "./screens/Intro";
import Login from "./screens/Login";
import RoleSelect from "./screens/RoleSelect";
import Book from "./screens/Book";
import Partners from "./screens/Partners";
import Consult from "./screens/Consult";
import Account from "./screens/Account";
import PartnerApply from "./screens/PartnerApply";

type Tab = "account" | "partners" | "book" | "consult";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "account", label: "계정", icon: "👤" },
  { id: "partners", label: "파트너", icon: "🧹" },
  { id: "book", label: "예약", icon: "📅" },
  { id: "consult", label: "상담", icon: "💬" },
];

function Main() {
  const [tab, setTab] = useState<Tab>("book");
  const [bookKey, setBookKey] = useState(0);
  const [applyOpen, setApplyOpen] = useState(false);

  return (
    <div className="app-shell">
      {tab === "account" &&
        (applyOpen ? (
          <PartnerApply onBack={() => setApplyOpen(false)} />
        ) : (
          <Account onLogout={() => setTab("book")} onOpenApply={() => setApplyOpen(true)} />
        ))}
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
              if (t.id === "account") setApplyOpen(false);
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
