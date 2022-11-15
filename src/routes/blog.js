const express = require("express");
const router = express.Router();
const blogController = require("../app/controllers/BlogController");

const {
    checkRequireAdmin,
} = require("../app/middlewares/AuthMiddleware");

router.get("/list", checkRequireAdmin, blogController.listBlog);
router.get("/list-category", checkRequireAdmin, blogController.listCategory);
router.delete("/:id/delete-category", checkRequireAdmin, blogController.deleteCategory);
router.post("/add-category", checkRequireAdmin, blogController.addCategory);
router.delete("/:id/delete", checkRequireAdmin, blogController.deleteBlog);
router.get("/create", blogController.create);
router.post("/post", blogController.postBlog);
router.get("/:id/edit", blogController.update);
router.put("/:id/edit", blogController.putUpdate);


router.get("/", blogController.show);
router.get("/:slug", blogController.detail);
module.exports = router;