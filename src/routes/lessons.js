const express = require("express");
const router = express.Router();

const {
    checkRequireAdmin,
} = require("../app/middlewares/AuthMiddleware");

const lessonController = require("../app/controllers/LessonController");

router.post("/create", checkRequireAdmin, lessonController.create);
router.put("/:id", checkRequireAdmin, lessonController.update);
router.delete("/:id",checkRequireAdmin,  lessonController.delete);


module.exports = router;