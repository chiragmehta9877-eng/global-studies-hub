import mongoose from "mongoose";

const PushTokenSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Jaise: 'Student_A'
  token: { type: String, required: true } // Expo Push Token
});

export default mongoose.models.PushToken || mongoose.model("PushToken", PushTokenSchema);