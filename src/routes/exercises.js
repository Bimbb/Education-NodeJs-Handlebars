const express = require("express");
const router = express.Router();

const exerciseController = require("../app/controllers/ExerciseController");
const upload = require("../app/middlewares/upload");

const {
    checkRequireAdmin,
} = require("../app/middlewares/AuthMiddleware");

router.post("/upload",checkRequireAdmin, upload.single("file"), exerciseController.createToFile);
router.get("/create", checkRequireAdmin,exerciseController.create);
router.post("/create",checkRequireAdmin,  exerciseController.postCreate);
router.get("/detail",checkRequireAdmin, exerciseController.detail);
router.delete("/:id", checkRequireAdmin, exerciseController.delete);
router.put("/:id",checkRequireAdmin,  exerciseController.update);
router.post("/:id/export",checkRequireAdmin,  exerciseController.export);

module.exports = router;