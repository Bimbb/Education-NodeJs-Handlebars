const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");


const Schema = mongoose.Schema;

const Admin = new Schema(
    {
        userName: { type: String, unique: true },
        password: { type: String },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Admin", Admin);
