const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);

const Schema = mongoose.Schema;

const Unit = new Schema(
    {
        name: { type: String, require: true },
        subjectID: { type: Schema.Types.ObjectId, ref: "Subject" },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Unit", Unit);
