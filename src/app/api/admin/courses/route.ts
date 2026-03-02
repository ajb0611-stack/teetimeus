import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { z } from "zod";

const CourseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().min(2).max(2).default("FL"),
  zip: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  tee_time_url: z.string().url(),
  website_url: z.string().url().optional().nullable(),
  phone: z.string().optional().nullable(),
  is_public: z.boolean().default(true)
});

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  let query = auth.supabase
    .from("courses")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (q) query = query.ilike("name", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ courses: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => null);
  const parsed = CourseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join(", ") }, { status: 400 });

  const { data, error } = await auth.supabase.from("courses").insert(parsed.data).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ course: data });
}
