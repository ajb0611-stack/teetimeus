import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseClients";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseService();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data, error } = await supabase
    .from("courses")
    .select("tee_time_url, clicks")
    .eq("id", params.id)
    .single();

  if (error || !data?.tee_time_url) {
    return NextResponse.redirect(new URL("/search", appUrl), { status: 302 });
  }

  await supabase.from("courses").update({ clicks: (data.clicks ?? 0) + 1 }).eq("id", params.id);
  return NextResponse.redirect(data.tee_time_url, { status: 302 });
}
