import { NextResponse } from "next/server";
import { requireAdmin } from "../../_auth";
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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await auth.supabase.from("courses").select("*").eq("id", params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ course: data });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => null);
  const parsed = CourseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join(", ") }, { status: 400 });

  const { data, error } = await auth.supabase.from("courses").update(parsed.data).eq("id", params.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ course: data });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { error } = await auth.supabase.from("courses").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
