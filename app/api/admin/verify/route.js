import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Settings from "../../../../models/Settings"; // Path zaroor check kar lena

export async function POST(req) {
  try {
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    }
    
    const { adminId, adminPass } = await req.json();
    const settings = await Settings.findOne({ type: "global" });

    if (!settings) {
      return NextResponse.json({ success: false, error: "Settings not initialized" });
    }

    // 🔥 THE FIX: Agar DB mein fields missing hain, toh fallback 'admin' aur 'admin123' use karo
    const validUser = settings.adminUser || "admin";
    const validPass = settings.adminPass || "admin123";

    if (validUser === adminId && validPass === adminPass) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: "Access Denied" });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server Error" });
  }
}