const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);



const Grade = new Schema(
    {
        name: { type: String, require: true },
        icon: { type: String },
        slug: { type: String, slug: ["name", "gradeID"], unique: true },
    },   
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Grade", Grade);
