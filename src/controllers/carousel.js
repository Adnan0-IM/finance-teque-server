const mongoose = require("mongoose");
const CarouselItem = require("../models/CarouselItem");

function isObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Accepts full URLs (http/https) or site-relative paths starting with "/"
function isValidWebPath(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const v = value.trim();
  if (v.startsWith("/")) return true;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

exports.list = async (_req, res) => {
  try {
    const items = await CarouselItem.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: items });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch items",
        error: err.message,
      });
  }
};

exports.create = async (req, res) => {
  try {
    const { title = "", description = "", image, link = "" } = req.body || {};

    if (!image || !isValidWebPath(image)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid or missing 'image' (URL or /path required)",
        });
    }
    if (link && !isValidWebPath(link)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid 'link' (must be URL or /path)",
        });
    }

    const item = await CarouselItem.create({ title, description, image, link });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create item",
        error: err.message,
      });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid item id" });
    }

    const { title, description, image, link } = req.body || {};
    const update = {};
    if (title !== undefined) update.title = String(title);
    if (description !== undefined) update.description = String(description);
    if (image !== undefined) {
      if (!isValidWebPath(image)) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid 'image' (must be URL or /path)",
          });
      }
      update.image = image;
    }
    if (link !== undefined) {
      if (link && !isValidWebPath(link)) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid 'link' (must be URL or /path)",
          });
      }
      update.link = link;
    }

    const item = await CarouselItem.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });

    res.json({ success: true, data: item });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update item",
        error: err.message,
      });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid item id" });
    }
    const deleted = await CarouselItem.findByIdAndDelete(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });

    res.json({ success: true, message: "Item deleted" });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete item",
        error: err.message,
      });
  }
};
