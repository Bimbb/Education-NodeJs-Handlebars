const express = require("express");
const router = express.Router();


const lessonController = require("../app/controllers/LessonController");

router.post("/create", lessonController.create);
router.put("/:id", lessonController.update);
router.delete("/:id", lessonController.delete);


module.exports = router;