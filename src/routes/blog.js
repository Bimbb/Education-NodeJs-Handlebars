const express = require("express");
const router = express.Router();
const blogController = require("../app/controllers/BlogController");


router.get("/list", blogController.listBlog);
router.get("/list-category", blogController.listCategory);
router.delete("/:id/delete-category", blogController.deleteCategory);
router.post("/add-category", blogController.addCategory);
router.delete("/:id/delete", blogController.deleteBlog);


module.exports = router;