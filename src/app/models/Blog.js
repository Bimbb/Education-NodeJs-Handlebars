const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Blog = new Schema(
    {
        content: { type: String, require: true },
        title: { type: String, require: true },
        image: { type: String, require: true },
        slug: { type: String, slug: "title", unique: true },
        view: { type: Number, default: 1 },
        bcID: {
            type: Schema.Types.ObjectId,
            ref: "Blog-Category",
            require: true,
        },
        userID: { type: Schema.Types.ObjectId, ref: "User", require: true },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Blog", Blog);
