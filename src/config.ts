// 손길 앱 환경 설정

// handway.online 과 동일한 Supabase 프로젝트 (anon 공개키 — 클라이언트 노출 안전)
export const SUPABASE_URL = "https://fjpqxvrivjorybhtokme.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqcHF4dnJpdmpvcnliaHRva21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDQyMjYsImV4cCI6MjA5ODQ4MDIyNn0.-f30fMAQ_h3bcYmgb81MnbTxXXaM2HBfG6Qz04JfL6k";

// 사이트 API 베이스.
// 개발(Vite dev): "" → /api 를 Vite 프록시가 handway.online 으로 전달 (CORS 회피)
// 프로덕션(앱 번들): 절대 URL. 앱은 CapacitorHttp 가 CORS 를 우회한다.
export const API_BASE = import.meta.env.DEV ? "" : "https://www.handway.online";

// 상담 채널
export const KAKAO_CHANNEL = "http://pf.kakao.com/_BTrPX/chat";
export const SUPPORT_TEL = "050-6990-8359";

// OAuth 콜백용 딥링크 (Supabase 대시보드 Redirect URLs 에 추가 필요)
export const APP_REDIRECT = "online.handway.songil://auth/callback";
