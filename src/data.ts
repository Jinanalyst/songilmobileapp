// 손길 앱 정적 데이터 — 웹사이트(src/lib/data.ts)와 동일한 내용을 이식.

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export const STATUS_META: Record<
  ReservationStatus,
  { label: string; desc: string }
> = {
  pending: {
    label: "접수 완료",
    desc: "예약금 결제가 확인됐어요. 담당 업체를 배정하고 있어요.",
  },
  confirmed: {
    label: "업체 확정",
    desc: "담당 업체가 배정됐어요. 방문 하루 전 연락드릴게요.",
  },
  in_progress: {
    label: "청소 중",
    desc: "지금 손길이 닿고 있어요. 조금만 기다려 주세요.",
  },
  completed: {
    label: "청소 완료",
    desc: "청소가 끝났어요! 잔금은 현장에서 결제해 주세요.",
  },
  cancelled: {
    label: "취소됨",
    desc: "예약이 취소됐어요. 예약금은 정책에 따라 환불돼요.",
  },
};

export const STATUS_FLOW: ReservationStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
];

export type ConsultationStatus =
  | "requested"
  | "consulting"
  | "quoted"
  | "confirmed"
  | "cancelled";

export const CONSULTATION_STATUS_META: Record<
  ConsultationStatus,
  { label: string; desc: string }
> = {
  requested: {
    label: "상담 신청",
    desc: "상담 신청이 접수됐어요. 담당자가 곧 연락드려 방문·상담 일정을 잡을게요.",
  },
  consulting: {
    label: "상담 진행 중",
    desc: "현장·전화 상담을 진행하고 있어요. 공간을 확인한 뒤 견적을 안내드릴게요.",
  },
  quoted: {
    label: "견적 확정",
    desc: "상담을 통해 합의된 견적이 확정됐어요. 금액과 내용을 확인해 주세요.",
  },
  confirmed: {
    label: "예약 성사",
    desc: "청소 예약이 확정됐어요! 방문 하루 전 다시 안내드릴게요.",
  },
  cancelled: {
    label: "취소됨",
    desc: "상담이 취소됐어요. 언제든 다시 신청해 주세요.",
  },
};

export const CONSULTATION_FLOW: ConsultationStatus[] = [
  "requested",
  "consulting",
  "quoted",
  "confirmed",
];

export type ServiceCategory = "residential" | "commercial" | "partial";

export type ServiceType = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  category: ServiceCategory;
  pricePerPyeong: number;
  minPrice: number;
  duration: string;
};

export const SERVICES: ServiceType[] = [
  {
    id: "home",
    name: "가정 정기청소",
    emoji: "🏠",
    blurb: "주방·화장실·거실까지 생활공간을 구석구석 정돈해 드려요.",
    category: "residential",
    pricePerPyeong: 4000,
    minPrice: 60000,
    duration: "3~4시간",
  },
  {
    id: "movein",
    name: "입주청소",
    emoji: "📦",
    blurb: "빈집 상태에서 새집처럼. 사람 살기 전 바닥부터 완벽하게.",
    category: "residential",
    pricePerPyeong: 9000,
    minPrice: 150000,
    duration: "5~7시간",
  },
  {
    id: "moveout",
    name: "이사청소",
    emoji: "🚚",
    blurb: "이사 나가는 날, 짐 뺀 자리까지 원상복구로 마무리해요.",
    category: "residential",
    pricePerPyeong: 8000,
    minPrice: 120000,
    duration: "4~6시간",
  },
  {
    id: "studio",
    name: "원룸 퇴거청소",
    emoji: "🔑",
    blurb: "보증금 걱정 없이 깔끔하게. 원룸·소형 평수 퇴실 청소.",
    category: "residential",
    pricePerPyeong: 6000,
    minPrice: 90000,
    duration: "2~3시간",
  },
  {
    id: "officetel",
    name: "오피스텔 청소",
    emoji: "🏙️",
    blurb: "주거·업무 겸용 공간에 맞춘 꼼꼼한 청소.",
    category: "residential",
    pricePerPyeong: 7000,
    minPrice: 130000,
    duration: "3~4시간",
  },
  {
    id: "office",
    name: "사무실·상가청소",
    emoji: "🏢",
    blurb: "영업 전후 시간대에 맞춰 사업장을 깔끔하게 관리해요.",
    category: "commercial",
    pricePerPyeong: 5000,
    minPrice: 100000,
    duration: "3~5시간",
  },
  {
    id: "partial",
    name: "부분 청소",
    emoji: "🧽",
    blurb: "주방·화장실·베란다 등 필요한 곳만 골라서 청소해요.",
    category: "partial",
    pricePerPyeong: 4000,
    minPrice: 40000,
    duration: "1~2시간",
  },
];

export const PROPERTY_TYPES = [
  "아파트",
  "빌라·연립",
  "오피스텔",
  "원룸",
  "단독주택",
  "기타",
];
export const ROOM_OPTIONS = ["원룸", "방 1개", "방 2개", "방 3개", "방 4개+"];
export const BATH_OPTIONS = ["1개", "2개", "3개+"];
export const SPACE_TYPES = [
  "사무실",
  "상가·매장",
  "학원·교실",
  "병원·클리닉",
  "카페·음식점",
  "기타",
];
export const PARTIAL_AREAS = [
  "주방",
  "화장실",
  "거실",
  "베란다",
  "창문·새시",
  "냉장고 내부",
  "붙박이장",
  "방충망",
];

export const TIME_SLOTS = ["09:00", "11:00", "13:00", "15:00", "17:00"];

// 정산 계좌 은행 목록 (파트너 심사 신청용)
export const BANKS = [
  "국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "농협은행",
  "기업은행",
  "카카오뱅크",
  "토스뱅크",
  "새마을금고",
  "우체국",
  "SC제일은행",
  "케이뱅크",
  "부산은행",
  "대구은행",
];

// 손길 플랫폼 수수료(=선결제 예약금)는 견적의 7%. 계산은 pricing 의 platformFee() 사용.
export { FEE_RATE, FEE_PERCENT, platformFee } from "./pricing";
export const PAYMENT_NOTICE =
  "온라인 결제 금액은 청소 전체 비용이 아닌, 예약 확정을 위한 손길 플랫폼 수수료(견적 금액의 7%)입니다. 청소 총액은 공간 크기, 오염도, 추가 요청사항에 따라 달라질 수 있으며, 잔금은 청소 완료 후 현장에서 파트너에게 결제합니다.";

export const COMPANY = {
  bizName: "체인랩스",
  service: "손길",
  ceo: "장진우",
  bizNumber: "382-25-02223",
  mailOrderNumber: "준비 중",
  tel: "050-6990-8359",
  kakao: "http://pf.kakao.com/_BTrPX/chat",
  email: "jangj6091@gmail.com",
  hours: "평일 09:00 - 18:00",
  domain: "handway.online",
  address: "여수울로 50 연꽃마을4단지아파트 406-403",
} as const;

export const MEDIATION_NOTICE =
  "손길은 고객과 청소 파트너를 연결하는 청소 예약 중개 플랫폼입니다. 청소 서비스는 제휴 청소 파트너가 수행하며, 손길은 예약 접수, 일정 조율, 파트너 배정, 고객 응대 및 예약 관리를 제공합니다.";

export const VERIFICATION_BADGES = ["사업자 확인", "신원 확인", "리뷰 확인"] as const;
export type VerificationBadge = (typeof VERIFICATION_BADGES)[number];

export type Partner = {
  id: string;
  name: string;
  tagline: string;
  rating: number;
  reviews: number;
  jobs: number;
  since: number;
  specialties: string[];
  region: string;
  regions: string[];
  verifications: VerificationBadge[];
  photos: string[];
  accent: string; // acc-rose | acc-sky | acc-emerald | acc-amber | acc-violet
  intro: string;
  phone?: string; // 직접 연락처 (선택)
  linkedin?: string; // 링크드인 프로필 URL (선택)
};

export const PARTNERS: Partner[] = [
  {
    id: "gaeron",
    name: "청소학개론",
    tagline: "1~2인이 직접 발로 뛰는 사무실 청소",
    rating: 0,
    reviews: 0,
    jobs: 0,
    since: 2024,
    specialties: ["사무실·상가청소"],
    region: "서울 강남 · 성남 분당",
    regions: ["서울 강남구", "서울 서초구", "성남시 분당구"],
    verifications: ["신원 확인"],
    photos: ["사무실 바닥 청소", "탕비실·화장실 청소", "유리창·파티션 세척", "공용부 정기관리"],
    accent: "acc-violet",
    intro:
      "1~2인 소규모로 직접 발로 뛰며 청소하는 게 자부심이에요. 서울 강남과 성남 분당 지역 사무실·상가를 남의 공간이 아니라 내 공간처럼 구석구석 정성껏 관리해 드립니다.",
    phone: "010-3210-3748",
    linkedin:
      "https://www.linkedin.com/in/%EC%B2%AD%EC%86%8C%EB%B6%80-%ED%96%89%EB%B3%B5%ED%95%9C-94188a3ab/",
  },
];

export type Review = {
  author: string;
  rating: number;
  date: string;
  service: string;
  text: string;
  photos?: string[]; // 첨부 사진 공개 URL
};

export const REVIEWS: Record<string, Review[]> = {};

export const SERVICE_INFO: { name: string; desc: string; startPrice: number }[] = [
  { name: "가정 정기청소", desc: "주방, 화장실, 거실 등 생활공간 청소", startPrice: 60000 },
  { name: "원룸 퇴거청소", desc: "원룸, 오피스텔 등 소형 공간 퇴실 청소", startPrice: 90000 },
  { name: "입주청소", desc: "입주 전 빈집 상태의 청소", startPrice: 150000 },
  { name: "이사청소", desc: "이사 전후 공간 청소", startPrice: 120000 },
  { name: "부분청소", desc: "화장실, 주방, 베란다 등 일부 공간 청소", startPrice: 40000 },
  { name: "사무실/상가청소", desc: "사무실, 매장, 상가 공간 청소", startPrice: 100000 },
];

export function serviceById(id: string) {
  return SERVICES.find((s) => s.id === id);
}
export function partnerById(id: string) {
  return PARTNERS.find((p) => p.id === id);
}
export function categoryOf(serviceId: string): ServiceCategory | undefined {
  return serviceById(serviceId)?.category;
}
export function reviewsFor(partnerId: string): Review[] {
  return REVIEWS[partnerId] ?? [];
}
export function estimatePrice(serviceId: string, pyeong: number): number {
  const svc = serviceById(serviceId);
  if (!svc) return 0;
  return Math.max(svc.minPrice, Math.round((svc.pricePerPyeong * pyeong) / 1000) * 1000);
}
export function formatKRW(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}
export function propertyLabelOf(serviceId: string): string {
  const cat = categoryOf(serviceId);
  if (cat === "commercial") return "회사 정보";
  if (cat === "partial") return "청소 공간";
  return "집 정보";
}

// 데모용 예약번호/상담번호 생성
export function genCode(prefix: string): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${n}`;
}
