// 파트너(업체) 모드 상태 — 들어온 예약 요청과 견적을 이 기기에서 관리.
// 사용자별 서버 조회는 세션 쿠키 기반이라 앱에서 불가 → 데모 시드 + 이 기기에서
// 접수된 예약(store.submissions.reservations)을 합쳐 "들어온 예약"으로 보여준다.
import { useEffect, useState } from "react";
import type { SavedReservation } from "./store";
import {
  fetchPartnerReservations,
  sendPartnerQuote,
  deleteReservation,
  type PartnerReservation,
} from "./api";

export type JobStatus =
  | "new" // 신규 요청 (아직 견적 전)
  | "quoted" // 견적 발송 (고객 수락 대기)
  | "confirmed" // 예약 확정 (고객 수락)
  | "in_progress" // 청소 중
  | "completed" // 완료
  | "declined"; // 거절

export const JOB_STATUS_META: Record<
  JobStatus,
  { label: string; tone: string; desc: string }
> = {
  new: { label: "신규 요청", tone: "tone-pending", desc: "견적을 보내면 고객에게 전달돼요." },
  quoted: { label: "견적 발송", tone: "tone-quoted", desc: "고객이 견적을 확인하고 있어요." },
  confirmed: { label: "예약 확정", tone: "tone-confirmed", desc: "방문일에 맞춰 준비해 주세요." },
  in_progress: { label: "청소 중", tone: "tone-in_progress", desc: "현재 진행 중인 작업이에요." },
  completed: { label: "완료", tone: "tone-completed", desc: "작업이 끝났어요. 수고하셨어요!" },
  declined: { label: "거절함", tone: "tone-requested", desc: "이 요청은 거절 처리했어요." },
};

export type PartnerQuote = { amount: number; memo: string; sentAt: string };

export type PartnerJob = {
  id: string;
  serviceId: string;
  customerName: string;
  region: string;
  address: string;
  pyeong: number;
  propertyType: string;
  difficulty: string; // normal | dirty | heavy
  date: string;
  timeSlot: string;
  note: string;
  createdAt: string;
  status: JobStatus;
  quote?: PartnerQuote;
  source: "demo" | "app"; // app = 이 기기에서 고객이 넣은 예약
};

const KEY = "songil-partner-jobs-v1";

const SEED: PartnerJob[] = [
  {
    id: "SG-4821",
    serviceId: "movein",
    customerName: "김서연",
    region: "서울 강남구 역삼동",
    address: "래미안 · 24평 아파트",
    pyeong: 24,
    propertyType: "아파트",
    difficulty: "dirty",
    date: "2026-07-12",
    timeSlot: "09:00",
    note: "입주 전 빈집이에요. 베란다 곰팡이가 좀 있고 새시 물때가 심해요.",
    createdAt: "2026-07-09",
    status: "new",
    source: "demo",
  },
  {
    id: "SG-4820",
    serviceId: "home",
    customerName: "이도현",
    region: "서울 서초구 방배동",
    address: "빌라 3층 · 18평",
    pyeong: 18,
    propertyType: "빌라·연립",
    difficulty: "normal",
    date: "2026-07-13",
    timeSlot: "13:00",
    note: "반려묘 두 마리 있어요. 털 제거 신경 써 주세요.",
    createdAt: "2026-07-08",
    status: "new",
    source: "demo",
  },
  {
    id: "SG-4816",
    serviceId: "studio",
    customerName: "강하늘",
    region: "서울 노원구 상계동",
    address: "원룸 · 9평",
    pyeong: 9,
    propertyType: "원룸",
    difficulty: "normal",
    date: "2026-07-11",
    timeSlot: "11:00",
    note: "퇴거 청소예요. 보증금 반환 때문에 꼼꼼하게 부탁드려요.",
    createdAt: "2026-07-07",
    status: "quoted",
    quote: { amount: 130000, memo: "냉장고 내부 포함 견적입니다.", sentAt: "2026-07-07" },
    source: "demo",
  },
  {
    id: "SG-4809",
    serviceId: "officetel",
    customerName: "정우진",
    region: "서울 마포구 공덕동",
    address: "오피스텔 · 15평",
    pyeong: 15,
    propertyType: "오피스텔",
    difficulty: "normal",
    date: "2026-07-10",
    timeSlot: "15:00",
    note: "이사 들어가기 전날 오전에 끝났으면 좋겠어요.",
    createdAt: "2026-07-05",
    status: "confirmed",
    quote: { amount: 180000, memo: "베란다 창틀 집중 청소 포함.", sentAt: "2026-07-05" },
    source: "demo",
  },
  {
    id: "SG-4790",
    serviceId: "office",
    customerName: "김대표",
    region: "서울 영등포구 여의도동",
    address: "사무실 · 40평",
    pyeong: 40,
    propertyType: "사무실",
    difficulty: "normal",
    date: "2026-07-03",
    timeSlot: "09:00",
    note: "매주 정기 관리 원해요. 세금계산서 발행 부탁드립니다.",
    createdAt: "2026-06-30",
    status: "completed",
    quote: { amount: 400000, memo: "바닥 왁스 코팅 포함.", sentAt: "2026-06-30" },
    source: "demo",
  },
];

function fromReservation(r: SavedReservation): PartnerJob {
  return {
    id: r.id,
    serviceId: r.serviceId,
    customerName: r.customerName || "고객",
    region: "앱 예약 접수",
    address: `${r.pyeong}평`,
    pyeong: r.pyeong,
    propertyType: "아파트",
    difficulty: "normal",
    date: r.date,
    timeSlot: r.timeSlot,
    note: "앱에서 바로 접수된 예약이에요.",
    createdAt: r.createdAt,
    status: "new",
    source: "app",
  };
}

// 서버 예약 상태(ReservationStatus) → 파트너 작업 상태(JobStatus)
function mapServerStatus(s: string): JobStatus {
  switch (s) {
    case "confirmed":
      return "confirmed";
    case "in_progress":
      return "in_progress";
    case "completed":
      return "completed";
    case "cancelled":
      return "declined";
    default:
      return "new"; // pending 등
  }
}

function fromServer(r: PartnerReservation): PartnerJob {
  const prop = (r.property ?? {}) as Record<string, unknown>;
  const propertyType = typeof prop.propertyType === "string" ? prop.propertyType : "아파트";
  return {
    id: r.id,
    serviceId: r.serviceId,
    customerName: r.customerName || "고객",
    region: r.address || "예약 접수",
    address: `${r.pyeong}평 · ${propertyType}`,
    pyeong: r.pyeong,
    propertyType,
    difficulty: "normal",
    date: r.date,
    timeSlot: r.timeSlot,
    note: r.notes || "",
    createdAt: (r.createdAt || "").slice(0, 10),
    status: mapServerStatus(r.status),
    source: "app",
  };
}

function load(): PartnerJob[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as PartnerJob[];
  } catch {
    /* noop */
  }
  return SEED;
}

export type PartnerJobsApi = {
  jobs: PartnerJob[];
  sendQuote: (id: string, amount: number, memo: string) => void;
  setStatus: (id: string, status: JobStatus) => void;
  removeJob: (id: string) => Promise<void>;
};

export function usePartnerJobs(deviceReservations: SavedReservation[]): PartnerJobsApi {
  const [jobs, setJobs] = useState<PartnerJob[]>(load);

  // 이 기기에서 접수된 예약을 신규 요청으로 편입 (중복 방지)
  useEffect(() => {
    if (deviceReservations.length === 0) return;
    setJobs((prev) => {
      const known = new Set(prev.map((j) => j.id));
      const added = deviceReservations
        .filter((r) => !known.has(r.id))
        .map(fromReservation);
      return added.length ? [...added, ...prev] : prev;
    });
  }, [deviceReservations]);

  // 서버(handway.online)에서 이 파트너 계정에 배정된 실제 예약을 불러와 편입.
  // 승인된 업체가 아니거나 비로그인이면 빈 배열 → 아무 변화 없음.
  useEffect(() => {
    let alive = true;
    fetchPartnerReservations().then((rows) => {
      if (!alive || rows.length === 0) return;
      setJobs((prev) => {
        const known = new Set(prev.map((j) => j.id));
        const added = rows.filter((r) => !known.has(r.id)).map(fromServer);
        return added.length ? [...added, ...prev] : prev;
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(jobs));
    } catch {
      /* noop */
    }
  }, [jobs]);

  const sendQuote = (id: string, amount: number, memo: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              status: "quoted",
              quote: { amount, memo, sentAt: new Date().toISOString().slice(0, 10) },
            }
          : j,
      ),
    );
    // 서버(handway.online)에 견적 동기화 — 관리자 화면에 표시.
    // 배정된 실제 예약만 성공하고, 데모/미배정 건은 조용히 무시된다.
    sendPartnerQuote(id, amount, memo).catch(() => {});
  };

  const setStatus = (id: string, status: JobStatus) =>
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));

  // 완료된 예약 삭제 — 서버(배정된 실제 예약)에서 지우고 로컬 목록에서도 제거.
  // 데모/미배정 건은 서버 삭제가 조용히 실패해도 로컬에서만 제거한다.
  const removeJob = async (id: string) => {
    try {
      await deleteReservation(id);
    } catch {
      /* 데모 시드·미배정 건은 서버에 없을 수 있다. 로컬에서만 제거. */
    }
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  return { jobs, sendQuote, setStatus, removeJob };
}
