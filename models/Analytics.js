import mongoose from "mongoose";

const AnalyticsSchema = new mongoose.Schema({
  actionType: { type: String, required: true }, // e.g., 'VIEW_TAB', 'VIEW_REPORT', 'SEARCH'
  details: { type: String }, // e.g., 'research', 'Global Warming Report', 'TOUR-404'
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.Analytics || mongoose.model("Analytics", AnalyticsSchema);