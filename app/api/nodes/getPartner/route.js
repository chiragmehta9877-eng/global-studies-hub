import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb";
import Room from "../../../../models/Room";

export async function POST(req) {
  try {
    await connectToDatabase();
    const { username } = await req.json();

    // 1. Fix: Use 'Room' instead of 'NodeModel'
    // 2. Fix: Check inside the nested objects using dot notation
    const room = await Room.findOne({
       $or: [
         { "userA.uid": username }, 
         { "userA.name": username },
         { "userB.uid": username },
         { "userB.name": username }
       ]
    });

    if (!room) {
      return NextResponse.json({ success: false, error: "Node not found" });
    }

    // 3. Fix: Safely extract partner's name from the nested object
    let partnerName = "Unknown";
    if (room.userA.uid === username || room.userA.name === username) {
      partnerName = room.userB.name || room.userB.uid;
    } else {
      partnerName = room.userA.name || room.userA.uid;
    }

    // 4. Fix: Return 'room.channelName' because that's what is in your Room.js schema
    return NextResponse.json({ 
      success: true, 
      partner: partnerName, 
      nodeName: room.channelName 
    });
    
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message });
  }
}