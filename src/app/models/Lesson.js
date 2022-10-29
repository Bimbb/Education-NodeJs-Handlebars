const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);

const Schema = mongoose.Schema;

const Lesson = new Schema(
    {
        name: { type: String, require: true },
        lessonNumber: { type: Number, require: true },
        unitID: { type: Schema.Types.ObjectId, ref: "Unit", require: true },
        slug: { type: String, slug: "name", unique: true },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Lesson", Lesson);
