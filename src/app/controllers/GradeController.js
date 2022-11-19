const Subject = require("../models/Subject");
const Grade = require("../models/Grade");
const Unit = require("../models/Unit");
const Lesson = require("../models/Lesson");
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

class GradeController {



    // [GET] /grade/:slug
    async show(req, res, next) {
        const grade = await Grade.findOne({ slug: req.params.slug });
        const subject = await Subject.find({ gradeID: grade._id });
        res.render("grades/show", {
            success: req.flash("success"),
            errors: req.flash("error"),
            subject: multipleMongooseToObject(subject),
            grade: mongooseToObject(grade)
        });
    }

    // [GET]/Grade/list
    async listGrade(req, res, next) {

        Grade.find({})
            .then((grade) => {
                res.render('grades/list', {
                    grades: multipleMongooseToObject(grade),
                    layout: 'admin',
                    success: req.flash("success"),
                    errors: req.flash("error"),
                });
            })
            .catch(next);
    }

    // [POST]/Grade/create
    async createGrade(req, res) {
        const formGrade = req.body;
        const checkLop = await Grade.findOne({ name: formGrade.name });
        if (checkLop) {
            req.flash("error", "Tên Lớp này đã tồn tại!");
            res.redirect('/grade/list');
            return;
        }
        const grade = new Grade(formGrade);
        await grade.save();
        req.flash("success", "Tạo Thành Công Một Lớp mới!");
        res.redirect('/grade/list');
    }


    // [PUT] /grade/:id
    async update(req, res, next) {
        const formGrade = req.body;
        Grade.updateOne({ _id: formGrade.gradeID }, formGrade)
            .then(() => {
                req.flash("success", "Đã cập nhật thành công lớp học!"),
                    res.redirect('/grade/list')
            })
            .catch(next);
    }


    // [DELETE] /grade/:id
    delete(req, res, next) {
        Grade.deleteOne({ _id: req.params.id })
            .then(() => {
                req.flash("success", "Đã Xóa Thành công lớp học!"),
                    res.redirect('back')
            })
            .catch(next);
    }
}
module.exports = new GradeController();