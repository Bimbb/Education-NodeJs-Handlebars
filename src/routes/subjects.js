const express = require("express");
const router = express.Router();


const subjectController = require("../app/controllers/SubjectController");



router.get("/list", subjectController.listSubject);
router.post("/:gradeId/theory", subjectController.createSubjectTheory);
router.get("/:gradeId/theory", subjectController.createSubjectTheory);
router.post("/:gradeId/bible", subjectController.createSubjectBible);
router.get("/:gradeId/bible", subjectController.createSubjectBible);

module.exports = router;
