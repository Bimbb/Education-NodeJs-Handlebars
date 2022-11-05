const Subject = require("../models/Subject");
const Lesson = require("../models/Lesson");
const ExerciseCategory = require("../models/ExerciseCategory");
const Grade = require("../models/Grade");
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
const { multipleMongooseToObject, mongooseToObject}  = require('../../util/mongoose')


class StatisticalController {
    // [GET]/statisticals
    async show(req, res) {
        if (ObjectId.isValid(req.query.lesson)) {
            const lesson = await Lesson.findById(req.query.lesson);
            if (lesson) {
                const unit = await Unit.findOne({ _id: lesson.unitID });
                const subject = await Subject.findOne({ _id: unit.subjectID });
                const grade = await Grade.findOne({ _id: subject.gradeID });
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
                ]);

                res.render("statisticals/statisticals-lessons", {
                    lesson : mongooseToObject(lesson),
                    statisticals,
                    unit: mongooseToObject(unit),
                    subject : mongooseToObject(subject),
                    grade: mongooseToObject(grade),
                    countExercises: exercises.length,
                    layout: "admin",
                    errors: req.flash("error"),
                    success: req.flash("success"),
                });
            } else {
                res.render("error",{layout:""});
            }
        } else if (ObjectId.isValid(req.query.grade)) {
            const grade = await Grade.findById(req.query.grade);
            if (grade) {
                const subject = await Subject.find({ gradeID : grade._id }) 
                const subjectIdArray = subject.map(({ _id }) => _id);
                const units = await Unit.find({
                    subjectID: { $in: subjectIdArray },
                });
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

                ]);

                res.render("statisticals/statisticals-grade", {
                    grade: mongooseToObject(grade),
                    countLessons: lessons.length,
                    ranks,
                    layout: "admin",
                });
            } else {
                res.render("error",{layout:""});
            }
        } else if (ObjectId.isValid(req.query.subject)) {
            const subject = await Subject.findById(req.query.subject);
            if (subject) {
                const grade = await Grade.findById(subject.gradeID);
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
                ]);

                res.render("statisticals/statisticals-grade", {
                    subject : mongooseToObject(subject),
                    grade: mongooseToObject(grade),
                    ranks,
                    countLessons: lessons.length,
                });
            } else {
                res.render("error",{layout:""});
            }
        }
        else {
            res.render("error",{layout:""});
        }
    }

    // [GET]/statisticals/:id/detail
    async detail(req, res) {
        if (ObjectId.isValid(req.params.id)) {
            const statistical = await Statistical.findById(req.params.id);
            if (statistical) {
                const user = await User.findById(statistical.userID);
                const lesson = await Lesson.findById(statistical.lessonID);
                const unit = await Unit.findById(lesson.unitID);
                const subject = await Subject.findById(unit.subjectID);
                const grade = await Grade.findOne({ _id: subject.gradeID });
                const results = await Result.aggregate([
                    { $match: { statisticalID: ObjectId(statistical._id) } },
                    {
                        $lookup: {
                            from: "exercises",
                            localField: "exerciseID",
                            foreignField: "_id",
                            as: "exercise",
                        },
                    },
                ]);
                res.render("statisticals/detail", {
                    results,
                    user : mongooseToObject(user),
                    lesson : mongooseToObject(lesson),
                    unit : mongooseToObject(unit),
                    subject : mongooseToObject(subject),
                    grade: mongooseToObject(grade),
                    statistical : mongooseToObject(statistical),
                    layout: "admin",
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