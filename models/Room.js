// models/Room.js
import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  channelName: { 
    type: String, 
    required: true, 
    unique: true 
  },
  userA: {
    uid: { type: String, required: true },
    pin: { type: String, required: true },
    name: { type: String, default: "Student_A" }
  },
  userB: {
    uid: { type: String, required: true },
    pin: { type: String, required: true },
    name: { type: String, default: "Student_B" }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.models.Room || mongoose.model("Room", RoomSchema);