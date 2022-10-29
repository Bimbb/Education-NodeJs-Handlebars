const Subject = require("../models/Subject");
const Lesson = require("../models/Lesson");
const ExerciseCategory = require("../models/ExerciseCategory");
const Exercise = require("../models/Exercise");
const Result = require("../models/Result");
const Grade = require("../models/Grade");
const Unit = require("../models/Unit");
const User = require("../models/User");
const Statistical = require("../models/Statistical");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const readXlsxFile = require("read-excel-file/node");
const path = require("path");
const XLSX = require("xlsx");
const { htmlToText } = require("html-to-text");
const { multipleMongooseToObject, mongooseToObject}  = require('../../util/mongoose')




class ExerciseController {

    // [GET]/exercise?lesson
    async detail(req, res) {
        if (ObjectId.isValid(req.query.lesson)) {
            const lesson = await Lesson.findById(req.query.lesson);
            const unit = await Unit.findOne({ _id: lesson.unitID });
            const subject = await Subject.findOne({ _id: unit.subjectID });
            
            const grade = await Grade.findOne({_id : subject.gradeID})
            if (lesson) {
                const exercises = await Exercise.aggregate([
                    { $match: { lessonID: ObjectId(req.query.lesson) } },
                    {
                        $lookup: {
                            from: "exercise-categories",
                            localField: "ceID",
                            foreignField: "_id",
                            as: "category",
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
                if (exercises.length > 0) {
                    const categories = await ExerciseCategory.find({});
                    res.render("exercises/detail", {
                        exercises,
                        lesson: mongooseToObject(lesson),
                        unit : mongooseToObject(unit),
                        subject : mongooseToObject(subject),
                        categories : multipleMongooseToObject(categories),
                        grade: mongooseToObject(grade),
                        layout: "admin",
                        success: req.flash("success"),
                        errors: req.flash("error"),
                    });
                } else {
                    res.redirect(
                        `/exercises/create?lesson=${req.query.lesson}`
                    );
                }
            } else {
                res.render("error");
            }
        } else {
            res.render("error");
        }
    }


    // [GET]/exercises/create
    async create(req, res) {
        if (ObjectId.isValid(req.query.lesson)) {
            const lesson = await Lesson.findOne({ _id: req.query.lesson });
            const unit = await Unit.findOne({ _id: lesson.unitID });
            const subject = await Subject.findOne({ _id: unit.subjectID });
            const categories = await ExerciseCategory.find({});
            const grade = await Grade.findOne({_id : subject.gradeID})
            res.render("exercises/create", {
                lesson: mongooseToObject(lesson),
                unit : mongooseToObject(unit),
                subject : mongooseToObject(subject),
                categories : multipleMongooseToObject(categories),
                grade: mongooseToObject(grade),
                layout: "admin",
                success: req.flash("success"),
                errors: req.flash("error"),
            });
        } else {
            res.render("error");
        }
    }


    // [POST]/exercises/create
    async postCreate(req, res) {
        let {
            lessonID,
            answer,
            option1,
            option2,
            option3,
            option4,
            question,
            recommend,
            explain,
            ceID,
            audioUrl,
        } = req.body;

        if (answer === "A") {
            answer = option1;
        } else if (answer === "B") {
            answer = option2;
        } else if (answer === "C") {
            answer = option3;
        } else if (answer === "D") {
            answer = option4;
        }

        const exercise = new Exercise({
            lessonID,
            question,
            option1,
            option2,
            option3,
            option4,
            answer,
            recommend,
            explain,
            ceID,
            audioUrl,
        });
        await exercise.save();
        req.flash("success", "Thêm mới thành công!");
        res.redirect(`/exercises/detail?lesson=${lessonID}`);
    }
    // [DELETE]/exercises
    async delete(req, res) {
        await Exercise.deleteOne({ _id: req.params.id });
        req.flash("success", "Xóa thành công!");
        res.redirect("back");
    }
    // [PUT]/exercises/:id
    async update(req, res) {
        let {
            answer,
            option1,
            option2,
            option3,
            option4,
            question,
            recommend,
            explain,
            ceID,
            audioUrl,
        } = req.body;

        if (answer === "A") {
            answer = option1;
        } else if (answer === "B") {
            answer = option2;
        } else if (answer === "C") {
            answer = option3;
        } else if (answer === "D") {
            answer = option4;
        }

        await Exercise.updateOne(
            { _id: req.params.id },
            {
                question,
                option1,
                option2,
                option3,
                option4,
                answer,
                recommend,
                explain,
                ceID,
                audioUrl,
            }
        );
        req.flash("success", "Cập nhật thành công!");
        res.redirect("back");
    }
    // [POST]/exercises/:id/export
    async export(req, res) {
        const lesson = await Lesson.findById(req.params.id);
        if (lesson) {
            const exercises = await Exercise.aggregate([
                { $match: { lessonID: ObjectId(lesson._id) } },
                {
                    $lookup: {
                        from: "exercise-categories",
                        localField: "ceID",
                        foreignField: "_id",
                        as: "category",
                    },
                },
            ]);
            let exercisesExcel = [];
            exercises.forEach((item, index) => {
                let exercise = {
                    STT: index + 1,
                    "Câu hỏi": htmlToText(item.question, { wordwrap: 130 }),
                    "Option 1": htmlToText(item.option1, { wordwrap: 130 }),
                    "Option 2": htmlToText(item.option2, { wordwrap: 130 }),
                    "Option 3": htmlToText(item.option3, { wordwrap: 130 }),
                    "Option 4": htmlToText(item.option4, { wordwrap: 130 }),
                    "Đáp án": htmlToText(item.answer, { wordwrap: 130 }),
                    "Gợi ý": htmlToText(item.recommend, { wordwrap: 130 }),
                    "Lời giải": htmlToText(item.explain, { wordwrap: 130 }),
                    "Loại câu hỏi": item.category[0].type,
                };
                exercisesExcel.push(exercise);
            });

            var wb = XLSX.utils.book_new();
            var temp = JSON.stringify(exercisesExcel);
            temp = JSON.parse(temp);
            var ws = XLSX.utils.json_to_sheet(temp);
            let down = path.resolve(
                __dirname,
                `../../public/exports/thong-ke-danh-sach-cau-hoi-bai-${lesson.slug}.xlsx`
            );
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            XLSX.writeFile(wb, down);
            res.download(down);
        } else {
            req.flash("error", "Tải tệp không thành công. Vui lòng thử lại!");
            res.redirect("back");
        }
    }

    // [POST]/exercises/upload
    async createToFile(req, res) {
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
                let exercises = [];
                let categories = await ExerciseCategory.find({});

                rows.forEach((row) => {
                    categories.forEach((category) => {
                        if (row[9].toString().toLowerCase() === category.type) {
                            row[9] = category._id;
                        }
                    });

                    if (row[6] === "A" || row[6] === "a") {
                        row[6] = row[2];
                    } else if (row[6] === "B" || row[6] === "b") {
                        row[6] = row[3];
                    } else if (row[6] === "C" || row[6] === "c") {
                        row[6] = row[4];
                    } else if (row[6] === "D" || row[6] === "d") {
                        row[6] = row[5];
                    }

                    let exercise = new Exercise({
                        question: row[1],
                        option1: row[2],
                        option2: row[3],
                        option3: row[4],
                        option4: row[5],
                        answer: row[6],
                        recommend: row[7],
                        explain: row[8],
                        ceID: row[9],
                        lessonID: req.body.lessonID,
                    });

                    exercises.push(exercise);
                });

                Exercise.create(exercises)
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
}

module.exports = new ExerciseController();

