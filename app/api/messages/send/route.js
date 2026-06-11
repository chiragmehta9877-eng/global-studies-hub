// app/api/messages/send/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb";
import Message from "../../../../models/Message";
import Pusher from "pusher";

// Pusher config updated to catch both NEXT_PUBLIC and normal env variables
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export async function POST(req) {
  try {
    // 1. Connect to MongoDB
    await connectToDatabase(); 
    
    // 2. Extract data from frontend
    const { id, senderId, receiverId, encryptedText, channel } = await req.json();

    // 3. Permanent Save to Database (Offline Support)
    const newMessage = await Message.create({ 
      senderId, 
      receiverId, 
      encryptedText 
    });

    // 4. Real-time Trigger via Pusher (Online Support)
    await pusher.trigger(channel, "receive_message", {
      id: id,                   // Frontend temporary ID
      _id: newMessage._id,      // Real MongoDB ID (For 15s deletion)
      senderId: senderId,
      encryptedText: encryptedText,
    });

    return NextResponse.json({ success: true, message: "Message saved to DB and sent via Pusher!" });
  } catch (error) {
    console.error("Send Error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}