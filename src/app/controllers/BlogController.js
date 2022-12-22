const Blog = require("../models/Blog");
const BlogCategory = require("../models/BlogCategory");
const User = require("../models/User");
const mongoose = require("mongoose");
const { multipleMongooseToObject, mongooseToObject } = require('../../util/mongoose')
const ObjectId = mongoose.Types.ObjectId;
class BlogController {

    // [GET]/blog/
    async show(req, res, next) {
        const blog = await Blog.aggregate([
            {
                $lookup: {
                    from: "blog-categories",
                    localField: "bcID",
                    foreignField: "_id",
                    as: "BlogCategory",
                },
            },
        ]);
        res.render('blog/show', {
            blog
        })
    }
    async showapi(req, res, next) {
        const blog = await Blog.aggregate([
            {
                $lookup: {
                    from: "blog-categories",
                    localField: "bcID",
                    foreignField: "_id",
                    as: "BlogCategory",
                },
            },
        ]);
        
        res.status(200).send(JSON.stringify(blog))
    }


    // [GET]/blog/:slug
    async detail(req, res, next) {
        const blog = await Blog.findOne({ slug: req.params.slug });

        const customBlog = await Blog.aggregate([
            {
                $lookup: {
                    from: "blog-categories",
                    localField: "bcID",
                    foreignField: "_id",
                    as: "BlogCategory",
                },
            },
        ]);
        res.render("blog/detail", {
            success: req.flash("success"),
            errors: req.flash("error"),
            blog: mongooseToObject(blog),
            customBlog,
        });
    }


    async create(req, res) {
        const categories = await BlogCategory.find({});
        res.render("blog/create", {
            categories: multipleMongooseToObject(categories),
            layout: "admin",
            success: req.flash("success"),
            errors: req.flash("error"),
        });
    }

    //Post /blog/post
    async postBlog(req, res) {
        const formDate = req.body;
        const blog = new Blog(formDate);
        await blog.save();
        req.flash("success", "Đã thêm 1 bài viết mới thành công!");
        res.redirect("/blog/list");
    }

    // [GET]/blog/:id/edit
    async update(req, res) {
        const blog = await Blog.findOne({ _id: req.params.id });
        const categories = await BlogCategory.find({});
        res.render("blog/edit", {
            success: req.flash("success"),
            errors: req.flash("error"),
            categories: multipleMongooseToObject(categories),
            layout: "admin",
            blog: mongooseToObject(blog),
        });
    }

    // [PUT]/blog/:id/edit
    async putUpdate(req, res) {
        await Blog.updateOne({ _id: req.params.id }, req.body);
        req.flash("success", "Cập nhật bài viết thành công!");
        res.redirect("/blog/list");
    }

    async deleteBlog(req, res) {
        await Blog.deleteOne({ _id: req.params.id });
        req.flash("success", "Xóa bài viết thành công!");
        res.redirect("/blog/list");
    }

    async addCategory(req, res) {
        const formDate = req.body;
        const category = new BlogCategory(formDate);
        await category.save();
        req.flash("success", "Đã thêm 1 thể loại!");
        res.redirect("back");
    }

    async listCategory(req, res) {
        const categories = await BlogCategory.find({});
        res.render("blog/list-category", {
            success: req.flash("success"),
            errors: req.flash("error"),
            layout: "admin",
            categories: multipleMongooseToObject(categories),
        });
    }

    async deleteCategory(req, res, next) {
        await BlogCategory.deleteOne({ _id: req.params.id });
        req.flash("success", "Đã xóa thành công!");
        res.redirect("back");
    }
    // [GET]/blog/list-blog
    async listBlog(req, res) {
        const categories = await BlogCategory.find({});
        const blogs = await Blog.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userID",
                    foreignField: "_id",
                    as: "User",
                },
            },
            {
                $lookup: {
                    from: "blog-categories",
                    localField: "bcID",
                    foreignField: "_id",
                    as: "BlogCategory",
                },
            },
            { $sort: { view: -1 } },
        ]);

        res.render("blog/list-blog", {
            success: req.flash("success"),
            errors: req.flash("error"),
            blogs,
            categories: multipleMongooseToObject(categories),
            layout: "admin",
        });
    }


}

module.exports = new BlogController();
