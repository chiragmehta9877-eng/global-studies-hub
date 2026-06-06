import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb";
import Material from "../../../../models/Material";

export async function GET() {
  try {
    await connectToDatabase();
    const items = await Material.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, items });
  } catch (error) { return NextResponse.json({ success: false, error: error.message }); }
}

export async function POST(req) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const newItem = await Material.create(body);
    return NextResponse.json({ success: true, item: newItem });
  } catch (error) { return NextResponse.json({ success: false, error: error.message }); }
}

// --- NEW: UPDATE STUDY MATERIAL ---
export async function PUT(req) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const updatedItem = await Material.findByIdAndUpdate(body._id, body, { new: true });
    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error) { return NextResponse.json({ success: false, error: error.message }); }
}

// --- DELETE ---
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await connectToDatabase();
    await Material.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ success: false, error: error.message }); }
}