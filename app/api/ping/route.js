import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { sender } = await req.json();
    const targetUser = sender === "Student_A" ? "Student_B" : "Student_A";

    // IMPORTANT: Make sure your subscribe logic now saves the EXPO token here, not the web-push sub object
    const targetToken = global.pushSubscriptions?.[targetUser];

    if (targetToken) {
      // Magic Update: Send directly to Expo Push Server
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: targetToken,
          sound: 'default',
          title: "Global Studies Hub",
          body: "New course modules have been added to your syllabus.",
          priority: 'high', // Wake the device up!
          channelId: 'default', 
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}