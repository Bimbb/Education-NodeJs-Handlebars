const { multipleMongooseToObject: multipleMongooseToObject, mongooseToObject } = require('../../util/mongoose')
const Subject = require("../models/Subject");
const Grade = require("../models/Grade");
const User = require("../models/User");
const Blog = require("../models/Blog");
const BlogCategory = require("../models/BlogCategory");
const Statistical = require("../models/Statistical");
const Unit = require("../models/Unit");
const Exercise = require("../models/Exercise");
const Lesson = require("../models/Lesson");
const Room = require("../models/Room");
const Rank = require("../models/Rank");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Admin = require('../models/Admin');
const Report = require("../models/Report");
const ObjectId = mongoose.Types.ObjectId;

class SiteController {



    // [GET] /
    async index(req, res, next) {

        const customGrade = await Grade.aggregate([
            {
                $lookup: {
                    from: "subjects",
                    localField: "_id",
                    foreignField: "gradeID",
                    as: "subject",
                },
            },
        ]);

        const gradeSoCap = await Grade.find({ "name": /.*Sơ Cấp*./ })
        const gradeCanBan = await Grade.find({ "name": /.*Căn Bản*./ })
        const gradeKinhThanh = await Grade.find({ "name": /.*Kinh Thánh*./ })
        const gradeVaoDoi = await Grade.find({ "name": /.*Vào Đời*./ })

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


        res.render("index", {
            success: req.flash("success"),
            errors: req.flash("error"),
            customGrade,
            customBlog,
            gradeSoCap: multipleMongooseToObject(gradeSoCap),
            gradeCanBan: multipleMongooseToObject(gradeCanBan),
            gradeKinhThanh: multipleMongooseToObject(gradeKinhThanh),
            gradeVaoDoi: multipleMongooseToObject(gradeVaoDoi),
        });
    }

    // [GET] /search
    search(req, res) {
        res.render('search');
    }

    async infor(req, res) {
        try {
            res.render("auth/infor", {

                success: req.flash("success"),
                errors: req.flash("error"),
            });
        } catch (error) {
            res.send('lỗi rồi')
        }
    }

    // [PUT]/infor/:id
    async updateInfor(req, res) {
        const { fullname, phone, birthDay, address } = req.body;
        const user = await User.findById(req.params.id);
        const checkUser = await User.findOne({
            fullname,
            phone,
            birthDay,
            address,
        });
        if (checkUser) {
            res.redirect("back");
            return;
        }

        const phones = await User.find({ phone: phone });
        const checkPhone = phones.filter((x) => x.phone !== user.phone);
        if (checkPhone.length > 0) {
            req.flash("error", "Số điện thoại này đã có người sử dụng!");
            res.redirect("back");
            return;
        }

        await User.updateOne(
            { _id: req.signedCookies.userId },
            {
                fullname,
                phone,
                birthDay,
                address,
                // username: slugify(fullname).toLowerCase(),
            }
        );
        req.flash("success", "Cập nhật thông tin thành công!");
        res.redirect("back");
    }

    // [GET]/admin
    async admin(req, res) {
        const countUsers = await User.countDocuments({});
        const countGrade = await Grade.countDocuments({});
        const countUnits = await Unit.countDocuments({});
        const countLessons = await Lesson.countDocuments({});
        const countExercises = await Exercise.countDocuments({});
        const countBlogs = await Blog.countDocuments({});
        const countReport = await Report.countDocuments({ read: "Chưa Đọc" });
        const countRoom = await Room.countDocuments({});
        const statisticalTop5 = await Statistical.aggregate([
            {
                $group: {
                    _id: "$userID",
                    totalScore: { $sum: "$score" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $project: {
                    "user.birthDay": 0,
                    "user.active": 0,
                    "user.password": 0,
                    "user.phone": 0,
                    "user.roleID": 0,
                    "user.address": 0,
                    "user.username": 0,
                },
            },
            { $sort: { totalScore: -1 } },
            { $limit: 5 },
        ]);

        const ranks = await Rank.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userID",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $sort: { score: -1, victory: -1 } },
            { $limit: 5 },
        ]);


        res.render("admin", {
            countUsers,
            countGrade,
            countUnits,
            countLessons,
            countExercises,
            countBlogs,
            countReport,
            countRoom,
            statisticalTop5,
            ranks,
            layout: "admin",
        });
    }


    // [GET]/login-admin
    LoginAdmin(req, res) {
        res.render("login-admin", {
            layout: "",
            errors: req.flash("error"),
            success: req.flash("success"),
        });
    }

    // [POST]/login-admin
    async postLoginAdmin(req, res) {
        const { userName, password } = req.body;
        const admin = await Admin.findOne({ userName: userName });
        if (!admin) {
            req.flash("error", "Tài khoản admin này không tồn tại!");
            res.render("login-admin", {
                values: req.body,
                errors: req.flash("error"),
                layout: ""
            });
            return;
        }


        if (!(password === admin.password)) {
            req.flash("error", "Mật khẩu của bạn không khớp!");
            res.render("login-admin", {
                values: req.body,
                errors: req.flash("error"),
                layout: ""

            });
            return;
        }

        res.cookie("adminId", admin._id, {
            signed: true,
        });
        res.redirect("/admin");
    }
    // [GET]/logout-admin
    logoutAdmin(req, res) {
        res.clearCookie("adminId");
        res.clearCookie("sessionId");
        res.redirect("/login-admin");
    }

    // [GET]/login
    login(req, res) {
        res.render("login", {
            errors: req.flash("error"),
            success: req.flash("success"),
            layout: "",
        });
    }

    // [POST]/login
    async postLogin(req, res) {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });
        if (!user) {
            req.flash("error", "Người dùng có email này không tồn tại!");
            res.render("login", {
                values: req.body,
                errors: req.flash("error"),
                layout: "",
            });
            return;
        }

        const matchPassword = await bcrypt.compare(password, user.password);
        if (!matchPassword) {
            req.flash("error", "Mật khẩu của bạn không khớp!");
            res.render("login", {
                values: req.body,
                errors: req.flash("error"),
                layout: "",
            });
            return;
        }

        const isActive = user.active;
        if (!isActive) {
            req.flash("error", "Tài khoản của bạn chưa được kích hoạt!");
            res.render("login", {
                errors: req.flash("error"),
                layout: "",
            });
            return;
        }

        res.cookie("userId", user._id, {
            signed: true,
        });
        res.redirect("/");
    }

    // [GET]/logout
    logout(req, res) {
        res.clearCookie("userId");
        res.clearCookie("sessionId");
        res.redirect("/");
    }

    // [GET]/competition
    async competition(req, res) {
        const rooms = await Room.aggregate([
            {
                $lookup: {
                    from: "grades",
                    localField: "gradeId",
                    foreignField: "_id",
                    as: "grade",
                },
            },

        ]);

        // load ranks in competition
        const ranksCompetition = await Rank.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userID",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $sort: { score: -1, victory: -1 },
            },
        ]);
        const grades = await Grade.find({});

        res.render("competition", {
            rooms,
            ranksCompetition,
            grades: multipleMongooseToObject(grades),
        });
    }
    // [POST]/report
    async report(req, res) {
        const user = await User.findOne({ _id: req.signedCookies.userId });
        const report = new Report({
            userID: user.id,
            content: req.body.content,
            summary: req.body.summary,
        });
        await report.save();
        req.flash("success", "Bạn đã báo cáo thành công. Cảm ơn!");
        res.redirect("back");
    }

    //[GET]subjects
    async subjects(req, res) {
        const subjects = await Subject.find({});
        res.render("subjects", {
            subjects,
        });
    }



}


module.exports = new SiteController();
