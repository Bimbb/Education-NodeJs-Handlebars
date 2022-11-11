const Rank = require("../models/Rank");
const Room = require("../models/Room");
const User = require("../models/User");
const path = require("path");
const XLSX = require("xlsx");

class CompetitionController {

    // [GET]/competition/ranks
    async ranks(req, res) {

        const ranks = await Rank.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userID",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $sort: { score: -1, victory: -1 } },
        ]);
        res.render("competition/ranks", {
            ranks,
            layout: "admin",
        });
    }

    async detail(req, res) {
        const room = await Room.aggregate([
            {
                $match: {
                    roomName: req.params.id,
                },
            },
            {
                $lookup: {
                    from: "grades",
                    localField: "gradeId",
                    foreignField: "_id",
                    as: "grade",
                },
            },
           
        ]);
        if (room.length > 0) {
            res.render("competition/detail", {
                room,
            });
        } else {
            res.redirect("/competition");
        }
    }
    //[GET]/competition/ranks/week
    async ranksWeek(req, res) {
        const ranks = await Rank.aggregate([
            {
                $match: {
                    updatedAt: {
                        $gt: new Date(req.body.startOfWeek),
                        $lt: new Date(req.body.endOfWeek),
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userID",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $sort: { score: -1, victory: -1 } },
            { $limit: 10 },
        ]);

        res.render("helper/ranks", { ranks, layout: "" });
    }

    //[GET]/competition/ranks/month
    async ranksMonth(req, res) {
        const ranks = await Rank.aggregate([
            {
                $addFields: {
                    month_document: { $month: "$updatedAt" },
                    month_date: { $month: new Date(req.body.month) },
                },
            },
            {
                // the expression is equivalent to using the $eq operator
                $match: { $expr: { $eq: ["$month_document", "$month_date"] } },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userID",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $sort: { score: -1, victory: -1 } },
            { $limit: 10 },
        ]);

        res.render("helper/ranks", { ranks, layout: "" });
    }






}

module.exports = new CompetitionController();
