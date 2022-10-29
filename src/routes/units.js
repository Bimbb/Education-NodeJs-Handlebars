const express = require("express");
const router = express.Router();




const unitController = require("../app/controllers/UnitController");


router.post("/create", unitController.postCreate);
router.put("/:id", unitController.update);
router.delete("/:id", unitController.delete);
router.get("/:id/detail", unitController.detail);



module.exports = router;
