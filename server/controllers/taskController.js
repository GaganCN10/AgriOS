const Task = require("../models/Task");
const Farm = require("../models/Farm");

exports.listTasks = async (req, res) => {
  try {
    const { farm_id, crop_cycle_id, status } = req.query;
    const filter = {};

    if (farm_id) {
      const farm = await Farm.findById(farm_id);
      if (!farm) return res.status(404).json({ error: "Farm not found." });
      if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized to access tasks for this farm." });
      }
      filter.farm_id = farm_id;
    } else if (req.user.role === "FARMER") {
      const farms = await Farm.find({ owner_id: req.user.id }).select("_id");
      filter.farm_id = { $in: farms.map(f => f._id) };
    }

    if (crop_cycle_id) filter.crop_cycle_id = crop_cycle_id;
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate("assigned_to", "name email")
      .populate("created_by", "name email")
      .populate("crop_cycle_id", "crop_name crop_variety stage")
      .sort({ priority: -1, scheduled_start: 1 });

    res.json(tasks);
  } catch (err) {
    console.error("[Task List Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch tasks." });
  }
};

exports.createTask = async (req, res) => {
  try {
    const {
      farm_id,
      crop_cycle_id,
      assigned_to,
      title,
      description,
      category,
      priority,
      scheduled_start,
      scheduled_end,
    } = req.body;

    if (!farm_id || !title || !category) {
      return res.status(400).json({ error: "farm_id, title, and category are required." });
    }

    const farm = await Farm.findById(farm_id);
    if (!farm) return res.status(404).json({ error: "Farm not found." });
    if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to create tasks for this farm." });
    }

    const task = new Task({
      farm_id,
      crop_cycle_id: crop_cycle_id || null,
      assigned_to: assigned_to || null,
      created_by: req.user.id,
      title,
      description: description || null,
      category,
      priority: priority || "MEDIUM",
      scheduled_start: scheduled_start ? new Date(scheduled_start) : null,
      scheduled_end: scheduled_end ? new Date(scheduled_end) : null,
    });

    await task.save();
    res.status(201).json({ status: "success", task });
  } catch (err) {
    console.error("[Task Create Error]:", err.message);
    res.status(500).json({ error: "Failed to create task." });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { task_id } = req.params;
    const updates = req.body;

    const task = await Task.findById(task_id);
    if (!task) return res.status(404).json({ error: "Task not found." });

    const farm = await Farm.findById(task.farm_id);
    if (!farm) return res.status(404).json({ error: "Associated farm not found." });
    if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to modify this task." });
    }

    const allowedFields = ["assigned_to", "equipment_id", "status", "priority", "scheduled_start", "scheduled_end", "actual_start", "actual_end", "labor_hours", "cost_incurred_inr", "completion_notes", "title", "description", "category"];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === "scheduled_start" || field === "scheduled_end" || field === "actual_start" || field === "actual_end") {
          task[field] = updates[field] ? new Date(updates[field]) : null;
        } else {
          task[field] = updates[field];
        }
      }
    });

    if (updates.status === "COMPLETED" && !task.actual_end) {
      task.actual_end = new Date();
    }

    await task.save();
    res.json({ status: "success", task });
  } catch (err) {
    console.error("[Task Update Error]:", err.message);
    res.status(500).json({ error: "Failed to update task." });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { task_id } = req.params;
    const task = await Task.findById(task_id);
    if (!task) return res.status(404).json({ error: "Task not found." });

    const farm = await Farm.findById(task.farm_id);
    if (!farm) return res.status(404).json({ error: "Associated farm not found." });
    if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to delete this task." });
    }

    await Task.findByIdAndDelete(task_id);
    res.json({ status: "success", message: "Task deleted." });
  } catch (err) {
    console.error("[Task Delete Error]:", err.message);
    res.status(500).json({ error: "Failed to delete task." });
  }
};
