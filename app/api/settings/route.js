import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Settings from "../../../models/Settings"; // Dhyan rakhna ye path tere project structure se match kare

export async function GET() {
  try {
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    }
    
    let settings = await Settings.findOne({ type: "global" });
    
    // Agar database mein settings nahi hain, toh default bana dega
    if (!settings) {
      settings = await Settings.create({ 
        type: "global", 
        triggerWord: "TOUR-404-LIVE", 
        adminUser: "admin", 
        adminPass: "admin123" 
      });
    }
    
    // Password wapis frontend pe nahi bhej rahe security ke liye, sirf username bhej rahe hain
    return NextResponse.json({ success: true, triggerWord: settings.triggerWord, adminUser: settings.adminUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch settings" });
  }
}

export async function POST(req) {
  try {
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    }
    
    const body = await req.json();
    
    // Jo bhi data frontend se aayega, usko updateData object mein daalenge
    let updateData = {};
    if (body.triggerWord) updateData.triggerWord = body.triggerWord;
    if (body.adminUser) updateData.adminUser = body.adminUser;
    if (body.adminPass) updateData.adminPass = body.adminPass;

    await Settings.findOneAndUpdate(
      { type: "global" },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update settings" });
  }
}