const express = require("express");
const router = express.Router();

const {
    checkRequireAdmin,
} = require("../app/middlewares/AuthMiddleware");

const reportController = require("../app/controllers/ReportController");

router.get("/list", checkRequireAdmin , reportController.list);
router.delete("/:id", reportController.delete);
router.post("/export", reportController.export);



module.exports = router;