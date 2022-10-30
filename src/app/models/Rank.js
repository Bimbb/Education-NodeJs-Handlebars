const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Rank = new Schema(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User" },
        score: { type: Number },
        victory: { type: Number },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Rank", Rank);
