import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";

export type Role = "customer" | "business" | "guest";

// 앱에서 만든 제출물 로컬 캐시 (사용자별 서버 조회는 세션 쿠키 기반이라 앱에서 불가 →
// 내가 이 기기에서 넣은 신청을 여기에 저장해 "내 내역"으로 보여준다).
export type SavedReservation = {
  id: string;
  createdAt: string;
  serviceId: string;
  partnerId: string;
  date: string;
  timeSlot: string;
  pyeong: number;
  customerName: string;
};
export type SavedConsultation = {
  id: string;
  createdAt: string;
  serviceId: string;
  pyeong: number | null;
  preferredDate: string;
};
export type SavedApplication = {
  id: string;
  createdAt: string;
  companyName: string;
  services: string[];
};

type Session = {
  seenIntro: boolean;
  loggedIn: boolean;
  onboarded: boolean;
  role: Role;
  name: string;
  phone: string;
  email: string;
  provider: "kakao" | "google" | "email" | "simple" | null;
};

type Submissions = {
  reservations: SavedReservation[];
  consultations: SavedConsultation[];
  applications: SavedApplication[];
};

type Store = {
  session: Session;
  submissions: Submissions;
  seeIntro: () => void;
  loginSimple: (name: string, phone: string) => void;
  guestBrowse: () => void;
  setAuthUser: (name: string, email: string, provider: "kakao" | "google") => void;
  chooseRole: (role: Role) => void;
  logout: () => Promise<void>;
  saveReservation: (r: SavedReservation) => void;
  saveConsultation: (c: SavedConsultation) => void;
  saveApplication: (a: SavedApplication) => void;
};

const KEY = "songil-app-state-v2";

const DEFAULT_SESSION: Session = {
  seenIntro: false,
  loggedIn: false,
  onboarded: false,
  role: "guest",
  name: "",
  phone: "",
  email: "",
  provider: null,
};

type Persisted = { session: Session; submissions: Submissions };

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Persisted;
      return {
        session: { ...DEFAULT_SESSION, ...p.session },
        submissions: {
          reservations: p.submissions?.reservations ?? [],
          consultations: p.submissions?.consultations ?? [],
          applications: p.submissions?.applications ?? [],
        },
      };
    }
  } catch {
    /* noop */
  }
  return {
    session: DEFAULT_SESSION,
    submissions: { reservations: [], consultations: [], applications: [] },
  };
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* noop */
    }
  }, [state]);

  // Supabase OAuth 세션 동기화 (구글/카카오 로그인 시)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) {
        const meta = u.user_metadata ?? {};
        setState((s) => ({
          ...s,
          session: {
            ...s.session,
            loggedIn: true,
            name: s.session.name || meta.full_name || meta.name || "",
            email: u.email ?? s.session.email,
            provider: s.session.provider ?? "google",
          },
        }));
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      const u = sess?.user;
      if (u) {
        const meta = u.user_metadata ?? {};
        const prov =
          (u.app_metadata?.provider as "kakao" | "google" | "email") ?? "email";
        setState((s) => ({
          ...s,
          session: {
            ...s.session,
            loggedIn: true,
            name: s.session.name || meta.full_name || meta.name || "",
            email: u.email ?? s.session.email,
            provider: prov,
          },
        }));
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const store: Store = {
    session: state.session,
    submissions: state.submissions,
    seeIntro: () =>
      setState((s) => ({ ...s, session: { ...s.session, seenIntro: true } })),
    loginSimple: (name, phone) =>
      setState((s) => ({
        ...s,
        session: {
          ...s.session,
          loggedIn: true,
          provider: "simple",
          name: name.trim() || "회원",
          phone: phone.trim(),
        },
      })),
    guestBrowse: () =>
      setState((s) => ({
        ...s,
        session: {
          ...s.session,
          loggedIn: true,
          onboarded: true,
          role: "guest",
          provider: "simple",
          name: s.session.name || "게스트",
        },
      })),
    setAuthUser: (name, email, provider) =>
      setState((s) => ({
        ...s,
        session: {
          ...s.session,
          loggedIn: true,
          provider,
          name: name || s.session.name,
          email,
        },
      })),
    chooseRole: (role) =>
      setState((s) => ({
        ...s,
        session: { ...s.session, role, onboarded: true },
      })),
    logout: async () => {
      try {
        await supabase.auth.signOut();
      } catch {
        /* noop */
      }
      setState((s) => ({ ...s, session: { ...DEFAULT_SESSION, seenIntro: true } }));
    },
    saveReservation: (r) =>
      setState((s) => ({
        ...s,
        submissions: {
          ...s.submissions,
          reservations: [r, ...s.submissions.reservations],
        },
      })),
    saveConsultation: (c) =>
      setState((s) => ({
        ...s,
        submissions: {
          ...s.submissions,
          consultations: [c, ...s.submissions.consultations],
        },
      })),
    saveApplication: (a) =>
      setState((s) => ({
        ...s,
        submissions: {
          ...s.submissions,
          applications: [a, ...s.submissions.applications],
        },
      })),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}
