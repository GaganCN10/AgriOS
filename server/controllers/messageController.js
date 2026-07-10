const Message = require("../models/Message");

exports.sendMessage = async (req, res) => {
  try {
    const { recipient_id, subject, body, category, is_urgent, related_farm_id } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ error: "subject and body are required." });
    }

    const message = new Message({
      sender_id: req.user.id,
      recipient_id: recipient_id || null,
      subject,
      body,
      category: category || "DIRECT",
      is_urgent: is_urgent || false,
      related_farm_id: related_farm_id || null,
    });

    await message.save();
    res.status(201).json({ status: "success", message });
  } catch (err) {
    console.error("[Message Send Error]:", err.message);
    res.status(500).json({ error: "Failed to send message." });
  }
};

exports.getInbox = async (req, res) => {
  try {
    const { category, is_read } = req.query;
    const filter = { recipient_id: req.user.id };

    if (category) filter.category = category;
    if (is_read !== undefined) filter.is_read = is_read === "true";

    const messages = await Message.find(filter)
      .populate("sender_id", "name email role")
      .populate("related_farm_id", "farm_name district state")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    console.error("[Message Inbox Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch inbox." });
  }
};

exports.getSent = async (req, res) => {
  try {
    const messages = await Message.find({ sender_id: req.user.id })
      .populate("recipient_id", "name email role")
      .populate("related_farm_id", "farm_name district state")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    console.error("[Message Sent Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch sent messages." });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { message_id } = req.params;
    const message = await Message.findById(message_id);
    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    if (message.recipient_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    message.is_read = true;
    await message.save();
    res.json({ status: "success", message });
  } catch (err) {
    console.error("[Message Mark Read Error]:", err.message);
    res.status(500).json({ error: "Failed to mark message as read." });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    const message = await Message.findById(message_id);
    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    if (message.sender_id.toString() !== req.user.id && message.recipient_id?.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    await Message.findByIdAndDelete(message_id);
    res.json({ status: "success", message: "Message deleted." });
  } catch (err) {
    console.error("[Message Delete Error]:", err.message);
    res.status(500).json({ error: "Failed to delete message." });
  }
};
