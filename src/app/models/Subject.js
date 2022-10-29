const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);

const Schema = mongoose.Schema;

const Subject = new Schema(
    {
        name: { type: String, index: true },
        gradeID: { type: Schema.Types.ObjectId, ref: "Grade" },
        slug: { type: String, slug: ["name"], unique: true },
    },
    {
        timestamps: true,
    }
);
Subject.index({ name: "text" });
module.exports = mongoose.model("Subject", Subject);
