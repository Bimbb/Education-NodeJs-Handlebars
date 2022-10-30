const Subject = require("../models/Subject");
const Lesson = require("../models/Lesson");
const ExerciseCategory = require("../models/ExerciseCategory");
const Exercise = require("../models/Exercise");
const Result = require("../models/Result");
const Unit = require("../models/Unit");
const User = require("../models/User");
const Statistical = require("../models/Statistical");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const readXlsxFile = require("read-excel-file/node");
const path = require("path");
const XLSX = require("xlsx");
const moment = require("moment");


class StatisticalController {
    // [GET]/statisticals
    async show(req, res) {
        if (ObjectId.isValid(req.query.lesson)) {
            const lesson = await Lesson.findById(req.query.lesson);
            if (lesson) {
                let perPage = 3;
                let page = req.query.page || 1;

                const unit = await Unit.findOne({ _id: lesson.unitID });
                const subject = await Subject.findOne({ _id: unit.subjectID });
                const exercises = await Exercise.find({
                    lessonID: lesson._id,
                });
                const statisticals = await Statistical.aggregate([
                    { $match: { lessonID: ObjectId(req.query.lesson) } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "userID",
                            foreignField: "_id",
                            as: "user",
                        },
                    },
                    { $sort: { score: -1 } },
                    { $skip: perPage * page - perPage },
                    { $limit: perPage },
                ]);

                res.render("statisticals/list", {
                    lesson,
                    statisticals,
                    unit,
                    subject,
                    countExercises: exercises.length,
                    current: page,
                    pages: Math.ceil(statisticals.length / perPage),
                    errors: req.flash("error"),
                    success: req.flash("success"),
                });
            } else {
                res.render("error");
            }
        } else if (ObjectId.isValid(req.query.subject)) {
            const subject = await Subject.findById(req.query.subject);
            if (subject) {
                let perPage = 3;
                let page = req.query.page || 1;

                const units = await Unit.find({ subjectID: subject._id });
                const unitIdArray = units.map(({ _id }) => _id);
                const lessons = await Lesson.find({
                    unitID: { $in: unitIdArray },
                });
                const lessonIdArray = lessons.map(({ _id }) => _id);

                const ranks = await Statistical.aggregate([
                    {
                        $match: {
                            lessonID: { $in: lessonIdArray },
                        },
                    },
                    {
                        $group: {
                            _id: "$userID",
                            totalScore: { $sum: "$score" },
                            totalLessonDone: { $count: {} },
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
                    { $skip: perPage * page - perPage },
                    { $limit: perPage },
                ]);

                res.render("statisticals/result", {
                    subject,
                    ranks,
                    countLessons: lessons.length,
                    current: page,
                    pages: Math.ceil(ranks.length / perPage),
                });
            } else {
                res.render("error");
            }
        } else {
            res.render("error");
        }
    }
}

module.exports = new StatisticalController();