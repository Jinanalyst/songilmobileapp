// handway.online 사이트 API 호출 — 예약/상담/파트너신청을 같은 Supabase DB 에 생성.
import { API_BASE } from "./config";
import type { Review } from "./data";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "요청에 실패했어요.");
  }
  return data as T;
}

// ── 예약 생성 (POST /api/reservations, 인증 불필요) ──
export type ReservationInput = {
  partnerId: string;
  serviceId: string;
  pyeong: number;
  date: string; // YYYY-MM-DD
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
};
export async function createApplication(input: ApplicationInput) {
  const { application } = await post<{ application: { id: string } }>(
    "/api/applications",
    input
  );
  return application;
}

// ── 파트너 공개 후기 (GET /api/partners/[id]/reviews) ──
export async function fetchReviews(partnerId: string): Promise<Review[]> {
  try {
    const res = await fetch(`${API_BASE}/api/partners/${partnerId}/reviews`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.reviews ?? []) as Review[];
  } catch {
    return [];
  }
}

// ── 승인된 신규 파트너 (GET /api/partners) — 없으면 빈 배열 ──
export type ApprovedPartner = {
  id: string;
  companyName: string;
  services: string[];
  regions: string;
  intro: string;
};
export async function fetchApprovedPartners(): Promise<ApprovedPartner[]> {
  try {
    const res = await fetch(`${API_BASE}/api/partners`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.partners ?? []) as ApprovedPartner[];
  } catch {
    return [];
  }
}
