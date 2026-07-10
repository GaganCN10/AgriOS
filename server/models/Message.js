const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  category: { type: String, enum: ["DIRECT", "BULLETIN", "ALERT"], default: "DIRECT" },
  is_read: { type: Boolean, default: false },
  is_urgent: { type: Boolean, default: false },
  related_farm_id: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", default: null },
}, { timestamps: true });

module.exports = mongoose.model("Message", MessageSchema);
