import Pusher from "pusher";
import { NextResponse } from "next/server";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export async function POST(req) {
  try {
    const data = await req.json();
    const { channel, ...messageData } = data; // Destructure channel out
    
    // Trigger to the specific user's channel dynamic room
    await pusher.trigger(channel || "stealth_channel", "receive_message", messageData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Routing failed" }, { status: 500 });
  }
}