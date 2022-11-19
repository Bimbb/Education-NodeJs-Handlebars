const Subject = require("../models/Subject");
const Unit = require("../models/Unit");
const Lesson = require("../models/Lesson");
const Theory = require("../models/Theory");
const Exercise = require("../models/Exercise");
const User = require("../models/User");
const Grade = require("../models/Grade");
const Result = require("../models/Result");
const Statistical = require("../models/Statistical");
const mongoose = require("mongoose");
const { multipleMongooseToObject, mongooseToObject } = require('../../util/mongoose')
const ObjectId = mongoose.Types.ObjectId;
class LearningController {
    // [GET]/learning?name=lesson
    async learning(req, res) {
        // try {
            const lesson = await Lesson.findOne({ slug: req.query.name });
            if (lesson) {
                const theory = await Theory.findOne({
                    lessonID: lesson.id,
                });


                const unit = await Unit.findOne({_id:  lesson.unitID})
                const subject = await Subject.findOne({_id: unit.subjectID})
                const grade  = await Grade.findOne({_id : subject.gradeID})

                // mục lục môn học
                const units = await Unit.aggregate([
                    { $match: { subjectID: ObjectId(subject._id) } },
                    {      
                        $lookup: {
                            from: "lessons",
                            localField: "_id",
                            foreignField: "unitID",
                            as: "lesson",
                        },
                    },
                ]);
                const unitIdArray = units.map(({ _id }) => _id);
                const lessons = await Lesson.find({
                    unitID: { $in: unitIdArray },
                });

                const exercises = await Exercise.find({
                    lessonID: lesson._id,
                });

                const statistical = await Statistical.findOne({
                    userID: ObjectId(req.signedCookies.userId),
                    lessonID: lesson._id,
                });

                let results = [];
                if (statistical) {
                    results = await Result.find({
                        statisticalID: statistical._id,
                    });
                }

                res.render("learning/learning", {
                    lesson: mongooseToObject(lesson),
                    theory: mongooseToObject(theory),
                    subject: mongooseToObject(subject),
                    units,
                    grade: mongooseToObject(grade),
                    lessons: multipleMongooseToObject(lessons),
                    statistical: mongooseToObject(statistical),
                    exercises : multipleMongooseToObject(exercises),
                    results,
                    success: req.flash("success"),
                    errors: req.flash("error"),
                });
            } else {
                res.render("error",{layout:""});
            }
        // } catch (error) {
        //     res.render("error",{layout:""});
        // }
    }   

    // [GET]/learning/result
    async learningResult(req, res) {
        try {
            const lesson = await Lesson.findOne({ slug: req.query.lesson });
            const subject = await Subject.findOne({ slug: req.query.subject });

            let unit;
            if (ObjectId.isValid(req.query.unit)) {
                unit = await Unit.findById(req.query.unit);
            }

            if (lesson) {
                const exercises = await Exercise.find({
                    lessonID: lesson._id,
                });

                const unit = await Unit.findById(lesson.unitID);
                const subject = await Subject.findById(unit.subjectID);

                const nextLesson = await Lesson.findOne({
                    _id: { $gt: lesson._id },
                })
                    .sort({ _id: 1 })
                    .limit(1);

                const statistical = await Statistical.aggregate([
                    {
                        $match: {
                            $and: [
                                { userID: ObjectId(req.signedCookies.userId) },
                                { lessonID: ObjectId(lesson._id) },
                            ],
                        },
                    },
                    {
                        $lookup: {
                            from: "results",
                            localField: "_id",
                            foreignField: "statisticalID",
                            as: "res",
                        },
                    },
                    {
                        $unwind: "$res",
                    },
                    {
                        $lookup: {
                            from: "exercises",
                            localField: "res.exerciseID",
                            foreignField: "_id",
                            as: "res.exercise",
                        },
                    },
                    {
                        $unwind: "$res.exercise",
                    },
                    {
                        $lookup: {
                            from: "exercise-categories",
                            localField: "res.exercise.ceID",
                            foreignField: "_id",
                            as: "res.exercise.category",
                        },
                    },
                    {
                        $group: {
                            _id: "$_id",
                            res: {
                                $push: "$res",
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "statisticals",
                            localField: "_id",
                            foreignField: "_id",
                            as: "stat",
                        },
                    },
                    {
                        $unwind: "$stat",
                    },
                    {
                        $addFields: {
                            "stat.res": "$res",
                        },
                    },
                    {
                        $replaceRoot: {
                            newRoot: "$stat",
                        },
                    },
                ]);

                res.render("learning/result-detail", {
                    subject : mongooseToObject(subject),
                    statistical,
                    nextLesson: mongooseToObject(nextLesson),
                    exercises : multipleMongooseToObject(exercises),
                });
            } else if (subject && !unit) {
                const subjects = await Subject.find({});
                const units = await Unit.find({ subjectID: subject._id });
                const unitIdArray = units.map(({ _id }) => _id);
                const lessons = await Lesson.find({
                    unitID: { $in: unitIdArray },
                });
                const lessonIdArray = lessons.map(({ _id }) => _id);
                const statisticals = await Statistical.aggregate([
                    {
                        $match: {
                            $and: [
                                { userID: ObjectId(req.signedCookies.userId) },
                                { lessonID: { $in: lessonIdArray } },
                            ],
                        },
                    },
                    {
                        $group: {
                            _id: "$userID",
                            totalScore: { $sum: "$score" },
                            totalLessonDone: { $count: {} },
                        },
                    },
                ]);

                const results = await Statistical.aggregate([
                    {
                        $match: {
                            $and: [
                                { userID: ObjectId(req.signedCookies.userId) },
                                { lessonID: { $in: lessonIdArray } },
                            ],
                        },
                    },
                ]);

                let unitsResult = [];
                if (results.length > 0) {
                    const resultsLessonIdArr = results.map(
                        ({ lessonID }) => lessonID
                    );
                    const lessonsResult = await Lesson.find({
                        _id: { $in: resultsLessonIdArr },
                    });
                    const lessonsResultUnitId = lessonsResult.map(
                        ({ unitID }) => unitID
                    );
                    unitsResult = await Unit.find({
                        _id: { $in: lessonsResultUnitId },
                    });
                }

                res.render("learning/result", {
                    subject,
                    subjects,
                    statisticals,
                    countLessons: lessons.length,
                    unitsResult,
                });
            } else if (subject && unit) {
                const lessons = await Lesson.find({
                    unitID: unit._id,
                });
                const lessonIdArray = lessons.map(({ _id }) => _id);
                const statisticals = await Statistical.aggregate([
                    {
                        $match: {
                            $and: [
                                { userID: ObjectId(req.signedCookies.userId) },
                                { lessonID: { $in: lessonIdArray } },
                            ],
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
                    {
                        $unwind: "$lesson",
                    },
                    {
                        $lookup: {
                            from: "exercises",
                            localField: "lesson._id",
                            foreignField: "lessonID",
                            as: "lesson.exercises",
                        },
                    },
                ]);

                res.render("learning/result-unit", {
                    subject,
                    statisticals,
                    unit,
                });
            } else {
                res.render("error");
            }
        } catch (error) {
            console.log(error);
        }
    }
    
}

module.exports = new LearningController();
