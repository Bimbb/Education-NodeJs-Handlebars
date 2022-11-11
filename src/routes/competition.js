const express = require("express");
const router = express.Router();

const competitionController = require("../app/controllers/CompetitionController");

const {
    checkRequireAdmin,
    requireAuth,
} = require("../app/middlewares/AuthMiddleware");


router.post("/ranks/month", competitionController.ranksMonth);
router.post("/ranks/week", competitionController.ranksWeek);
router.get("/ranks", checkRequireAdmin, competitionController.ranks);
router.get("/:id", requireAuth , competitionController.detail);

module.exports = router;
