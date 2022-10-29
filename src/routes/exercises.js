const express = require("express");
const router = express.Router();

const exerciseController = require("../app/controllers/ExerciseController");
const upload = require("../app/middlewares/upload");


router.post("/upload", upload.single("file"), exerciseController.createToFile);
router.get("/create", exerciseController.create);
router.post("/create",  exerciseController.postCreate);
router.get("/detail", exerciseController.detail);
router.delete("/:id",  exerciseController.delete);
router.put("/:id",  exerciseController.update);
router.post("/:id/export",  exerciseController.export);

module.exports = router;