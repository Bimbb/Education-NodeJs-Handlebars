const express = require("express");
const router = express.Router();
const blogController = require("../app/controllers/BlogController");

const {
    checkRequireAdmin,
} = require("../app/middlewares/AuthMiddleware");

router.get("/list",checkRequireAdmin, blogController.listBlog);
router.get("/list-category",checkRequireAdmin, blogController.listCategory);
router.delete("/:id/delete-category",checkRequireAdmin, blogController.deleteCategory);
router.post("/add-category",checkRequireAdmin, blogController.addCategory);
router.delete("/:id/delete",checkRequireAdmin, blogController.deleteBlog);


module.exports = router;