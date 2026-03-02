import { supabaseService } from "@/lib/supabaseClients";

export async function requireAdmin(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) {
    return { ok: false as const, status: 401, error: "Missing Authorization Bearer token" };
  }

  const supabase = supabaseService();
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return { ok: false as const, status: 401, error: "Invalid or expired token" };
  }

  const userId = userData.user.id;
  const { data: adminRow, error: adminErr } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminErr) {
    return { ok: false as const, status: 500, error: adminErr.message };
  }
  if (!adminRow?.user_id) {
    return { ok: false as const, status: 403, error: "Not an admin" };
  }

  return { ok: true as const, user_id: userId, supabase };
}
