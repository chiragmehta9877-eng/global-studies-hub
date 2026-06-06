import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import Contact from "../../../models/Contact";

export async function GET() {
  await connectToDatabase();
  const messages = await Contact.find().sort({ createdAt: -1 });
  return NextResponse.json({ success: true, messages });
}

export async function POST(req) {
  await connectToDatabase();
  const body = await req.json();
  await Contact.create(body);
  return NextResponse.json({ success: true });
}

export async function DELETE(req) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  await Contact.findByIdAndDelete(searchParams.get("id"));
  return NextResponse.json({ success: true });
}