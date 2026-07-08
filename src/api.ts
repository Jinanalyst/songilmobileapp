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
