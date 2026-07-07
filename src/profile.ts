// 프로필을 Supabase 계정(user_metadata)에 저장 → 기기가 바뀌어도 유지.
// 소셜/이메일 로그인(Supabase 세션)일 때만 저장되고, 게스트/간편 로그인은 로컬만 사용.
import { supabase } from "./supabase";

export async function saveProfileToAccount(p: {
  name?: string;
  phone?: string;
  address?: string;
  addressDetail?: string;
}): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false; // Supabase 세션 없음 → 로컬만
  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: p.name,
      phone: p.phone,
      address: p.address,
      address_detail: p.addressDetail,
    },
  });
  return !error;
}
