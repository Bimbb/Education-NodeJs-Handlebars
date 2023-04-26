const Subject = require("../models/Subject");
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
const { multipleMongooseToObject, mongooseToObject}  = require('../../util/mongoose');
const Lesson = require("../models/Lesson");

class ExerciseController {

    // [GET]/exercises/:slug?name=lesson
    async exercise(req, res) {
        try {
            const subject = await Subject.findOne({ slug: req.params.slug });
            if (subject) {
                const lesson = await Lesson.findOne({ slug: req.query.name });
                const exercises = await Exercise.aggregate([
                    {
                        $match: {
                            lessonID: ObjectId(lesson.id),
                        },
                    },
                    {
                        $lookup: {
                            from: "exercise-categories",
                            localField: "ceID",
                            foreignField: "_id",
                            as: "Cate",
                        },
                    },
                    {
                        $project: { answer: 0, explain: 0 },
                    },
                    { $sample: { size: 20 } },
                ]);

                // làm lại tất cả
                const statistical = await Statistical.findOne({
                    userID: ObjectId(req.signedCookies.userId),
                    lessonID: lesson._id,
                });

                if (statistical) {
                    const results = await Result.find({
                        statisticalID: statistical._id,
                    });
                    const resultsUserIdArray = results.map(({ _id }) => _id);
                    if (results.length > 0) {
                        await Result.deleteMany({
                            _id: { $in: resultsUserIdArray },
                        });
                        await Statistical.deleteOne({ _id: statistical._id });
                    }
                }

                // bảng xếp hạng theo bài học
                const ranks = await Statistical.aggregate([
                    {
                        $match: {
                            lessonID: ObjectId(lesson._id),
                        },
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "userID",
                            foreignField: "_id",
                            as: "user",
                        },
                    },
                    { $sort: { score: -1, time: 1 } },
                    {
                        $limit: 10,
                    },
                ]);

                res.render("exercises/exercise", {
                    lesson: mongooseToObject(lesson),
                    subject: mongooseToObject(subject),
                    exercises,
                    ranks,
                });
            } else {
                res.render("error");
            }
        } catch (error) {
            res.render("error");
        }
    }


    // [POST]/exercises/api?lessonId=lesson
    async apiListExercises(req, res, next) {
        const LessonId = req.body.LessonId;
        const lesson = await Lesson.findById(ObjectId(LessonId));
        if(lesson){

           const exercises = await Exercise.aggregate([
                { $match: { lessonID: ObjectId(lesson._id) } },
                { $set: {
                    contentRegex: {
                        $regexFind: { input: "$Description", regex: /([^<>]+)(?!([^<]+)?>)/gi }
                        }
                    }
                },
                {
                    $set: {
                        content: { $ifNull: ["$contentRegex.match", "$Description"] }
                    }
                },
                {
                    $unset: [ "contentRegex" ]
                }
            ]);
            
            if(exercises){
                console.log(exercises);
                res.status(200).send(JSON.stringify(exercises))
            }
        }
    }


    // [POST]/exercise/:slug?name=lesson
    async postExercise(req, res) {
        try {
            const lesson = await Lesson.findOne({ slug: req.query.name });
            if (lesson) {
                const myJsonData = req.body.objectData;
                const myJsonObj = Object.assign({}, ...myJsonData);
                const myTime = req.body.time;
                const myExercise = req.body.exercise;

                let score = 0;
                let totalAnswerTrue = 0;
                const exercises = await Exercise.find({
                    lessonID: lesson._id,
                });
                exercises.forEach(function (exercise) {
                    if (
                        myJsonObj.name == exercise._id &&
                        myJsonObj.value == exercise.answer
                    ) {
                        score += 100 / exercises.length;
                        totalAnswerTrue++;
                    }
                });
                const findStatistical = await Statistical.findOne({
                    userID: ObjectId(req.signedCookies.userId),
                    lessonID: lesson._id,
                });
                if (findStatistical) {
                    if (req.body.currentQa == exercises.length) {
                        await Statistical.updateOne(
                            { _id: findStatistical._id },
                            {
                                time: myTime,
                                $inc: {
                                    totalAnswerTrue: totalAnswerTrue,
                                    score: score,
                                },
                                isDone: true,
                            }
                        );
                    } else {
                        await Statistical.updateOne(
                            { _id: findStatistical._id },
                            {
                                time: myTime,
                                $inc: {
                                    totalAnswerTrue: totalAnswerTrue,
                                    score: score,
                                },
                            }
                        );
                    }

                    if (Object.keys(myJsonObj).length === 0) {
                        const result = new Result({
                            statisticalID: findStatistical._id,
                            exerciseID: myExercise,
                            option: "",
                        });
                        await result.save();
                    } else {
                        const result = new Result({
                            statisticalID: findStatistical._id,
                            exerciseID: myJsonObj.name,
                            option: myJsonObj.value,
                        });
                        await result.save();
                    }
                } else {
                    const statistical = new Statistical({
                        lessonID: lesson._id,
                        userID: req.signedCookies.userId,
                        totalAnswerTrue: totalAnswerTrue,
                        score: score,
                        time: myTime,
                        isDone: false,
                    });
                    await statistical.save();

                    if (Object.keys(myJsonObj).length === 0) {
                        const result = new Result({
                            statisticalID: statistical._id,
                            exerciseID: myExercise,
                            option: "",
                        });
                        await result.save();
                    } else {
                        const result = new Result({
                            statisticalID: statistical._id,
                            exerciseID: myJsonObj.name,
                            option: myJsonObj.value,
                        });
                        await result.save();
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    }


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
                res.render("error",{layout:""});
            }
        } else {
            res.render("error",{layout:""});
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
            res.render("error",{layout:""});
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
                    // categories.forEach((category) => {
                    //     if (row[9].toString().toLowerCase() === category.type) {
                    //         row[9] = category._id;
                    //     }
                    // });

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

