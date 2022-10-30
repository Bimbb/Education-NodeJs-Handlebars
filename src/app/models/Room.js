const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Room = new Schema(
    {
        roomName: { type: String },
        socketID: { type: String },
        master: { type: String },
        avatar: { type: String },
        gradeID: { type: Number },
        subjectID: { type: Schema.Types.ObjectId },
        unitID: { type: Schema.Types.ObjectId },
        lessionID: { type: Schema.Types.ObjectId },
        status: { type: String, default: "Đang chờ..." },
        members: [
            {
                socketID: { type: String },
                userName: { type: String },
                avatar: { type: String },
                fullname: { type: String },
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Room", Room);
