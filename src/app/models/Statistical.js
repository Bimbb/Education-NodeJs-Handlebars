const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Statistical = new Schema(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User" },
        lessonID: { type: Schema.Types.ObjectId, ref: "Lesson" },
        score: { type: Number },
        totalAnswerTrue: { type: Number },
        time: { type: String },
        isDone: { type: Boolean },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Statistical", Statistical);
