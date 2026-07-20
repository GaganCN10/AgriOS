const Inventory = require("../models/Inventory");
const Farm = require("../models/Farm");

exports.listInventory = async (req, res) => {
  try {
    const { farm_id } = req.query;
    const filter = {};
    if (farm_id) {
      if (req.user.role === "FARMER" || req.user.role === "FPO_ADMIN") {
        const farm = await Farm.findById(farm_id);
        if (!farm) return res.status(404).json({ error: "Farm not found." });
        if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
          return res.status(403).json({ error: "Unauthorized to access this farm inventory." });
        }
        filter.farm_id = farm_id;
      } else {
        return res.status(403).json({ error: "Insufficient role permissions." });
      }
    } else if (req.user.role === "FARMER") {
      const farms = await Farm.find({ owner_id: req.user.id }).select("_id");
      filter.farm_id = { $in: farms.map(f => f._id) };
    }

    const items = await Inventory.find(filter).sort({ category: 1, item_name: 1 });
    const lowStockItems = items.filter(item => item.quantity_on_hand <= item.safety_threshold);
    res.json({ items, low_stock_count: lowStockItems.length, low_stock_items: lowStockItems });
  } catch (err) {
    console.error("[Inventory List Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch inventory records." });
  }
};

exports.createInventoryItem = async (req, res) => {
  try {
    const { farm_id, item_name, category, quantity_on_hand, unit, safety_threshold, supplier_name, notes } = req.body;

    if (!farm_id || !item_name || !category) {
      return res.status(400).json({ error: "farm_id, item_name, and category are required." });
    }

    const farm = await Farm.findById(farm_id);
    if (!farm) return res.status(404).json({ error: "Farm not found." });
    if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to add inventory for this farm." });
    }

    const item = new Inventory({
      farm_id,
      item_name,
      category,
      quantity_on_hand: quantity_on_hand || 0,
      unit: unit || "units",
      safety_threshold: safety_threshold || 0,
      supplier_name: supplier_name || null,
      notes: notes || null,
    });

    await item.save();
    res.status(201).json({ status: "success", item });
  } catch (err) {
    console.error("[Inventory Create Error]:", err.message);
    res.status(500).json({ error: "Failed to create inventory item." });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const { item_id } = req.params;
    const { quantity_on_hand, safety_threshold, supplier_name, notes } = req.body;

    const item = await Inventory.findById(item_id);
    if (!item) return res.status(404).json({ error: "Inventory item not found." });

    const farm = await Farm.findById(item.farm_id);
    if (!farm) return res.status(404).json({ error: "Associated farm not found." });
    if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to modify this inventory." });
    }

    if (quantity_on_hand !== undefined) item.quantity_on_hand = quantity_on_hand;
    if (safety_threshold !== undefined) item.safety_threshold = safety_threshold;
    if (supplier_name !== undefined) item.supplier_name = supplier_name;
    if (notes !== undefined) item.notes = notes;

    await item.save();
    res.json({ status: "success", item });
  } catch (err) {
    console.error("[Inventory Update Error]:", err.message);
    res.status(500).json({ error: "Failed to update inventory item." });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    const { item_id } = req.params;
    const item = await Inventory.findById(item_id);
    if (!item) return res.status(404).json({ error: "Inventory item not found." });

    const farm = await Farm.findById(item.farm_id);
    if (!farm) return res.status(404).json({ error: "Associated farm not found." });
    if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to delete this inventory." });
    }

    await Inventory.findByIdAndDelete(item_id);
    res.json({ status: "success", message: "Inventory item deleted." });
  } catch (err) {
    console.error("[Inventory Delete Error]:", err.message);
    res.status(500).json({ error: "Failed to delete inventory item." });
  }
};

exports.getLowStockAlerts = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "FARMER") {
      const farms = await Farm.find({ owner_id: req.user.id }).select("_id");
      filter.farm_id = { $in: farms.map(f => f._id) };
    } else if (req.user.role === "FPO_ADMIN") {
      filter.farm_id = { $exists: true };
    } else {
      return res.status(403).json({ error: "Insufficient role permissions." });
    }

    const lowStockItems = await Inventory.find({
      ...filter,
      $expr: { $lte: ["$quantity_on_hand", "$safety_threshold"] }
    }).populate("farm_id", "farm_name district state");

    res.json({ low_stock_count: lowStockItems.length, items: lowStockItems });
  } catch (err) {
    console.error("[Low Stock Alert Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch low stock alerts." });
  }
};
