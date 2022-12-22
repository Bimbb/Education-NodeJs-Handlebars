const Subject = require("../models/Subject");
const Unit = require("../models/Unit");
const Lesson = require("../models/Lesson");
const Theory = require("../models/Theory");
const Result = require("../models/Result");
const Grade = require("../models/Grade");
const User = require("../models/User");
const Exercise = require("../models/Exercise");
const Statistical = require("../models/Statistical");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const readXlsxFile = require("read-excel-file/node");
const path = require("path");
const { multipleMongooseToObject, mongooseToObject } = require('../../util/mongoose')

class UnitController {


    // [GET]/unit/:id
    async show(req, res, next) {

        const unit = await Unit.findOne({ id: req.params._id });
        const lesson = await Lesson.find({ unitID: unit._id });


        res.render("units/show", {
            success: req.flash("success"),
            errors: req.flash("error"),
            unit: mongooseToObject(unit),
            lesson: multipleMongooseToObject(lesson),
        });
    }


    // [POST]/units/create
    async postCreate(req, res) {
        const { name, subjectID } = req.body;
        const findUnit = await Unit.findOne({
            name: name,
            subjectID: subjectID,
        });
        if (findUnit) {
            req.flash(
                "error",
                "Chuyên đề này đã tồn tại... Vui lòng nhập chuyên đề khác!"
            );
            res.redirect("back");
            return;
        }
        const unit = new Unit(req.body);
        await unit.save();
        req.flash("success", "Thêm mới thành công chuyên đề!");
        res.redirect("back");
    }
    // [POST]/units/upload
    async upload(req, res) {
        try {
            if (req.file == undefined) {
                req.flash("error", "Vui lòng tải lên một tệp excel!");
                res.redirect("back");
                return;
            }
            let fileExcel = path.resolve(
                __dirname,
                "../../public/uploads/" + req.file.filename
            );

            readXlsxFile(fileExcel).then(async (rows) => {
                rows.shift();
                let units = [];

                rows.forEach((row) => {
                    let unit = new Unit({
                        name: `CHƯƠNG ${row[0]}. ${row[1]
                            .toString()
                            .toUpperCase()}`,
                        subjectID: req.body.subjectID,
                    });
                    units.push(unit);
                });

                Unit.create(units)
                    .then(() => {
                        req.flash("success", "Đã tải tệp lên thành công!");
                        res.redirect("back");
                    })
                    .catch((error) => {
                        req.flash(
                            "error",
                            "Không thể nhập dữ liệu vào cơ sở dữ liệu!"
                        );
                        res.redirect("back");
                    });
            });
        } catch (error) {
            console.log(error);
        }
    }

    // [POST]/units/:id
    async apiListUnit(req, res, next) {
        const idGrade = req.body.idGrade;
        const grade = await Grade.findById(ObjectId(idGrade));

        if(grade){
            var SubjectTheory = await Subject.findOne({ gradeID: grade._id, name: "Phần Lý Thuyết" });
            if(SubjectTheory){
                const units = await Unit.aggregate([
                    { $match: { subjectID: ObjectId(SubjectTheory._id) } },
                    {      
                        $lookup: {
                            from: "lessons",
                            localField: "_id",
                            foreignField: "unitID",
                            as: "lesson",
                        },
                    },
                ]);
                if(units){
                    res.status(200).send(JSON.stringify(units))
                }
            }
        }
        
    }
    // [PUT]/units/:id
    async update(req, res, next) {
        const { name, subjectID } = req.body;
        const findUnit = await Unit.findOne({
            name: name,
            subjectID: subjectID,
        });
        if (findUnit) {
            req.flash(
                "error",
                "Chuyên đề này đã tồn tại... Vui lòng nhập chuyên đề khác!"
            );
            res.redirect("back");
            return;
        }
        await Unit.updateOne({ _id: req.params.id }, req.body);
        req.flash("success", "Cập nhật thành công chuyên đề!");
        res.redirect("back");
    }

    // [DELETE]/units/:id
    async delete(req, res, next) {
        const lessons = await Lesson.find({ unitID: req.params.id });
        if (lessons.length > 0) {
            const lessonsIdArr = lessons.map(({ _id }) => _id);
            await Theory.deleteMany({
                lessonID: { $in: lessonsIdArr },
            });
            await Exercise.deleteMany({
                lessonID: { $in: lessonsIdArr },
            });
            await Lesson.deleteMany({ unitID: req.params.id });

            const statisticals = await Statistical.find({
                lessonID: { $in: lessonsIdArr },
            });

            if (statisticals.length > 0) {
                const statisticalsIdArr = statisticals.map(({ _id }) => _id);
                await Result.deleteMany({
                    statisticalID: { $in: statisticalsIdArr },
                });
                await Statistical.deleteMany({
                    lessonID: { $in: lessonsIdArr },
                });
            }
        }

        await Unit.deleteOne({ _id: req.params.id });
        req.flash("success", "Xóa thành công chuyên đề!");
        res.redirect("back");
    }

    /// [GET] units/:id/detail
    async detail(req, res, next) {
        const unit = await Unit.findOne({ _id: req.params.id });
        const subject = await Subject.findOne({ unitID: unit._id });
        const grade = await Grade.findOne({ subjectID: subject._id });
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
            { $sort: { lessonNumber: 1 } },
        ]);

        res.render("units/detail", {
            unit: mongooseToObject(unit),
            grade: mongooseToObject(grade),
            subject: mongooseToObject(subject),
            lessons,
            layout: "admin",
            success: req.flash("success"),
            errors: req.flash("error"),
        });


    }


}




module.exports = new UnitController();
