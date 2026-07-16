// handway.online 사이트 API 호출 — 예약/상담/파트너신청을 같은 Supabase DB 에 생성.
// 네이티브 앱: CapacitorHttp 로 네이티브 요청(WebView CORS 회피).
// 개발 프리뷰: 일반 fetch + Vite 프록시.
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { API_BASE } from "./config";
import { supabase } from "./supabase";
import { getStoredRef } from "./ref";
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

async function del<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
  if (native) {
    const res = await CapacitorHttp.request({ method: "DELETE", url, headers });
    const data = typeof res.data === "string" ? safeParse(res.data) : res.data;
    if (res.status < 200 || res.status >= 300) {
      throw new Error((data as { error?: string })?.error || "요청에 실패했어요.");
    }
    return data as T;
  }
  const res = await fetch(url, { method: "DELETE", headers });
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
  ref?: string; // 추천 코드 (없으면 저장된 코드 자동 첨부)
};
export async function createReservation(input: ReservationInput) {
  const { reservation } = await post<{ reservation: { id: string } }>(
    "/api/reservations",
    { ...input, ref: input.ref ?? getStoredRef() }
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
  ref?: string; // 추천 코드 (업체 소개 추천)
};
export async function createApplication(input: ApplicationInput) {
  const { application } = await post<{ application: { id: string } }>(
    "/api/applications",
    { ...input, ref: input.ref ?? getStoredRef() }
  );
  return application;
}

// ── 회원 탈퇴 (POST /api/account/delete, 로그인 필요) ──
//  로그인한 본인 계정과 연결된 개인정보를 파기하고 Supabase 인증 계정을 삭제한다.
//  Bearer 토큰(authHeaders)으로 본인 확인 → 소셜/이메일 로그인 계정에만 유효.
//  간편·게스트 로그인은 서버 계정이 없으므로 호출하지 않고 로컬 데이터만 지운다.
export async function deleteAccount(): Promise<void> {
  await post("/api/account/delete", { confirm: true });
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
// 추천(레퍼럴)·제휴 정산 — GET /api/referral/me, POST /api/referral/payout
// ══════════════════════════════════════════════════════════════
export type ReferredType = "customer" | "provider";
export type CommissionStatus = "pending" | "available" | "paid" | "canceled" | "deducted";

export type ReferralRelation = {
  id: string;
  createdAt: string;
  referredType: ReferredType;
  referredName: string;
  status: "active" | "suspended" | "ended";
  firstCompletedAt: string | null;
  completedCount: number;
  grossAmount: number;
  totalCommission: number;
};
export type ReferralCommission = {
  id: string;
  createdAt: string;
  referredType: ReferredType;
  referredName: string;
  reservationId: string;
  sequenceNo: number;
  isFirst: boolean;
  baseAmount: number;
  rate: number;
  amount: number;
  status: CommissionStatus;
  paidAt: string | null;
};

export type ReferralEarning = {
  id: string;
  createdAt: string;
  sourceType: "customer" | "partner";
  referredName: string;
  reservationId: string;
  quoteAmount: number;
  amount: number;
  status: "pending" | "paid";
  paidAt: string | null;
};
export type ReferralSummary = {
  referredCustomers: number;
  referredPartners: number; // = referredProviders (하위호환 별칭)
  referredProviders?: number;
  pending: number; // = thisMonthEstimate (하위호환 별칭)
  paid: number;
  total: number;
  thisMonthEstimate?: number;
  available?: number;
  thisMonthCompleted?: number;
};
export type ReferralData = {
  code: string;
  link: string;
  rate: number; // 하위호환(첫 완료 거래 요율)
  settings?: { firstRate: number; repeatRate: number; minPayout: number };
  summary: ReferralSummary;
  relations?: ReferralRelation[];
  commissions?: ReferralCommission[];
  earnings: ReferralEarning[]; // 하위호환
  payout: { bank: string; account: string; holder: string };
};

// 내 추천 코드·링크·적립 요약·내역·정산 계좌 (로그인 필요).
export async function fetchReferral(): Promise<ReferralData | null> {
  const data = await getJsonAuth("/api/referral/me");
  return (data as ReferralData) ?? null;
}

// 정산 계좌 저장.
export async function saveReferralPayout(
  bank: string,
  account: string,
  holder: string
): Promise<void> {
  await post("/api/referral/payout", { bank, account, holder });
}

// ── 관리자: 추천 커미션 정산 (jangj6091 전용, Bearer) ──
export type AdminCommission = ReferralCommission & {
  referrerCode: string;
  bank: string;
  account: string;
  holder: string;
};
export type AdminPayout = {
  id: string;
  createdAt: string;
  referrerCode: string;
  amount: number;
  count: number;
  status: string;
  period: string;
  bank: string;
  account: string;
  holder: string;
  paidAt: string | null;
};
export type AdminReferralsData = {
  commissions: AdminCommission[];
  relations: ReferralRelation[];
  payouts: AdminPayout[];
  settings: {
    minPayout: number;
    firstRate: number;
    repeatRate: number;
    platformFeeRate: number;
  };
};

// 전체 커미션 + 추천 관계 + 정산 배치 + 설정 (관리자 전용).
export async function fetchAdminReferrals(): Promise<AdminReferralsData | null> {
  const data = await getJsonAuth("/api/admin/referrals");
  return (data as AdminReferralsData) ?? null;
}

// 커미션 상태 변경 (적립예정→정산가능→지급완료 등).
export async function markCommission(
  id: string,
  status: CommissionStatus
): Promise<void> {
  await patch(`/api/admin/referrals/${id}`, { status });
}

// 특정 추천인의 정산가능(available) 커미션을 묶어 지급 완료 처리.
export async function createReferralPayout(
  code: string,
  period: string
): Promise<AdminPayout> {
  const d = await post<{ payout: AdminPayout }>("/api/admin/referrals/actions", {
    kind: "payout",
    code,
    period,
  });
  return d.payout;
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

// ── 고객 셀프서비스: 본인 예약 취소 (PATCH, 로그인 필요) ──
export async function cancelReservation(id: string): Promise<void> {
  await patch(`/api/reservations/${id}`, { action: "cancel" });
}

// ── 고객 셀프서비스: 본인 예약 시간 변경 (PATCH, 로그인 필요) ──
//  예약된 시간과 겹치면 서버가 409 로 거절한다.
export async function rescheduleReservation(
  id: string,
  date: string,
  timeSlot: string
): Promise<void> {
  await patch(`/api/reservations/${id}`, { action: "reschedule", date, timeSlot });
}

// ── 완료된 예약 삭제 (DELETE, 관리자·배정 업체) ──
export async function deleteReservation(id: string): Promise<void> {
  await del(`/api/reservations/${id}`);
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
