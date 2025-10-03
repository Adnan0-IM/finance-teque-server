const express = require("express");
const router = express.Router();
const controller = require("../controllers/carousel");

// GET /api/carousel
router.get("/", controller.list);

// POST /api/carousel
router.post("/", controller.create);

// PUT /api/carousel/:id
router.put("/:id", controller.update);

// DELETE /api/carousel/:id
router.delete("/:id", controller.remove);

module.exports = router;
