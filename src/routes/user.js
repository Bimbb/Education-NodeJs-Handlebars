const express = require("express");
const router = express.Router();

const userController = require("../app/controllers/UserController");



router.get("/list", userController.listUser);
router.get("/create", userController.create);
router.post("/create", userController.createUser);
router.get('/:id/edit', userController.edit);
router.put('/:id', userController.update); 
router.delete('/:id', userController.destroy);
router.delete('/:id/force', userController.forceDestroy);

module.exports = router;
