const express = require("express");
const router = express.Router();

const competitionController = require("../app/controllers/CompetitionController");

const {
    checkRequireAdmin,
} = require("../app/middlewares/AuthMiddleware");


router.get("/ranks", checkRequireAdmin, competitionController.ranks);
router.get("/:id", checkRequireAdmin, competitionController.detail);

module.exports = router;
