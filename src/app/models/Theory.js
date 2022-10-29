const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);

const Schema = mongoose.Schema;

const Theory = new Schema(
    {
        content: { type: String, require: true },
        audioUrl: { type: String, default: "" },
        lessonID: { type: Schema.Types.ObjectId, ref: "Lesson" },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Theory", Theory);
