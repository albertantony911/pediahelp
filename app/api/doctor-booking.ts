import { groq } from "next-sanity";
import { client } from "@/sanity/lib/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const slug = searchParams.get("slug");

  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Missing or invalid slug" }, { status: 400 });
  }

  try {
    const doctor = await client.fetch(
      groq`*[_type == "doctor" && slug.current == $slug][0]{ bookingId, slug }`,
      { slug }
    );

    if (!doctor?.bookingId) {
      return NextResponse.json({ error: "Booking link not found" }, { status: 404 });
    }

    const bookingIdMatch = doctor.bookingId.match(/\/i\/([a-zA-Z0-9]+)$/);
    if (!bookingIdMatch || !bookingIdMatch[1]) {
      return NextResponse.json({ error: "Invalid booking URL format" }, { status: 400 });
    }

    const bookingId = bookingIdMatch[1];
    return NextResponse.json({ bookingId }, { status: 200 });
  } catch (err) {
    if (err instanceof Error) {
      console.error("Error fetching bookingId:", err.message);
    } else {
      console.error("Unknown error occurred while fetching bookingId", err);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
