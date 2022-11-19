const express = require("express");
const router = express.Router();


const subjectController = require("../app/controllers/SubjectController");
const {
    checkRequireAdmin,
    requireAuth,
} = require("../app/middlewares/AuthMiddleware");




//admin
router.get("/list", checkRequireAdmin, subjectController.listSubject);
router.post("/:gradeId/theory", checkRequireAdmin, subjectController.createSubjectTheory);
router.get("/:gradeId/theory", checkRequireAdmin, subjectController.createSubjectTheory);
router.post("/:gradeId/bible", checkRequireAdmin, subjectController.createSubjectBible);
router.get("/:gradeId/bible", checkRequireAdmin, subjectController.createSubjectBible);

//user
router.get("/theory/:slug", subjectController.showTheory);
router.get("/bible/:slug", subjectController.showBible);

module.exports = router;
