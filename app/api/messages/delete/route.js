import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb";
import Message from "../../../../models/Message";

export async function POST(req) {
  await connectToDatabase(); // Naya function call
  const { messageId } = await req.json();

  await Message.findByIdAndDelete(messageId);
  return NextResponse.json({ success: true, message: "Wiped out completely" });
}