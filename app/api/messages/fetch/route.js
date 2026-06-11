import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb"; 
import Message from "../../../../models/Message";

export async function POST(req) {
  await connectToDatabase(); // Yahan function ka naam badal diya
  const { userId } = await req.json();

  const messages = await Message.find({ receiverId: userId }).sort({ createdAt: 1 });
  return NextResponse.json({ success: true, messages });
}