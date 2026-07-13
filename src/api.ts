// handway.online 사이트 API 호출 — 예약/상담/파트너신청을 같은 Supabase DB 에 생성.
// 네이티브 앱: CapacitorHttp 로 네이티브 요청(WebView CORS 회피).
// 개발 프리뷰: 일반 fetch + Vite 프록시.
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { API_BASE } from "./config";
import { supabase } from "./supabase";
import type { Review } from "./data";

const native = Capacitor.isNativePlatform();

// 로그인(소셜/이메일) 상태면 Supabase 액세스 토큰을 Bearer 로 첨부 →
// 사이트 서버(getRequestUser)가 앱 사용자를 식별해 예약 소유·후기 작성을 허용.
async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
  if (native) {
    const res = await CapacitorHttp.request({ method: "POST", url, headers, data: body });
    const data = typeof res.data === "string" ? safeParse(res.data) : res.data;
    if (res.status < 200 || res.status >= 300) {
      throw new Error((data as { error?: string })?.error || "요청에 실패했어요.");
    }
    return data as T;
  }
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "요청에 실패했어요.");
  return data as T;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
  if (native) {
    const res = await CapacitorHttp.request({ method: "PATCH", url, headers, data: body });
    const data = typeof res.data === "string" ? safeParse(res.data) : res.data;
    if (res.status < 200 || res.status >= 300) {
      throw new Error((data as { error?: string })?.error || "요청에 실패했어요.");
    }
    return data as T;
  }
  const res = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "요청에 실패했어요.");
  return data as T;
}

async function getJson(path: string): Promise<any | null> {
  const url = `${API_BASE}${path}`;
  try {
    if (native) {
      const res = await CapacitorHttp.request({ method: "GET", url });
      if (res.status < 200 || res.status >= 300) return null;
      return typeof res.data === "string" ? safeParse(res.data) : res.data;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// 로그인(Bearer) 토큰을 첨부한 인증 GET — 파트너 본인 예약 등 계정 스코프 조회용.
async function getJsonAuth(path: string): Promise<any | null> {
  const url = `${API_BASE}${path}`;
  const headers = await authHeaders();
  try {
    if (native) {
      const res = await CapacitorHttp.request({ method: "GET", url, headers });
      if (res.status < 200 || res.status >= 300) return null;
      return typeof res.data === "string" ? safeParse(res.data) : res.data;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

// ── 예약 생성 (POST /api/reservations, 인증 불필요) ──
export type ReservationInput = {
  partnerId: string;
  serviceId: string;
  pyeong: number;
  date: string;
  timeSlot: string;
  customerName: string;
  phone: string;
  address: string;
  addressDetail?: string;
  notes?: string;
  property: Record<string, unknown>;
  difficulty?: string; // 견적·수수료 계산용 (오염 정도)
  options?: string[]; // 견적·수수료 계산용 (추가 옵션)
};
export async function createReservation(input: ReservationInput) {
  const { reservation } = await post<{ reservation: { id: string } }>(
    "/api/reservations",
    input
  );
  return reservation;
}

// ── 견적 상담 신청 (POST /api/consultations) ──
export type ConsultationInput = {
  customerName: string;
  phone: string;
  serviceId?: string;
  pyeong?: number | string;
  address?: string;
  addressDetail?: string;
  preferredDate?: string;
  notes?: string;
};
export async function createConsultation(input: ConsultationInput) {
  const { consultation } = await post<{ consultation: { id: string } }>(
    "/api/consultations",
    input
  );
  return consultation;
}

// ── 파트너 등록(심사) 신청 (POST /api/applications) ──
export type ApplicationInput = {
  companyName: string;
  ownerName: string;
  bizNumber: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  regions: string;
  services: string[];
  experience: string;
  teamSize: string;
  intro: string;
  photos?: string[]; // 업체 대표 사진 (base64 data URL)
};
export async function createApplication(input: ApplicationInput) {
  const { application } = await post<{ application: { id: string } }>(
    "/api/applications",
    input
  );
  return application;
}

// ── 후기 작성 (POST /api/reviews, 로그인 필요) ──
export type ReviewInput = {
  reservationId: string;
  rating: number;
  body: string;
  photos: string[]; // base64 data URL
};
export async function createReview(input: ReviewInput) {
  const { review } = await post<{ review: { id: string } }>("/api/reviews", input);
  return review;
}

// ── 파트너 공개 후기 (GET /api/partners/[id]/reviews) ──
export async function fetchReviews(partnerId: string): Promise<Review[]> {
  const data = await getJson(`/api/partners/${partnerId}/reviews`);
  return (data?.reviews ?? []) as Review[];
}

// ── 예약 가능 현황 (GET /api/availability) — 예약된 슬롯 목록 ──
export type BookedSlot = { date: string; timeSlot: string; partnerId: string };
export async function fetchAvailability(): Promise<BookedSlot[]> {
  const data = await getJson("/api/availability");
  return (data?.slots ?? []) as BookedSlot[];
}

// ── 승인된 신규 파트너 (GET /api/partners) — 없으면 빈 배열 ──
export type ApprovedPartner = {
  id: string;
  companyName: string;
  services: string[];
  regions: string;
  intro: string;
  photos: string[];
};
export async function fetchApprovedPartners(): Promise<ApprovedPartner[]> {
  const data = await getJson("/api/partners");
  return (data?.partners ?? []) as ApprovedPartner[];
}

// ── 파트너 본인에게 배정된 예약 (GET /api/partner/reservations, 로그인 필요) ──
// 승인된 업체 계정이면 자기 업체 예약을, 아니면 빈 배열을 돌려준다.
export type PartnerReservation = {
  id: string;
  createdAt: string;
  partnerId: string;
  serviceId: string;
  pyeong: number;
  date: string;
  timeSlot: string;
  customerName: string;
  phone: string;
  address: string;
  addressDetail: string;
  notes: string;
  property: Record<string, unknown>;
  price: number;
  status: string;
};
export async function fetchPartnerReservations(): Promise<PartnerReservation[]> {
  const data = await getJsonAuth("/api/partner/reservations");
  return (data?.reservations ?? []) as PartnerReservation[];
}

// ── 업체 견적 서버 동기화 (POST /api/partner/quote, 로그인 업체) ──
export async function sendPartnerQuote(
  reservationId: string,
  amount: number,
  memo: string
): Promise<void> {
  await post("/api/partner/quote", { reservationId, amount, memo });
}

// ── 파트너 단가표 (GET/POST /api/partner/prices, 로그인 승인 업체) ──
//  서비스별 시작가를 서버(사이트와 동일 DB)에 저장·조회한다. 웹 설정 화면과 동일 데이터.
export type PartnerPrice = { id: string; name: string; startPrice: number; note: string };
export type PartnerPriceList = {
  partnerId: string;
  companyName: string;
  prices: PartnerPrice[];
};

// 로그인 파트너의 업체별 단가표. 승인 업체가 아니면 approved:false + 빈 목록.
export async function fetchPartnerPriceLists(): Promise<{
  lists: PartnerPriceList[];
  approved: boolean;
}> {
  const data = await getJsonAuth("/api/partner/prices");
  return {
    lists: (data?.lists ?? []) as PartnerPriceList[],
    approved: Boolean(data?.approved),
  };
}

// 단가표 저장 (본인 승인 업체만). 저장된 단가표를 반환.
export async function savePartnerPrices(
  partnerId: string,
  prices: PartnerPrice[]
): Promise<PartnerPriceList> {
  const data = await post<{ list: PartnerPriceList }>("/api/partner/prices", {
    partnerId,
    prices,
  });
  return data.list;
}

// ══════════════════════════════════════════════════════════════
// 소통 스레드 (관리자↔업체 / 관리자↔고객) — GET/POST /api/messages
// ══════════════════════════════════════════════════════════════
export type ThreadType = "reservation" | "consultation";
export type Audience = "partner" | "customer";
export type ChatMessage = {
  id: string;
  createdAt: string;
  sender: "admin" | "partner" | "customer";
  senderName: string;
  body: string;
};

export async function fetchMessages(
  type: ThreadType,
  id: string,
  audience: Audience
): Promise<ChatMessage[]> {
  const data = await getJsonAuth(
    `/api/messages?type=${type}&id=${encodeURIComponent(id)}&audience=${audience}`
  );
  return (data?.messages ?? []) as ChatMessage[];
}

export async function sendMessage(
  type: ThreadType,
  id: string,
  audience: Audience,
  body: string
): Promise<ChatMessage> {
  const data = await post<{ message: ChatMessage }>("/api/messages", {
    type,
    id,
    audience,
    body,
  });
  return data.message;
}

// ══════════════════════════════════════════════════════════════
// 관리자 콘솔 (운영자 전용, 모두 Bearer 인증) — 사이트와 동일 데이터
// ══════════════════════════════════════════════════════════════
export type AdminReservation = {
  id: string;
  createdAt: string;
  partnerId: string;
  serviceId: string;
  pyeong: number;
  date: string;
  timeSlot: string;
  customerName: string;
  phone: string;
  address: string;
  addressDetail: string;
  notes: string;
  price: number;
  deposit: number;
  status: string;
  agreedPrice: number | null;
  partnerQuote: number | null;
  partnerQuoteNote: string;
};

export type AdminConsultation = {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  address: string;
  addressDetail: string;
  serviceId: string;
  pyeong: number | null;
  preferredDate: string;
  notes: string;
  status: string;
  quotedPrice: number | null;
  quoteNote: string;
  partnerId: string;
};

export type AdminApplication = {
  id: string;
  createdAt: string;
  companyName: string;
  ownerName: string;
  bizNumber: string;
  phone: string;
  email: string;
  regions: string;
  services: string[];
  teamSize: string;
  experience: string;
  intro: string;
  status: string;
  reviewNote: string;
};

export async function fetchAdminReservations(): Promise<AdminReservation[]> {
  const data = await getJsonAuth("/api/reservations");
  return (data?.reservations ?? []) as AdminReservation[];
}
export async function patchReservation(
  id: string,
  body: { status?: string; partnerId?: string; agreedPrice?: number | null }
): Promise<AdminReservation> {
  const data = await patch<{ reservation: AdminReservation }>(
    `/api/reservations/${id}`,
    body
  );
  return data.reservation;
}

export async function fetchAdminConsultations(): Promise<AdminConsultation[]> {
  const data = await getJsonAuth("/api/consultations");
  return (data?.consultations ?? []) as AdminConsultation[];
}
export async function patchConsultation(
  id: string,
  body: {
    status?: string;
    quotedPrice?: number | null;
    quoteNote?: string;
    partnerId?: string;
  }
): Promise<AdminConsultation> {
  const data = await patch<{ consultation: AdminConsultation }>(
    `/api/consultations/${id}`,
    body
  );
  return data.consultation;
}

export async function fetchAdminApplications(): Promise<AdminApplication[]> {
  const data = await getJsonAuth("/api/applications");
  return (data?.applications ?? []) as AdminApplication[];
}
export async function patchApplication(
  id: string,
  body: { status?: string; reviewNote?: string }
): Promise<AdminApplication> {
  const data = await patch<{ application: AdminApplication }>(
    `/api/applications/${id}`,
    body
  );
  return data.application;
}

// 배정 가능한 승인 파트너(공개) — 관리자 배정 드롭다운용
export async function fetchAdminApprovedPartners(): Promise<
  { id: string; name: string }[]
> {
  const data = await getJson("/api/partners");
  return ((data?.partners ?? []) as { id: string; companyName: string }[]).map(
    (p) => ({ id: p.id, name: p.companyName })
  );
}
