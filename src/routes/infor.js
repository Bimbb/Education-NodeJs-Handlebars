const express = require("express");
const router = express.Router();

const inforController = require("../app/controllers/InforController");
const upload = require("../util/upload-image");

router.put(
    "/:id/avatar",
    upload.single("avatar"),
    inforController.changeAvatar
);
router.put("/:id", inforController.update);

module.exports = router;
