import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

const SITE_URL = "https://www.teetimeus.com";

type Course = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  website_url: string | null;
  tee_time_url: string | null;
  image_url: string | null;
};

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing Supabase env variables");
  }

  return createClient(url, anon);
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function getAllCourses() {
  const supabase = getSupabaseServer();

  const { data } = await supabase
    .from("courses")
    .select("name")
    .eq("is_public", true)
    .eq("is_active", true);

  return data || [];
}

async function getCourseBySlug(slug: string) {
  const supabase = getSupabaseServer();

  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("is_public", true)
    .eq("is_active", true);

  if (!data) return null;

  return data.find((c) => slugify(c.name) === slug) || null;
}

export async function generateStaticParams() {
  const courses = await getAllCourses();

  return courses.map((course) => ({
    slug: slugify(course.name),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const course = await getCourseBySlug(params.slug);

  if (!course) return {};

  const title = `${course.name} Tee Times | TeeTimeUs`;

  return {
    title,
    description: `Book tee times at ${course.name} in ${course.city}, ${course.state}. View course details and access booking links on TeeTimeUs.`,
  };
}

export default async function CoursePage({
  params,
}: {
  params: { slug: string };
}) {
  const course = await getCourseBySlug(params.slug);

  if (!course) {
    return <div>Course not found</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 20px" }}>
      <h1 style={{ fontSize: 34, fontWeight: 900 }}>{course.name}</h1>

      <p style={{ marginTop: 10 }}>
        {course.address}, {course.city}, {course.state}
      </p>

      {course.phone && <p>Phone: {course.phone}</p>}

      {course.website_url && (
        <p>
          Website:{" "}
          <a href={course.website_url} target="_blank">
            Visit Course Website
          </a>
        </p>
      )}

      {course.tee_time_url && (
        <div style={{ marginTop: 20 }}>
          <a
            href={course.tee_time_url}
            target="_blank"
            style={{
              padding: "12px 18px",
              background: "#22c55e",
              color: "black",
              fontWeight: 700,
              borderRadius: 10,
              textDecoration: "none",
            }}
          >
            Book Tee Time
          </a>
        </div>
      )}

      <div style={{ marginTop: 40 }}>
        <Link href={`/cities/${course.city?.toLowerCase().replace(/ /g, "-")}`}>
          ← Back to {course.city} Golf Courses
        </Link>
      </div>
    </div>
  );
}