import { NextResponse } from "next/server";
import mongoose from "mongoose";
import PushToken from "../../../../models/PushToken";

export async function POST(req) {
  try {
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    }

    const { sender } = await req.json();
    
    // Agar A ne bheja hai toh target B hai, aur B ne bheja hai toh target A hai
    const targetUser = sender === "Student_A" ? "Student_B" : "Student_A";

    // MongoDB se Target User ka token nikalo
    const targetData = await PushToken.findOne({ username: targetUser });

    if (targetData && targetData.token) {
      // Magic Update: Send directly to Expo Push Server
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: targetData.token,
          sound: 'default',
          title: "Global Studies Hub",
          body: "New course modules have been added to your syllabus.",
          priority: 'high', // Wake the device up!
          channelId: 'default', 
        }),
      });
      return NextResponse.json({ success: true, message: "Ping sent successfully" });
    } else {
      return NextResponse.json({ success: false, error: "Target token not found in DB" });
    }

  } catch (error) {
    console.error("Push Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}