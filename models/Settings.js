import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true, default: "global" },
  triggerWord: { type: String, required: true },
  adminUser: { type: String, default: "admin" }, // Vault Admin ID
  adminPass: { type: String, default: "admin123" } // Vault Admin Password
});

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);