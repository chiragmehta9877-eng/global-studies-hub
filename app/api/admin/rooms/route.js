import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb";
import Room from "../../../../models/Room";

// GET: Sabhi rooms fetch karne ke liye
export async function GET() {
  try {
    await connectToDatabase();
    const rooms = await Room.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, rooms });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Naya room create karne ke liye
export async function POST(req) {
  try {
    const body = await req.json();
    await connectToDatabase();
    
    const newRoom = await Room.create({
      channelName: body.channelName,
      userA: { uid: body.userA_uid, pin: body.userA_pin, name: "Student_A" },
      userB: { uid: body.userB_uid, pin: body.userB_pin, name: "Student_B" }
    });
    
    return NextResponse.json({ success: true, room: newRoom });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Room edit/update karne ke liye (FIXED FOR FLATTENED DATA)
export async function PUT(req) {
  try {
    const body = await req.json();
    await connectToDatabase();
    
    const updatedRoom = await Room.findByIdAndUpdate(
      body._id, 
      {
        channelName: body.channelName,
        userA: { uid: body.userA_uid, pin: body.userA_pin, name: "Student_A" },
        userB: { uid: body.userB_uid, pin: body.userB_pin, name: "Student_B" }
      }, 
      { new: true } // Return updated document
    );
    
    if (!updatedRoom) {
      return NextResponse.json({ success: false, error: "Node not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Room delete karne ke liye
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: "ID missing" }, { status: 400 });
    }

    await connectToDatabase();
    await Room.findByIdAndDelete(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}