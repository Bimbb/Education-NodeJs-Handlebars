const express = require("express");
const router = express.Router();

const theoryController = require("../app/controllers/TheoryController");

const {
    checkRequireAdmin,
} = require("../app/middlewares/AuthMiddleware");


router.post("/:id/export", theoryController.generatePdf);
router.get("/detail", checkRequireAdmin, theoryController.detail);
router.get("/create", checkRequireAdmin, theoryController.create);
router.post("/create", checkRequireAdmin, theoryController.postCreate);
router.delete("/:id", checkRequireAdmin, theoryController.delete);
router.put("/:id", checkRequireAdmin, theoryController.update);

router.get("/:id", theoryController.show);
module.exports = router;