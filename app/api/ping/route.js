import webpush from "web-push";
import { NextResponse } from "next/server";

// IMPORTANT: Add a valid mailto email here
webpush.setVapidDetails(
  "mailto:admin@globalstudieshub.edu", // Decoy email ya apna real email daal de
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(req) {
  try {
    const { sender } = await req.json();
    const targetUser = sender === "Student_A" ? "Student_B" : "Student_A";

    const sub = global.pushSubscriptions?.[targetUser];

    if (sub) {
      // THE MAGIC UPDATE LIVES HERE
      await webpush.sendNotification(
        sub,
        JSON.stringify({
          title: "Global Studies Hub",
          body: "New course modules have been added to your syllabus.",
        }),
        {
          TTL: 86400, // 24 hours tak retry karega
          headers: {
            'Urgency': 'high' // Chrome ko deep sleep se uthane ke liye force karega
          }
        }
      );
      
      return NextResponse.json({ success: true, message: "Ping sent." });
    } else {
      return NextResponse.json({ error: "Partner not subscribed yet." }, { status: 404 });
    }
  } catch (error) {
    console.error("Web Push Error:", error);
    return NextResponse.json({ error: "Failed to ping node" }, { status: 500 });
  }
}