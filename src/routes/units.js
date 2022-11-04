const express = require("express");
const router = express.Router();


const {
    checkRequireAdmin,
} = require("../app/middlewares/AuthMiddleware");


const unitController = require("../app/controllers/UnitController");


router.post("/create",checkRequireAdmin, unitController.postCreate);
router.put("/:id", checkRequireAdmin ,unitController.update);
router.delete("/:id", checkRequireAdmin ,unitController.delete);
router.get("/:id/detail",checkRequireAdmin , unitController.detail);



module.exports = router;
