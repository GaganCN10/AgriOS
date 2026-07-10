const mongoose = require("mongoose");

const ContributionSchema = new mongoose.Schema({
  expert_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  contribution_type: { type: String, enum: ["DISEASE_VERIFICATION", "KNOWLEDGE_ARTICLE", "ADVISOR_RESPONSE", "COMMUNITY_POST"], required: true },
  reference_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  quality_score: { type: Number, min: 0, max: 5, default: 0 },
  response_time_minutes: { type: Number, default: null },
}, { timestamps: true });

const ReputationSchema = new mongoose.Schema({
  expert_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  total_contributions: { type: Number, default: 0 },
  average_quality_score: { type: Number, default: 0 },
  average_response_time_minutes: { type: Number, default: null },
  reputation_score: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = {
  Contribution: mongoose.model("Contribution", ContributionSchema),
  Reputation: mongoose.model("Reputation", ReputationSchema),
};
