// app/api/auth/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import Room from "../../../models/Room";

export async function POST(req) {
  try {
    const { uid, pin } = await req.json();
    await connectToDatabase();

    // Database mein room dhoondo jismein UserA ya UserB ke credentials match ho rahe hon
    const room = await Room.findOne({
      $or: [
        { "userA.uid": uid, "userA.pin": pin },
        { "userB.uid": uid, "userB.pin": pin }
      ]
    });

    if (!room) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    // Identify karna ki login kisne kiya hai (Student_A ya Student_B)
    let currentUser = null;
    if (room.userA.uid === uid && room.userA.pin === pin) {
      currentUser = { name: room.userA.name, channel: room.channelName };
    } else {
      currentUser = { name: room.userB.name, channel: room.channelName };
    }

    return NextResponse.json({ success: true, user: currentUser });
    
  } catch (error) {
    console.error("Auth Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}