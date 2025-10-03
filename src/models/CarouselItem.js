const mongoose = require("mongoose");

const CarouselItemSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    image: { type: String, required: true, trim: true }, // URL or /path
    link: { type: String, trim: true, default: "" }, // URL or /path
  },
  { timestamps: true }
);

module.exports = mongoose.model("CarouselItem", CarouselItemSchema);
