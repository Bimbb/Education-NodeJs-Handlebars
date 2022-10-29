const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");

const Schema = mongoose.Schema;

const Exercise = new Schema(
    {
        question: { type: String, require: true },
        option1: { type: String, require: true },
        option2: { type: String, require: true },
        option3: { type: String, default: "" },
        option4: { type: String, default: "" },
        answer: { type: String, require: true },
        explain: { type: String },
        recommend: { type: String },
        ceID: {
            type: Schema.Types.ObjectId,
            ref: "Exercise-Category",
            require: true,
        },
        lessonID: {
            type: Schema.Types.ObjectId,
            ref: "Lesson",
            require: true,
        },
        audioUrl: { type: String },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Exercise", Exercise);
