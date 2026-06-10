import { NextResponse } from "next/server";
import mongoose from "mongoose";
import PushToken from "../../../models/PushToken";

export async function POST(req) {
  try {
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    }
    
    const { subscription, username } = await req.json(); // subscription hi hamara Expo Token hai

    if (!subscription || !username) {
      return NextResponse.json({ success: false, error: "Missing data" });
    }

    // Token DB mein save ya update (Upsert) kar do
    await PushToken.findOneAndUpdate(
      { username: username },
      { token: subscription },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: "Token permanently saved to DB" });
  } catch (error) {
    console.error("DB Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" });
  }
}