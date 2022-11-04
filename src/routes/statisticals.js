const express = require("express");
const router = express.Router();

const statisticalController = require("../app/controllers/StatisticalController");

// router.post("/:id/export", statisticalController.export);
// router.get("/:id/detail", statisticalController.detail);
// router.delete("/:id", statisticalController.delete);
router.get("/", statisticalController.show);

module.exports = router;
