const express = require("express");
const router = express.Router();

const {
    checkRequireAdmin,
} = require("../app/middlewares/AuthMiddleware");

const lessonController = require("../app/controllers/LessonController");
const upload = require("../app/middlewares/upload");




router.post("/upload", upload.single("file"), lessonController.upload);

router.post("/create", checkRequireAdmin, lessonController.create);
router.put("/:id", checkRequireAdmin, lessonController.update);
router.delete("/:id", checkRequireAdmin, lessonController.delete);

router.get("/:id", lessonController.show);

router.post("/api-list",lessonController.apiListLesson);

module.exports = router;