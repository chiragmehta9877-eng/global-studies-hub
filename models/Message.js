// models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  encryptedText: { type: String, required: true }, // Tera CryptoJS wala kachra
  createdAt: { type: Date, default: Date.now } // 15s baad delete karne ka hisaab rakhne ke liye
});

export default mongoose.models.Message || mongoose.model("Message", messageSchema);