const Subject = require("../models/Subject");
const Unit = require("../models/Unit");
const Lesson = require("../models/Lesson");
const Grade = require("../models/Grade");
const Theory = require("../models/Theory");
const Exercise = require("../models/Exercise");
const User = require("../models/User");
const Result = require("../models/Result");
const Statistical = require("../models/Statistical");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const fs = require("fs");
const pdf = require("pdf-creator-node");
const path = require("path");
const { multipleMongooseToObject, mongooseToObject } = require('../../util/mongoose')
const options = require("../../util/options");

class TheoryController {


    //GET theory/:slug
    async show(req, res, next) {
        //lấy ra bài học
        const theory = await Theory.findOne({ slug: req.params.slug });

        // lấy cái tên
        const lesson = await Lesson.findOne({ _id: theory.lessonID });

        res.render("theories/show", {
            success: req.flash("success"),
            errors: req.flash("error"),
            theory: mongooseToObject(theory),
            lesson: mongooseToObject(lesson),

        });
    }
    //GET theories/api
    async api(req, res, next) {
        const lessonID = req.body.lessonID;
        const lesson = await Lesson.findById(ObjectId(lessonID));
        if(lesson){
            const theory = await Theory.findOne({ lessonID: ObjectId(lesson._id) });
            if(theory){
                res.status(200).send(JSON.stringify(theory))
            }
        }
    }


    // [GET]/theories?lesson
    async detail(req, res) {
        try {
            if (ObjectId.isValid(req.query.lesson)) {
                const lesson = await Lesson.findById(req.query.lesson);
                const unit = await Unit.findOne({ _id: lesson.unitID });
                const subject = await Subject.findOne({ _id: unit.subjectID });
                const grade = await Grade.findOne({ _id: subject.gradeID });
                if (lesson) {
                    const theory = await Theory.aggregate([
                        { $match: { lessonID: lesson._id } },
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
                                from: "units",
                                localField: "lesson.unitID",
                                foreignField: "_id",
                                as: "lesson.unit",
                            },
                        },
                        {
                            $unwind: "$lesson.unit",
                        },
                        {
                            $lookup: {
                                from: "subjects",
                                localField: "lesson.unit.subjectID",
                                foreignField: "_id",
                                as: "lesson.unit.subject",
                            },
                        },
                    ]);
                    res.render("theories/detail", {
                        lesson: mongooseToObject(lesson),
                        subject: mongooseToObject(subject),
                        layout: "admin",
                        theory,
                        unit: mongooseToObject(unit),
                        grade: mongooseToObject(grade),
                        success: req.flash("success"),
                        errors: req.flash("error"),
                    });
                } else {
                    res.render("error", { layout: "" });
                }
            } else {
                res.render("error", { layout: "" });
            }
        } catch (error) {
            console.log(error);
        }
    }

    // [GET]/theories/create
    async create(req, res) {
        if (ObjectId.isValid(req.query.lesson)) {
            const lesson = await Lesson.findOne({ _id: req.query.lesson });
            const unit = await Unit.findOne({ _id: lesson.unitID });
            const subject = await Subject.findOne({ _id: unit.subjectID });
            const theory = await Theory.findOne({ lessonID: lesson._id });
            const grade = await Grade.findOne({ _id: subject.gradeID });
            if (theory) {
                res.redirect(`/theories/detail?lesson=${lesson._id}`);
                return;
            }
            res.render("theories/create", {
                lesson: mongooseToObject(lesson),
                subject: mongooseToObject(subject),
                layout: "admin",
                unit: mongooseToObject(unit),
                grade: mongooseToObject(grade),
                errors: req.flash("error"),
            });
        } else {
            res.render("error", { layout: "" });
        }
    }

    // [POST]/theories/create
    async postCreate(req, res) {
        if (req.body.content === "") {
            req.flash(
                "error",
                "Vui lòng nhập nội dung lý thuyết cho môn học này!"
            );
            res.redirect("back");
            return;
        }
        const theory = new Theory(req.body);
        await theory.save();
        req.flash("success", "Thêm mới thành công!");
        res.redirect("back");
    }
    // [DELETE]/theories/:id
    async delete(req, res) {
        const theory = await Theory.findById(req.params.id);
        const lesson = await Lesson.findById(theory.lessonID);
        const unit = await Unit.findById(lesson.unitID);
        const subject = await Subject.findById(unit.subjectID);
        await theory.delete();
        req.flash("success", "Xóa thành công!");

        res.redirect(`/units/${unit._id}/detail`);
    }
    // [PUT]/theories/:id
    async update(req, res) {
        if (req.body.content === "") {
            req.flash(
                "error",
                "Vui lòng nhập nội dung lý thuyết cho môn học này!"
            );
            res.redirect("back");
            return;
        }
        await Theory.updateOne({ _id: req.params.id }, req.body);
        req.flash("success", "Cập nhật thành công!");
        res.redirect("back");
    }
    // [POST]/theories/:id/export
    async generatePdf(req, res) {
        const html = fs.readFileSync(
            path.join(__dirname, "../../resources/views/templates/theory.html"),
            "utf-8"
        );
        const lesson = await Lesson.findById(req.params.id);
        if (lesson) {
            const unit = await Unit.findById(lesson.unitID);
            const subject = await Subject.findById(unit.subjectID);
            const grade = await Grade.findById(subject.gradeID);
            const filename = lesson.slug + "_doc" + ".pdf";
            const theory = await Theory.aggregate([
                { $match: { lessonID: ObjectId(lesson._id) } },
                {
                    $lookup: {
                        from: "lessons",
                        localField: "lessonID",
                        foreignField: "_id",
                        as: "lesson",
                    },
                },
            ]);

            let down = path.resolve(
                __dirname,
                `../../public/exports/${filename}`
            );
            const obj = {
                theory: theory,
                lessonName: lesson.name,
                lessonNumber: lesson.lessonNumber,
                unitName: unit.name,
                subjectName: subject.name,
                subjectGrade: grade.name,
            };
            const document = {
                html: html,
                data: {
                    theorys: obj,
                },
                path: down,
            };

            pdf.create(document, options)
            .then(() => {
                res.download(document.path);
            })
            .catch((error) => {
                console.log(error);
            });
        }
    }


};



module.exports = new TheoryController();
