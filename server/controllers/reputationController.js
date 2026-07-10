const { Contribution, Reputation } = require("../models/Contribution");

exports.recordContribution = async (req, res) => {
  try {
    if (req.user.role !== "EXPERT" && req.user.role !== "FPO_ADMIN") {
      return res.status(403).json({ error: "Insufficient permissions." });
    }

    const { contribution_type, reference_id, quality_score, response_time_minutes } = req.body;
    if (!contribution_type || !reference_id) {
      return res.status(400).json({ error: "contribution_type and reference_id are required." });
    }

    const contribution = new Contribution({
      expert_id: req.user.id,
      contribution_type,
      reference_id,
      quality_score: quality_score || 0,
      response_time_minutes: response_time_minutes || null,
    });

    await contribution.save();

    const allContributions = await Contribution.find({ expert_id: req.user.id });
    const totalContributions = allContributions.length;
    const avgQuality = allContributions.reduce((sum, c) => sum + (c.quality_score || 0), 0) / (totalContributions || 1);
    const times = allContributions.filter(c => c.response_time_minutes !== null).map(c => c.response_time_minutes);
    const avgTime = times.length > 0 ? times.reduce((sum, t) => sum + t, 0) / times.length : null;
    const reputationScore = Math.round((avgQuality * 100) + (totalContributions * 2) + (avgTime ? Math.max(0, 60 - avgTime) * 0.5 : 0));

    let reputation = await Reputation.findOne({ expert_id: req.user.id });
    if (!reputation) {
      reputation = new Reputation({ expert_id: req.user.id });
    }
    reputation.total_contributions = totalContributions;
    reputation.average_quality_score = parseFloat(avgQuality.toFixed(2));
    reputation.average_response_time_minutes = avgTime ? parseFloat(avgTime.toFixed(1)) : null;
    reputation.reputation_score = reputationScore;
    await reputation.save();

    res.status(201).json({ status: "success", contribution, reputation });
  } catch (err) {
    console.error("[Contribution Record Error]:", err.message);
    res.status(500).json({ error: "Failed to record contribution." });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Reputation.find()
      .populate("expert_id", "name email role")
      .sort({ reputation_score: -1 })
      .limit(50);

    res.json(leaderboard);
  } catch (err) {
    console.error("[Leaderboard Fetch Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch leaderboard." });
  }
};
