import { NextResponse } from "next/server";

// Development ke liye in-memory variable (Production me MongoDB use karna padega)
global.pushSubscriptions = global.pushSubscriptions || {};

export async function POST(req) {
  try {
    const { subscription, username } = await req.json();
    
    // User ke naam pe subscription object save kar lo
    global.pushSubscriptions[username] = subscription;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}