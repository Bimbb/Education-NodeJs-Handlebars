const express = require("express");
const router = express.Router();


const gradeController = require("../app/controllers/GradeController");

const {
    checkRequireAdmin,
} = require("../app/middlewares/AuthMiddleware");


router.get("/api-list", gradeController.listGrades);
router.get("/list", checkRequireAdmin, gradeController.listGrade);
router.post("/list", checkRequireAdmin, gradeController.createGrade);
router.put('/:id', checkRequireAdmin, gradeController.update);
router.delete('/:id', checkRequireAdmin, gradeController.delete);

router.get('/:slug', gradeController.show);
module.exports = router;
