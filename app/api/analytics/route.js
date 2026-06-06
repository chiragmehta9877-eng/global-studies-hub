import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import Analytics from "../../../models/Analytics";

export async function GET() {
  await connectToDatabase();
  const tabViews = await Analytics.countDocuments({ actionType: 'VIEW_TAB' });
  const reportsViewed = await Analytics.countDocuments({ actionType: 'VIEW_REPORT' });
  const searches = await Analytics.countDocuments({ actionType: 'SEARCH' });
  return NextResponse.json({ success: true, stats: { tabViews, reportsViewed, searches } });
}

export async function POST(req) {
  await connectToDatabase();
  const body = await req.json();
  await Analytics.create({ actionType: body.actionType, details: body.details });
  return NextResponse.json({ success: true });
}