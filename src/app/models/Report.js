const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Report = new Schema(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User" },
        content: { type: String },
        summary: { type: String },
        read:{type: String},
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Report", Report);
