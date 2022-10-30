const {multipleMongooseToObject: multipleMongooseToObject}  = require('../../util/mongoose')
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
const ObjectId = mongoose.Types.ObjectId;

class SiteController {
    // [GET] /
    index(req, res, next) {
        res.send('DO AN CHUYEN NGANH')
    }

    // [GET] /search
    search(req, res) {
        res.render('search');
    }

    // [GET]/admin
    async admin(req, res) {
        const countUsers = await User.countDocuments({});
        const countSubjects = await Subject.countDocuments({});
        const countUnits = await Unit.countDocuments({});
        const countLessons = await Lesson.countDocuments({});
        const countExercises = await Exercise.countDocuments({});
        const countBlogs = await Blog.countDocuments({});

        const top3 = await Statistical.aggregate([
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
            { $limit: 3 },
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
            { $limit: 3 },
        ]);

        res.render("admin", {
            countUsers,
            countSubjects,
            countUnits,
            countLessons,
            countExercises,
            countBlogs,
            top3,
            ranks,
            layout: "admin",
        });
    }
}

module.exports = new SiteController();
