const { multipleMongooseToObject: multipleMongooseToObject } = require('../../util/mongoose')
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
        const customSubject = await Grade.aggregate([
            {
                $lookup: {
                    from: "subjects",
                    localField: "_id",
                    foreignField: "gradeID",
                    as: "subject",
                },
            },
        ]);


        res.render("index", {
            success: req.flash("success"),
            errors: req.flash("error"),
            customSubject,
        });
    }

    // [GET] /search
    search(req, res) {
        res.render('search');
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

    // [GET]/login-admin
    LoginUser(req, res) {
        res.render("login-user", {
            layout: "",
            errors: req.flash("error"),
            success: req.flash("success"),
        });
    }

    // [POST]/login
    async postLoginUser(req, res) {
        const { userName, password } = req.body;
        const user = await User.findOne({ userName: userName });

        if (!(password === admin.password)) {
            req.flash("error", "Mật khẩu của bạn không khớp!");
            res.render("login-user", {
                values: req.body,
                errors: req.flash("error"),
                layout: ""

            });
            return;
        }
        res.redirect("/");
    }

    // [GET]/logout
    logoutAdmin(req, res) {
        res.clearCookie("adminId");
        res.clearCookie("sessionId");
        res.redirect("/login-admin");
    }
    // [GET]/competition
    async competition(req, res) {
        const rooms = await Room.aggregate([
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjectID",
                    foreignField: "_id",
                    as: "subject",
                },
            },
            {
                $lookup: {
                    from: "units",
                    localField: "unitID",
                    foreignField: "_id",
                    as: "unit",
                },
            },
            {
                $lookup: {
                    from: "lessons",
                    localField: "lessonID",
                    foreignField: "_id",
                    as: "lesson",
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

}

module.exports = new SiteController();
