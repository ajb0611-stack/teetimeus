import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseClients";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

  const supabase = supabaseService();
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const userId = userData.user.id;
  const { data: adminRow, error: adminErr } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (adminErr) return NextResponse.json({ error: adminErr.message }, { status: 500 });

  return NextResponse.json({ is_admin: Boolean(adminRow?.user_id), user_id: userId });
}
