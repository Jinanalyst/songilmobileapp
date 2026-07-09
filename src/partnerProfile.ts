// 업체(파트너) 계정 상태 — 업체 정보, 후기 답변, 소식통(공지), 고객 안내용 견적표.
// 데모용으로 이 기기 localStorage 에 저장한다.
import { useEffect, useState } from "react";
import { SERVICE_INFO } from "./data";

export type PartnerProfile = {
  name: string;
  region: string;
  specialties: string;
  intro: string;
  photos: string[]; // 업체 대표 사진 (data URL)
};

export type Announcement = { id: string; date: string; title: string; text: string };

export type PriceItem = { id: string; name: string; startPrice: number; note: string };

export type PartnerReview = {
  id: string;
  author: string;
  rating: number;
  date: string;
  service: string;
  text: string;
};

// 답변 대상 데모 후기 (고객이 남긴 후기)
export const PARTNER_REVIEWS: PartnerReview[] = [
  {
    id: "rv-1",
    author: "김서연",
    rating: 5,
    date: "2026.06.24",
    service: "가정 정기청소",
    text: "주방 후드랑 화장실 물때까지 반짝반짝해졌어요. 반려묘 두 마리 있는데도 털 하나 없이 정리해 주셨습니다. 재예약 확정!",
  },
  {
    id: "rv-2",
    author: "박지우",
    rating: 4,
    date: "2026.05.29",
    service: "가정 정기청소",
    text: "꼼꼼하게 잘해주세요. 예상보다 시간이 조금 초과됐는데 끝까지 마무리해 주셨어요. 창틀만 조금 더 신경 써주시면 완벽할 듯!",
  },
  {
    id: "rv-3",
    author: "정우진",
    rating: 5,
    date: "2026.06.20",
    service: "입주청소",
    text: "입주청소 맡겼는데 진짜 새집 같아요. 전후 사진 다 남겨주셔서 뭘 했는지 명확했어요. 베란다 곰팡이도 싹 사라졌습니다.",
  },
];

type Persisted = {
  profile: PartnerProfile;
  replies: Record<string, string>;
  announcements: Announcement[];
  prices: PriceItem[];
};

const KEY = "songil-partner-profile-v1";

const DEFAULT_PROFILE: PartnerProfile = {
  name: "우리 청소팀",
  region: "서울 전역 · 경기 남부",
  specialties: "가정 정기청소, 입주청소, 부분 청소",
  intro: "'남의 집이 아니라 우리 집처럼'을 원칙으로 일하는 팀이에요. 편하게 맡겨 주세요.",
  photos: [],
};

const DEFAULT_PRICES: PriceItem[] = SERVICE_INFO.map((s, i) => ({
  id: `p${i}`,
  name: s.name,
  startPrice: s.startPrice,
  note: s.desc,
}));

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    date: "2026-07-01",
    title: "7월 입주청소 예약 오픈",
    text: "여름 성수기 입주청소 일정을 오픈했어요. 주말은 조기 마감되니 서둘러 예약해 주세요!",
  },
];

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Persisted>;
      return {
        profile: { ...DEFAULT_PROFILE, ...p.profile },
        replies: p.replies ?? {},
        announcements: p.announcements ?? DEFAULT_ANNOUNCEMENTS,
        prices: p.prices ?? DEFAULT_PRICES,
      };
    }
  } catch {
    /* noop */
  }
  return {
    profile: DEFAULT_PROFILE,
    replies: {},
    announcements: DEFAULT_ANNOUNCEMENTS,
    prices: DEFAULT_PRICES,
  };
}

export type PartnerProfileApi = {
  profile: PartnerProfile;
  updateProfile: (patch: Partial<PartnerProfile>) => void;
  replies: Record<string, string>;
  setReply: (reviewId: string, text: string) => void;
  announcements: Announcement[];
  addAnnouncement: (title: string, text: string) => void;
  removeAnnouncement: (id: string) => void;
  prices: PriceItem[];
  updatePrice: (id: string, patch: Partial<PriceItem>) => void;
};

export function usePartnerProfile(): PartnerProfileApi {
  const [state, setState] = useState<Persisted>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* noop */
    }
  }, [state]);

  return {
    profile: state.profile,
    updateProfile: (patch) =>
      setState((s) => ({ ...s, profile: { ...s.profile, ...patch } })),
    replies: state.replies,
    setReply: (reviewId, text) =>
      setState((s) => ({ ...s, replies: { ...s.replies, [reviewId]: text } })),
    announcements: state.announcements,
    addAnnouncement: (title, text) =>
      setState((s) => ({
        ...s,
        announcements: [
          { id: `ann-${Date.now()}`, date: new Date().toISOString().slice(0, 10), title, text },
          ...s.announcements,
        ],
      })),
    removeAnnouncement: (id) =>
      setState((s) => ({
        ...s,
        announcements: s.announcements.filter((a) => a.id !== id),
      })),
    prices: state.prices,
    updatePrice: (id, patch) =>
      setState((s) => ({
        ...s,
        prices: s.prices.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      })),
  };
}
