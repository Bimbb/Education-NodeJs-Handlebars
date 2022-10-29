const express = require("express");
const router = express.Router();


const gradeController = require("../app/controllers/GradeController");



router.get("/list", gradeController.listGrade);
router.post("/list", gradeController.createGrade);
router.put('/:id', gradeController.update); 
router.delete('/:id', gradeController.delete);


module.exports = router;
