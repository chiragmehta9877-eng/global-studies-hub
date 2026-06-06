import mongoose from "mongoose";

const MaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true }, // Short summary for cards
  category: { type: String, default: "General Research" }, // e.g. Economics, Tourism
  fullContent: { type: String, required: true }, // The actual boring text
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Material || mongoose.model("Material", MaterialSchema);