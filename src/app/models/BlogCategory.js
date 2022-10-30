const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BlogCategory = new Schema(
    {
        category: { type: String, require: true },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Blog-Category", BlogCategory);
