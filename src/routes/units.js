const express = require("express");
const router = express.Router();

const upload = require("../util/upload-image");
const {
    checkRequireAdmin,
} = require("../app/middlewares/AuthMiddleware");


const unitController = require("../app/controllers/UnitController");

router.post("/upload", upload.single("file"), unitController.upload);
router.post("/create", checkRequireAdmin, unitController.postCreate);
router.put("/:id", checkRequireAdmin, unitController.update);
router.delete("/:id", checkRequireAdmin, unitController.delete);
router.get("/:id/detail", checkRequireAdmin, unitController.detail);

router.get("/:id", unitController.show);

module.exports = router;
