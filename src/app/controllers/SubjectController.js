const Subject = require("../models/Subject");
const Unit = require("../models/Unit");
const Lesson = require("../models/Lesson");
const Grade = require("../models/Grade");
const Exercise = require("../models/Exercise");
const Theory = require("../models/Theory");
const Statistical = require("../models/Statistical");
const Result = require("../models/Result");
const { multipleMongooseToObject, mongooseToObject } = require('../../util/mongoose')
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const slugify = require("slugify");
const readXlsxFile = require("read-excel-file/node");
const path = require("path");

class SubjectController {

    // [GET]/subjects/:slug

    async show(req, res) {

    }






    // [GET]/subjects/list

    async listSubject(req, res, next) {
        Subject.find({})
            .then((subject) => {
                res.render('subjects/list', {
                    subject: multipleMongooseToObject(subject),
                    layout: 'admin',
                    success: req.flash("success"),
                    errors: req.flash("error"),
                });
            })
            .catch(next);
    }

    // [POST]/subject/:gradeID/theory
    async createSubjectTheory(req, res) {
        var formSubject = req.body;
        const grade = await Grade.findOne({ _id: req.params.gradeId });
        var SubjectTheory = await Subject.findOne({ gradeID: req.params.gradeId, name: "Phần Lý Thuyết" });
        if (!SubjectTheory) {
            formSubject.gradeID = req.params.gradeId;
            formSubject.name = "Phần Lý Thuyết";
            const subject = new Subject(formSubject);
            await subject.save();
            req.flash("success", "Tạo thành công Học Phần lý thuyết");
            res.redirect('/grade/list');
            return;
        } else {
            const units = await Unit.find({ subjectID: SubjectTheory._id });
            const unitIdArray = units.map(({ _id }) => _id);
            const lessons = await Lesson.aggregate([
                { $match: { unitID: { $in: unitIdArray } } },
                {
                    $lookup: {
                        from: "theories",
                        localField: "_id",
                        foreignField: "lessonID",
                        as: "theory",
                    },
                },
                {
                    $lookup: {
                        from: "exercises",
                        localField: "_id",
                        foreignField: "lessonID",
                        as: "exercises",
                    },
                },
                {
                    $lookup: {
                        from: "statisticals",
                        localField: "_id",
                        foreignField: "lessonID",
                        as: "statisticals",
                    },
                },
            ]);
            res.render("subjects/theory", {
                SubjectTheory: mongooseToObject(SubjectTheory),
                grade: mongooseToObject(grade),
                units: multipleMongooseToObject(units),
                layout: 'admin',
                lessons,
                success: req.flash("success"),
                errors: req.flash("error"),
            });
        }
    }


    // [POST]/subject/:gradeID/bible
    async createSubjectBible(req, res, next) {
        var formSubject = req.body;
        const grade = await Grade.findOne({ _id: req.params.gradeId });
        var SubjectTheory = await Subject.findOne({ gradeID: req.params.gradeId, name: "Phần Kinh" });
        if (!SubjectTheory) {
            formSubject.gradeID = req.params.gradeId;
            formSubject.name = "Phần Kinh";
            const subject = new Subject(formSubject);
            await subject.save();
            req.flash("success", "Tạo thành công Học Phần Kinh");
            res.redirect('/grade/list');
            return;
        } else {
            const unit = await Unit.findOne({ subjectID: SubjectTheory._id });
            if (!unit) {
                var formUnit = req.body;
                formUnit.subjectID = SubjectTheory._id;
                formUnit.name = "Phần Kinh";
                const unitNew = new Unit(formUnit);
                await unitNew.save();
                res.redirect('/grade/list');
                return;
            } else {
                const lessons = await Lesson.aggregate([
                    { $match: { unitID: unit._id } },
                    {
                        $lookup: {
                            from: "theories",
                            localField: "_id",
                            foreignField: "lessonID",
                            as: "theory",
                        },
                    },
                    {
                        $lookup: {
                            from: "exercises",
                            localField: "_id",
                            foreignField: "lessonID",
                            as: "exercises",
                        },
                    },
                    {
                        $lookup: {
                            from: "statisticals",
                            localField: "_id",
                            foreignField: "lessonID",
                            as: "statisticals",
                        },
                    },
                ]);
                res.render("subjects/bible", {
                    SubjectTheory: mongooseToObject(SubjectTheory),
                    grade: mongooseToObject(grade),
                    unit: mongooseToObject(unit),
                    layout: 'admin',
                    lessons,
                    success: req.flash("success"),
                    errors: req.flash("error"),
                });
            }

        }
    }

}
module.exports = new SubjectController();