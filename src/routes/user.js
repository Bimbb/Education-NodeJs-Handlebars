const express = require("express");
const router = express.Router();

const userController = require("../app/controllers/UserController");
const upload = require("../app/middlewares/upload");
const {
    checkRequireAdmin,
} = require("../app/middlewares/AuthMiddleware");


router.get("/list", checkRequireAdmin, userController.listUser);
router.get("/create",checkRequireAdmin , userController.create);
router.post("/create",checkRequireAdmin , userController.createUser);
router.get('/:id/edit',checkRequireAdmin , userController.edit);
router.put('/:id',checkRequireAdmin , userController.update); 
router.delete('/:id', checkRequireAdmin ,userController.destroy);
router.delete('/:id/force',checkRequireAdmin , userController.forceDestroy);
router.post("/upload",checkRequireAdmin , upload.single("filename"), userController.addUserList);
router.post("/export",checkRequireAdmin , userController.export);

module.exports = router;
